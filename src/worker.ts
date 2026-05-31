import { contact, services, sessionEvents } from "./lib/site-data";

type SessionEventStatus = "scheduled" | "cancelled" | "sold-out";

type AdminService = {
  slug: string;
  number: string;
  name: string;
  tagline: string;
  short: string;
  body: string[];
  duration: string;
  price: string;
  image: string;
  location: string;
};

type AdminSessionEvent = {
  id: string;
  serviceSlug: string;
  date: string;
  startTime: string;
  endTime?: string;
  title: string;
  location: string;
  summary: string;
  bookingUrl?: string;
  status?: SessionEventStatus;
};

type SiteCopyBlock = {
  key: string;
  value: string;
};

type NewsPostDraft = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: "draft" | "published";
  publishedAt?: string;
  updatedAt: string;
};

type ContentDocument<T> = {
  version: 1;
  updatedAt: string;
  data: T;
};

type PublicContentResponse = {
  services: AdminService[];
  sessions: AdminSessionEvent[];
  siteCopy: SiteCopyBlock[];
};

const CONTENT_KEYS = {
  services: "content:services:v1",
  sessions: "content:sessions:v1",
  siteCopy: "content:sitecopy:v1",
  news: "content:news:v1",
} as const;

const SESSION_COOKIE = "vl_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const LOGIN_RATE_KEY_PREFIX = "rate:login";
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_LOCK_SECONDS = 60 * 10;
const PBKDF2_ITERATIONS_MIN = 100_000;
const PBKDF2_ITERATIONS_MAX = 100_000;

const defaultServices: AdminService[] = services.map((service) => ({
  ...service,
  location: contact.address,
}));

const defaultSessions: AdminSessionEvent[] = sessionEvents.map((event) => ({
  ...event,
}));

const defaultSiteCopy: SiteCopyBlock[] = [
  { key: "default_location", value: contact.address },
  { key: "default_booking_email", value: contact.email },
  { key: "default_booking_phone", value: contact.phone },
];

const defaultNews: NewsPostDraft[] = [];

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...securityHeaders(),
      ...(init.headers ?? {}),
    },
  });
}

function html(content: string, nonce: string, init: ResponseInit = {}): Response {
  return new Response(content, {
    ...init,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...securityHeaders(nonce),
      ...(init.headers ?? {}),
    },
  });
}

function securityHeaders(nonce?: string): Record<string, string> {
  const csp = nonce
    ? `default-src 'self'; img-src 'self' data: https:; style-src 'self' 'nonce-${nonce}'; script-src 'self' 'nonce-${nonce}'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self';`
    : "default-src 'self'; img-src 'self' data: https:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self';";
  return {
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "same-origin",
    "content-security-policy": csp,
  };
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type PasswordRecord = {
  iterations: number;
  saltHex: string;
  hashHex: string;
};

type PasswordRecordParseResult =
  | { ok: true; value: PasswordRecord }
  | { ok: false; reason: "missing" | "control_chars" | "shape" | "algorithm" | "iterations" | "salt" | "hash" };

function fromHex(input: string): Uint8Array {
  if (!/^[\da-fA-F]+$/.test(input) || input.length % 2 !== 0) {
    throw new Error("invalid hex");
  }
  const bytes = new Uint8Array(input.length / 2);
  for (let i = 0; i < input.length; i += 2) {
    bytes[i / 2] = Number.parseInt(input.slice(i, i + 2), 16);
  }
  return bytes;
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

function normalizePasswordRecord(raw: string | undefined): PasswordRecordParseResult {
  if (!raw) return { ok: false, reason: "missing" };
  let normalized = raw.trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  if (/[\u0000-\u001f\u007f]/.test(normalized)) {
    return { ok: false, reason: "control_chars" };
  }

  const parts = normalized.split("$");
  if (parts.length !== 5) return { ok: false, reason: "shape" };
  const [scheme, hashName, rawIterations, saltHexRaw, hashHexRaw] = parts;
  if (scheme !== "pbkdf2" || hashName !== "sha256") {
    return { ok: false, reason: "algorithm" };
  }

  const iterations = Number.parseInt(rawIterations, 10);
  if (
    !Number.isFinite(iterations) ||
    iterations < PBKDF2_ITERATIONS_MIN ||
    iterations > PBKDF2_ITERATIONS_MAX
  ) {
    return { ok: false, reason: "iterations" };
  }

  const saltHex = saltHexRaw.toLowerCase();
  const hashHex = hashHexRaw.toLowerCase();
  if (!/^[\da-f]{32}$/.test(saltHex)) return { ok: false, reason: "salt" };
  if (!/^[\da-f]{64}$/.test(hashHex)) return { ok: false, reason: "hash" };

  return {
    ok: true,
    value: {
      iterations,
      saltHex,
      hashHex,
    },
  };
}

async function pbkdf2Sha256Hex(password: string, saltHex: string, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(fromHex(saltHex)),
      iterations,
    },
    keyMaterial,
    256,
  );
  return toHex(bits);
}

function makeNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return base64UrlEncode(String.fromCharCode(...bytes));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(sig)));
}

function parseCookies(cookieHeader: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const token of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = token.trim().split("=");
    if (!rawName || rawValue.length === 0) continue;
    map.set(rawName, rawValue.join("="));
  }
  return map;
}

type SessionPayload = {
  sub: string;
  csrf: string;
  exp: number;
};

async function createSessionCookie(username: string, secret: string): Promise<{ cookie: string; csrf: string }> {
  const payload: SessionPayload = {
    sub: username,
    csrf: crypto.randomUUID(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacSign(encodedPayload, secret);
  const token = `${encodedPayload}.${signature}`;
  return {
    csrf: payload.csrf,
    cookie: `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`,
  };
}

async function verifySession(request: Request, env: Env): Promise<SessionPayload | null> {
  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) return null;
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return null;
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;
  const expected = await hmacSign(payloadPart, sessionSecret);
  if (!timingSafeEqual(expected, signaturePart)) return null;
  const payloadRaw = base64UrlDecode(payloadPart);
  const payload = JSON.parse(payloadRaw) as SessionPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

async function getRateState(env: Env, ip: string): Promise<{ attempts: number; lockedUntil?: number }> {
  if (!env.CONTENT_KV) return { attempts: 0 };
  const raw = await env.CONTENT_KV.get(`${LOGIN_RATE_KEY_PREFIX}:${ip}`, { type: "text" });
  if (!raw) return { attempts: 0 };
  try {
    return JSON.parse(raw) as { attempts: number; lockedUntil?: number };
  } catch {
    return { attempts: 0 };
  }
}

async function setRateState(env: Env, ip: string, state: { attempts: number; lockedUntil?: number }): Promise<void> {
  if (!env.CONTENT_KV) return;
  await env.CONTENT_KV.put(`${LOGIN_RATE_KEY_PREFIX}:${ip}`, JSON.stringify(state), {
    expirationTtl: LOGIN_LOCK_SECONDS,
  });
}

function getClientIp(request: Request): string {
  const incoming = request.headers.get("cf-connecting-ip");
  return incoming ?? "unknown";
}

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function hasIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function hasIsoTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

function nowIso(): string {
  return new Date().toISOString();
}

async function readDoc<T>(env: Env, key: string, fallback: T): Promise<ContentDocument<T>> {
  if (!env.CONTENT_KV) {
    return { version: 1, updatedAt: nowIso(), data: fallback };
  }
  const raw = await env.CONTENT_KV.get(key, { type: "text" });
  if (!raw) {
    const bootstrapped: ContentDocument<T> = { version: 1, updatedAt: nowIso(), data: fallback };
    await env.CONTENT_KV.put(key, JSON.stringify(bootstrapped));
    return bootstrapped;
  }
  try {
    const parsed = JSON.parse(raw) as ContentDocument<T>;
    if (!parsed || parsed.version !== 1) throw new Error("invalid document");
    return parsed;
  } catch {
    const reset: ContentDocument<T> = { version: 1, updatedAt: nowIso(), data: fallback };
    await env.CONTENT_KV.put(key, JSON.stringify(reset));
    return reset;
  }
}

async function writeDoc<T>(env: Env, key: string, data: T): Promise<ContentDocument<T>> {
  if (!env.CONTENT_KV) throw new Error("CONTENT_KV binding missing");
  const doc: ContentDocument<T> = {
    version: 1,
    updatedAt: nowIso(),
    data,
  };
  await env.CONTENT_KV.put(key, JSON.stringify(doc));
  return doc;
}

async function getAdminContent(env: Env): Promise<{
  services: ContentDocument<AdminService[]>;
  sessions: ContentDocument<AdminSessionEvent[]>;
  siteCopy: ContentDocument<SiteCopyBlock[]>;
  news: ContentDocument<NewsPostDraft[]>;
}> {
  const [servicesDoc, sessionsDoc, siteCopyDoc, newsDoc] = await Promise.all([
    readDoc(env, CONTENT_KEYS.services, defaultServices),
    readDoc(env, CONTENT_KEYS.sessions, defaultSessions),
    readDoc(env, CONTENT_KEYS.siteCopy, defaultSiteCopy),
    readDoc(env, CONTENT_KEYS.news, defaultNews),
  ]);
  return {
    services: servicesDoc,
    sessions: sessionsDoc,
    siteCopy: siteCopyDoc,
    news: newsDoc,
  };
}

function validateServices(servicesInput: AdminService[]): string | null {
  const seen = new Set<string>();
  for (const item of servicesInput) {
    const slug = normalizeSlug(item.slug);
    if (!slug) return "Service slug is required.";
    if (seen.has(slug)) return "Service slugs must be unique.";
    seen.add(slug);
    if (!item.name.trim()) return `Service ${slug} is missing name.`;
    if (!item.price.trim()) return `Service ${slug} is missing price.`;
    if (!item.duration.trim()) return `Service ${slug} is missing duration.`;
  }
  return null;
}

function validateSessions(sessionsInput: AdminSessionEvent[], serviceSlugs: Set<string>): string | null {
  const seen = new Set<string>();
  for (const item of sessionsInput) {
    if (!item.id.trim()) return "Session id is required.";
    if (seen.has(item.id)) return `Session id must be unique: ${item.id}`;
    seen.add(item.id);
    if (!serviceSlugs.has(item.serviceSlug)) return `Unknown service slug in session ${item.id}.`;
    if (!hasIsoDate(item.date)) return `Session ${item.id} must use YYYY-MM-DD date.`;
    if (!hasIsoTime(item.startTime)) return `Session ${item.id} startTime must use HH:MM.`;
    if (item.endTime && !hasIsoTime(item.endTime)) return `Session ${item.id} endTime must use HH:MM.`;
    if (!item.title.trim()) return `Session ${item.id} title is required.`;
    if (!item.location.trim()) return `Session ${item.id} location is required.`;
    if (!item.summary.trim()) return `Session ${item.id} summary is required.`;
  }
  return null;
}

async function requireAuth(request: Request, env: Env): Promise<Response | SessionPayload> {
  const session = await verifySession(request, env);
  if (!session) {
    return json({ error: "unauthorized" }, { status: 401 });
  }
  return session;
}

async function requireCsrf(request: Request, session: SessionPayload): Promise<Response | null> {
  const token = request.headers.get("x-csrf-token");
  if (!token || !timingSafeEqual(token, session.csrf)) {
    return json({ error: "invalid_csrf_token" }, { status: 403 });
  }
  return null;
}

function renderAdminLoginHtml(nonce: string): string {
  return `<!doctype html>
<html lang="fi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Voima Lyhty Admin - Kirjaudu</title>
  <link rel="stylesheet" href="/admin/login.css" />
</head>
<body>
  <main class="login-shell">
    <section class="login-grid">
      <div class="brand">
        <h1>Voima Lyhty</h1>
        <p>Hallinnoi sessioita, palveluiden sisältöjä ja sivuston tekstejä turvallisesti yhdestä näkymästä.</p>
      </div>
      <div class="panel">
        <p class="eyebrow">Ylläpito</p>
        <h2>Kirjaudu sisään</h2>
        <p class="help">Kirjaudu ylläpitonäkymään käyttäjätunnuksella ja salasanalla.</p>
        <form id="login-form" novalidate>
          <div class="field">
            <label for="login-user">Käyttäjätunnus</label>
            <input id="login-user" autocomplete="username" required />
          </div>
          <div class="field">
            <label for="login-pass">Salasana</label>
            <input id="login-pass" type="password" autocomplete="current-password" required />
          </div>
          <div class="actions">
            <button id="login-btn" type="submit">Kirjaudu</button>
          </div>
          <div id="login-status" class="status" role="status" aria-live="polite"></div>
        </form>
      </div>
    </section>
  </main>
  <script nonce="${nonce}" src="/admin/login.js" defer></script>
</body>
</html>`;
}

function renderAdminHtml(nonce: string): string {
  return `<!doctype html>
<html lang="fi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Voima Lyhty Admin</title>
  <link rel="stylesheet" href="/admin/panel.css" />
</head>
<body>
  <main class="shell">
    <header class="heading">
      <div>
        <h1>Voima Lyhty Admin</h1>
        <p>Päivitä sessiot, palvelut ja sivutekstit ilman layout-hyppyjä.</p>
      </div>
      <button id="logout-btn">Kirjaudu ulos</button>
    </header>
    <section class="panel">
      <div id="admin-tabs" class="tabs"></div>
      <div id="admin-sections"></div>
      <div id="admin-status" class="status" role="status" aria-live="polite"></div>
    </section>
  </main>
  <script nonce="${nonce}" src="/admin/utils.js" defer></script>
  <script nonce="${nonce}" src="/admin/panel.js" defer></script>
</body>
</html>`;
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const ip = getClientIp(request);
  const rateState = await getRateState(env, ip);
  const now = Math.floor(Date.now() / 1000);
  if (rateState.lockedUntil && rateState.lockedUntil > now) {
    return json({ error: "locked_try_later" }, { status: 429 });
  }

  if (!env.ADMIN_USER || !env.SESSION_SECRET || !env.ADMIN_PASSWORD_RECORD) {
    console.error(
      JSON.stringify({
        event: "admin_auth_setup_error",
        error: "missing_worker_secrets",
      }),
    );
    return json({ error: "missing_worker_secrets" }, { status: 500 });
  }

  const body = (await request.json()) as { username?: string; password?: string };
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const userOk = timingSafeEqual(username, env.ADMIN_USER);

  const parsedRecord = normalizePasswordRecord(env.ADMIN_PASSWORD_RECORD);
  if (!parsedRecord.ok) {
    console.error(
      JSON.stringify({
        event: "admin_auth_setup_error",
        error: "invalid_password_record",
        reason: parsedRecord.reason,
      }),
    );
    return json({ error: "invalid_password_record" }, { status: 500 });
  }
  let derived = "";
  try {
    derived = await pbkdf2Sha256Hex(
      password,
      parsedRecord.value.saltHex,
      parsedRecord.value.iterations,
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "admin_auth_runtime_error",
        error: "pbkdf2_runtime_not_supported",
        message: error instanceof Error ? error.message : "unknown",
      }),
    );
    return json({ error: "invalid_password_record" }, { status: 500 });
  }
  const passOk = timingSafeEqual(derived, parsedRecord.value.hashHex);

  if (!userOk || !passOk) {
    const nextAttempts = (rateState.attempts ?? 0) + 1;
    await setRateState(env, ip, {
      attempts: nextAttempts,
      lockedUntil: nextAttempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_LOCK_SECONDS : undefined,
    });
    return json({ error: "invalid_credentials" }, { status: 401 });
  }

  await setRateState(env, ip, { attempts: 0 });
  const session = await createSessionCookie(username, env.SESSION_SECRET);
  return json(
    { ok: true, csrfToken: session.csrf },
    {
      headers: {
        "set-cookie": session.cookie,
      },
    },
  );
}

async function handleApi(request: Request, env: Env, path: string): Promise<Response> {
  if (path === "/api/admin/auth/login" && request.method === "POST") {
    return handleLogin(request, env);
  }
  if (path === "/api/content/public" && request.method === "GET") {
    const content = await getAdminContent(env);
    const response: PublicContentResponse = {
      services: content.services.data,
      sessions: content.sessions.data,
      siteCopy: content.siteCopy.data,
    };
    return json(response, {
      headers: {
        "cache-control": "public, max-age=90, stale-while-revalidate=600",
      },
    });
  }

  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const session = auth;

  if (path === "/api/admin/auth/logout" && request.method === "POST") {
    return json(
      { ok: true },
      {
        headers: {
          "set-cookie": clearSessionCookie(),
        },
      },
    );
  }

  if (path === "/api/admin/content" && request.method === "GET") {
    const content = await getAdminContent(env);
    return json({ csrfToken: session.csrf, content });
  }

  if (request.method === "PUT") {
    const csrfError = await requireCsrf(request, session);
    if (csrfError) return csrfError;
  }

  if (path === "/api/admin/services" && request.method === "PUT") {
    const body = (await request.json()) as { services?: AdminService[] };
    const nextServices = Array.isArray(body.services) ? body.services : [];
    const normalizedServices = nextServices.map((item) => ({
      ...item,
      slug: normalizeSlug(item.slug),
      body: Array.isArray(item.body) ? item.body.filter((entry) => entry.trim()) : [],
    }));
    const err = validateServices(normalizedServices);
    if (err) return json({ error: err }, { status: 400 });
    const servicesDoc = await writeDoc(env, CONTENT_KEYS.services, normalizedServices);
    return json({ services: servicesDoc });
  }

  if (path === "/api/admin/sessions" && request.method === "PUT") {
    const body = (await request.json()) as { sessions?: AdminSessionEvent[] };
    const content = await getAdminContent(env);
    const nextSessions = Array.isArray(body.sessions) ? body.sessions : [];
    const normalized = nextSessions.map((item) => ({
      ...item,
      id: item.id.trim(),
      serviceSlug: normalizeSlug(item.serviceSlug),
      status: (item.status ?? "scheduled") as SessionEventStatus,
    }));
    const err = validateSessions(
      normalized,
      new Set(content.services.data.map((service) => service.slug)),
    );
    if (err) return json({ error: err }, { status: 400 });
    const sessionsDoc = await writeDoc(env, CONTENT_KEYS.sessions, normalized);
    return json({ sessions: sessionsDoc });
  }

  if (path === "/api/admin/sitecopy" && request.method === "PUT") {
    const body = (await request.json()) as { items?: SiteCopyBlock[] };
    const nextItems = Array.isArray(body.items) ? body.items : [];
    const normalized = nextItems
      .map((item) => ({
        key: item.key.trim(),
        value: item.value.trim(),
      }))
      .filter((item) => item.key.length > 0);
    const siteCopyDoc = await writeDoc(env, CONTENT_KEYS.siteCopy, normalized);
    return json({ siteCopy: siteCopyDoc });
  }

  if (path === "/api/admin/news" && request.method === "PUT") {
    const body = (await request.json()) as { posts?: NewsPostDraft[] };
    const posts = Array.isArray(body.posts) ? body.posts : [];
    const normalized = posts.map((post) => ({
      ...post,
      slug: normalizeSlug(post.slug),
      updatedAt: nowIso(),
    }));
    const newsDoc = await writeDoc(env, CONTENT_KEYS.news, normalized);
    return json({ news: newsDoc });
  }

  return json({ error: "not_found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/admin" && request.method === "GET") {
        const session = await verifySession(request, env);
        if (!session) return Response.redirect(new URL("/admin/login", url), 302);
        const nonce = makeNonce();
        return html(renderAdminHtml(nonce), nonce, { status: 200 });
      }

      if (path === "/admin/login" && request.method === "GET") {
        const session = await verifySession(request, env);
        if (session) return Response.redirect(new URL("/admin", url), 302);
        const nonce = makeNonce();
        return html(renderAdminLoginHtml(nonce), nonce, { status: 200 });
      }

      if (path.startsWith("/api/")) {
        return handleApi(request, env, path);
      }

      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        return env.ASSETS.fetch(request);
      }

      return json(
        {
          error: "assets_binding_missing",
          message:
            "ASSETS-binding puuttuu tästä ajosta. Aja paikallisesti komennolla `npm run preview` (wrangler dev + dist assets).",
        },
        { status: 500 },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unexpected_error";
      return json({ error: message }, { status: 500 });
    }
  },
};
