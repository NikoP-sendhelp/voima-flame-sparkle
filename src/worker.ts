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
  <style nonce="${nonce}">
    :root {
      color-scheme: light;
      font-family: "Karla", ui-sans-serif, system-ui, sans-serif;
      --bg-1: #f4efe6;
      --bg-2: #fbf7f0;
      --panel: #fffdf8;
      --ink: #2c241d;
      --muted: #6f6658;
      --line: #e3d8c7;
      --accent: #e59243;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100svh;
      display: grid;
      place-items: center;
      padding: 24px;
      color: var(--ink);
      background:
        radial-gradient(circle at 12% 14%, rgba(229,146,67,.24), transparent 28rem),
        linear-gradient(145deg, var(--bg-2), var(--bg-1));
    }
    .login-shell { width: min(100%, 980px); }
    .login-grid {
      display: grid;
      grid-template-columns: 1fr;
      border: 1px solid var(--line);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 1.4rem 3.4rem rgba(23,18,14,.10);
      background: var(--panel);
    }
    .brand {
      padding: 38px 30px 28px;
      background:
        radial-gradient(circle at 85% 8%, rgba(229,146,67,.25), transparent 18rem),
        linear-gradient(155deg, #2b241e, #35291f 60%, #6d3f20);
      color: #f8f0e4;
      border-bottom: 1px solid rgba(248,240,228,.2);
    }
    .brand h1 {
      margin: 0;
      font-family: "Cormorant Garamond", ui-serif, Georgia, serif;
      font-size: clamp(2rem, 4vw, 3.1rem);
      font-style: italic;
      letter-spacing: 0;
      line-height: 1;
    }
    .brand p {
      margin: 12px 0 0;
      max-width: 42ch;
      font-size: .94rem;
      line-height: 1.55;
      color: rgba(248,240,228,.84);
    }
    .panel { padding: 30px; }
    .eyebrow {
      margin: 0;
      font-size: .67rem;
      text-transform: uppercase;
      letter-spacing: .13em;
      font-weight: 700;
      color: var(--muted);
    }
    h2 {
      margin: 10px 0 0;
      font-family: "Cormorant Garamond", ui-serif, Georgia, serif;
      font-size: 2rem;
      font-style: italic;
      line-height: 1.05;
      letter-spacing: 0;
    }
    .help {
      margin: 12px 0 22px;
      color: var(--muted);
      line-height: 1.55;
      font-size: .94rem;
    }
    .field { margin-bottom: 14px; }
    label {
      display: block;
      margin-bottom: 6px;
      font-size: .67rem;
      text-transform: uppercase;
      letter-spacing: .12em;
      font-weight: 700;
      color: #4f4436;
    }
    input {
      width: 100%;
      min-height: 44px;
      border: 1px solid #d9ccb7;
      border-radius: 12px;
      padding: 10px 12px;
      font: inherit;
      color: var(--ink);
      background: #fff;
      transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
    }
    input:focus-visible {
      outline: none;
      border-color: #c7722d;
      box-shadow: 0 0 0 3px rgba(229,146,67,.24);
    }
    .actions {
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    button {
      border: 1px solid var(--accent);
      border-radius: 999px;
      min-height: 44px;
      padding: 10px 18px;
      font-size: .7rem;
      letter-spacing: .14em;
      text-transform: uppercase;
      font-weight: 800;
      cursor: pointer;
      background: var(--accent);
      color: #22140a;
      transition: transform .16s ease, filter .16s ease, opacity .16s ease;
    }
    button:hover { transform: translateY(-1px); filter: brightness(1.02); }
    button:disabled {
      opacity: .62;
      cursor: progress;
      transform: none;
      filter: none;
    }
    .status {
      min-height: 24px;
      margin-top: 14px;
      font-size: .9rem;
      line-height: 1.4;
    }
    .status.error { color: #9f2f1f; }
    .status.ok { color: #27653c; }
    @media (min-width: 860px) {
      .login-grid { grid-template-columns: minmax(280px, 1fr) minmax(380px, 1fr); }
      .brand { min-height: 100%; border-bottom: 0; border-right: 1px solid rgba(248,240,228,.2); }
      .panel { padding: 40px; }
    }
  </style>
</head>
<body>
  <main class="login-shell">
    <section class="login-grid">
      <div class="brand">
        <h1>Voima Lyhty</h1>
        <p>
          Hallinnoi sessioita, palveluiden sisältöjä ja sivuston tekstejä turvallisesti
          yhdestä näkymästä.
        </p>
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
  <script nonce="${nonce}">
    const form = document.getElementById("login-form");
    const button = document.getElementById("login-btn");
    const status = document.getElementById("login-status");
    const userInput = document.getElementById("login-user");
    const passInput = document.getElementById("login-pass");
    const setupMessages = {
      missing_worker_secrets: "Ylläpidon asetukset puuttuvat. Lisää ADMIN_USER, ADMIN_PASSWORD_RECORD ja SESSION_SECRET.",
      invalid_password_record: "ADMIN_PASSWORD_RECORD on virheellisessä muodossa. Luo uusi arvo ja liitä se ilman lainausmerkkejä.",
      locked_try_later: "Liian monta yritystä. Odota hetki ja yritä uudelleen.",
    };

    function setStatus(message, kind = "error") {
      status.textContent = message;
      status.className = "status " + (kind === "ok" ? "ok" : "error");
    }

    async function login(event) {
      event.preventDefault();
      const username = userInput.value.trim();
      const password = passInput.value;
      if (!username || !password) {
        setStatus("Täytä käyttäjätunnus ja salasana.");
        return;
      }

      button.disabled = true;
      button.textContent = "Kirjaudutaan...";
      setStatus("", "ok");
      try {
        const response = await fetch("/api/admin/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ username, password }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = setupMessages[payload.error] || "Kirjautuminen epäonnistui. Tarkista tunnukset.";
          setStatus(message);
          return;
        }
        setStatus("Kirjautuminen onnistui. Siirrytään ylläpitoon...", "ok");
        window.location.assign("/admin");
      } catch {
        setStatus("Yhteysvirhe. Yritä hetken päästä uudelleen.");
      } finally {
        button.disabled = false;
        button.textContent = "Kirjaudu";
      }
    }

    form.addEventListener("submit", login);
    userInput.focus();
  </script>
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
  <style nonce="${nonce}">
    :root { color-scheme: light; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; background: #f4efe6; color: #2c241d; }
    .shell { max-width: 1080px; margin: 0 auto; padding: 24px; }
    .panel { background: #fffaf3; border: 1px solid #e3d8c7; border-radius: 16px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.06); }
    .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .tab { border: 1px solid #d7c6ac; border-radius: 999px; background: #fff; padding: 8px 14px; cursor: pointer; }
    .tab.active { background: #e59243; color: #21150d; border-color: #e59243; font-weight: 700; }
    .row { display: grid; gap: 10px; margin-bottom: 12px; }
    .cols-2 { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .cols-3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
    label { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #6b5a46; }
    input, textarea, select { width: 100%; border: 1px solid #d8cabb; border-radius: 10px; padding: 9px 10px; font: inherit; background: #fff; }
    textarea { min-height: 100px; }
    button { border: 1px solid #d7c6ac; border-radius: 999px; background: #fff; padding: 9px 14px; cursor: pointer; }
    button.primary { background: #e59243; border-color: #e59243; color: #22140a; font-weight: 700; }
    button.danger { border-color: #c96857; color: #9f2f1f; }
    .stack { display: grid; gap: 8px; }
    .item { border: 1px solid #e5d8ca; border-radius: 12px; background: #fff; padding: 10px; }
    .hidden { display: none; }
    .muted { color: #6f6658; font-size: 14px; }
    .line { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .alert { margin-top: 10px; min-height: 22px; font-size: 14px; }
    @media (max-width: 760px) { .cols-2, .cols-3 { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="shell">
    <h1>Voima Lyhty Admin</h1>
    <p class="muted">Muokkaa sessioita ja palvelusisältöä turvallisesti yhdessä paikassa.</p>
    <div id="app" class="panel">
      <div class="line">
        <div class="tabs">
          <button class="tab active" data-tab="sessions">Sessiot</button>
          <button class="tab" data-tab="services">Palvelut</button>
          <button class="tab" data-tab="sitecopy">Sivutekstit</button>
          <button class="tab" data-tab="news">Uutiset (pohja)</button>
          <button class="tab" data-tab="settings">Asetukset</button>
        </div>
        <button id="logout-btn">Kirjaudu ulos</button>
      </div>
      <div id="sessions" class="tab-panel"></div>
      <div id="services" class="tab-panel hidden"></div>
      <div id="sitecopy" class="tab-panel hidden"></div>
      <div id="news" class="tab-panel hidden"></div>
      <div id="settings" class="tab-panel hidden"></div>
      <div class="alert" id="app-alert"></div>
    </div>
  </div>
  <script nonce="${nonce}">
    const state = { csrfToken: "", content: null };
    const $ = (id) => document.getElementById(id);
    const appAlert = $("app-alert");

    const request = async (url, options = {}) => {
      const headers = options.headers || {};
      if (state.csrfToken) headers["x-csrf-token"] = state.csrfToken;
      const res = await fetch(url, { ...options, headers, credentials: "same-origin" });
      const text = await res.text();
      const body = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(body.error || "Request failed");
      return body;
    };

    const showAlert = (target, message, isError = false) => {
      target.textContent = message;
      target.style.color = isError ? "#a22a1b" : "#2b6e36";
    };

    const renderSessions = () => {
      const sessions = state.content.sessions.data;
      const services = state.content.services.data;
      const serviceOptions = services.map((s) => '<option value="' + s.slug + '">' + s.name + '</option>').join("");
      const list = sessions.map((session) => \`
        <div class="item" data-session-id="\${session.id}">
          <div class="line"><strong>\${session.title}</strong><button class="danger" data-action="delete-session" data-id="\${session.id}">Delete</button></div>
          <div class="muted">\${session.date} \${session.startTime}\${session.endTime ? "-" + session.endTime : ""} · \${session.location}</div>
        </div>\`
      ).join("");
      $("sessions").innerHTML = \`
        <div class="stack">\${list || '<p class="muted">Ei sessioita.</p>'}</div>
        <hr />
        <h3>Lisää sessio</h3>
        <div class="row cols-3">
          <div><label>ID</label><input id="new-session-id" /></div>
          <div><label>Service</label><select id="new-session-service">\${serviceOptions}</select></div>
          <div><label>Date</label><input id="new-session-date" placeholder="2026-06-10" /></div>
        </div>
        <div class="row cols-3">
          <div><label>Start</label><input id="new-session-start" placeholder="18:30" /></div>
          <div><label>End</label><input id="new-session-end" placeholder="19:30" /></div>
          <div><label>Status</label><select id="new-session-status"><option>scheduled</option><option>cancelled</option><option>sold-out</option></select></div>
        </div>
        <div class="row cols-2">
          <div><label>Title</label><input id="new-session-title" /></div>
          <div><label>Location</label><input id="new-session-location" /></div>
        </div>
        <div class="row">
          <div><label>Summary</label><textarea id="new-session-summary"></textarea></div>
        </div>
        <button class="primary" id="add-session">Lisää sessio</button>
      \`;
      document.querySelectorAll('[data-action="delete-session"]').forEach((button) => {
        button.addEventListener("click", async () => {
          const id = button.dataset.id;
          state.content.sessions.data = state.content.sessions.data.filter((item) => item.id !== id);
          await saveSessions();
        });
      });
      $("add-session").addEventListener("click", async () => {
        const item = {
          id: $("new-session-id").value.trim(),
          serviceSlug: $("new-session-service").value,
          date: $("new-session-date").value.trim(),
          startTime: $("new-session-start").value.trim(),
          endTime: $("new-session-end").value.trim() || undefined,
          title: $("new-session-title").value.trim(),
          location: $("new-session-location").value.trim(),
          summary: $("new-session-summary").value.trim(),
          status: $("new-session-status").value,
        };
        state.content.sessions.data = [...state.content.sessions.data, item];
        await saveSessions();
      });
    };

    const renderServices = () => {
      const services = state.content.services.data;
      const list = services.map((s) => \`
        <div class="item">
          <div class="line"><strong>\${s.name}</strong><span class="muted">\${s.slug}</span></div>
          <div class="row cols-3">
            <div><label>Price</label><input data-service="\${s.slug}" data-field="price" value="\${s.price}" /></div>
            <div><label>Duration</label><input data-service="\${s.slug}" data-field="duration" value="\${s.duration}" /></div>
            <div><label>Number</label><input data-service="\${s.slug}" data-field="number" value="\${s.number}" /></div>
          </div>
          <div class="row cols-2">
            <div><label>Tagline</label><input data-service="\${s.slug}" data-field="tagline" value="\${s.tagline}" /></div>
            <div><label>Location</label><input data-service="\${s.slug}" data-field="location" value="\${s.location || ""}" /></div>
          </div>
          <div class="row">
            <div><label>Description</label><textarea data-service="\${s.slug}" data-field="short">\${s.short}</textarea></div>
          </div>
        </div>\`
      ).join("");
      $("services").innerHTML = \`
        <div class="stack">\${list}</div>
        <hr />
        <h3>Lisää uusi palvelu</h3>
        <div class="row cols-3">
          <div><label>Slug</label><input id="new-service-slug" placeholder="uusi-palvelu" /></div>
          <div><label>Name</label><input id="new-service-name" /></div>
          <div><label>Price</label><input id="new-service-price" placeholder="95 €" /></div>
        </div>
        <div class="row cols-2">
          <div><label>Duration</label><input id="new-service-duration" placeholder="60 min" /></div>
          <div><label>Image path</label><input id="new-service-image" placeholder="/service-uusi.jpg" /></div>
        </div>
        <button class="primary" id="add-service">Lisää palvelu</button>
        <button id="save-services">Tallenna palvelumuutokset</button>
      \`;
      $("add-service").addEventListener("click", async () => {
        const slug = $("new-service-slug").value.trim();
        const name = $("new-service-name").value.trim();
        if (!slug || !name) return showAlert(appAlert, "Slug ja nimi vaaditaan.", true);
        state.content.services.data = [...state.content.services.data, {
          slug,
          number: String(state.content.services.data.length + 1).padStart(2, "0"),
          name,
          tagline: "",
          short: "",
          body: [""],
          duration: $("new-service-duration").value.trim() || "60 min",
          price: $("new-service-price").value.trim() || "0 €",
          image: $("new-service-image").value.trim() || "/service-aanimalja.jpg",
          location: "",
        }];
        await saveServices();
      });
      $("save-services").addEventListener("click", async () => {
        const updates = state.content.services.data.map((service) => {
          const copy = { ...service };
          document.querySelectorAll('[data-service="' + service.slug + '"]').forEach((input) => {
            copy[input.dataset.field] = input.value;
          });
          return copy;
        });
        state.content.services.data = updates;
        await saveServices();
      });
    };

    const renderSiteCopy = () => {
      const items = state.content.siteCopy.data;
      $("sitecopy").innerHTML = \`
        <div class="stack">
          \${items.map((item, i) => \`
            <div class="item">
              <div class="row cols-2">
                <div><label>Key</label><input data-copy-index="\${i}" data-field="key" value="\${item.key}" /></div>
                <div><label>Value</label><input data-copy-index="\${i}" data-field="value" value="\${item.value}" /></div>
              </div>
            </div>\`).join("")}
        </div>
        <button id="save-sitecopy">Tallenna sivutekstit</button>
      \`;
      $("save-sitecopy").addEventListener("click", async () => {
        state.content.siteCopy.data = state.content.siteCopy.data.map((item, i) => {
          const key = document.querySelector('[data-copy-index="' + i + '"][data-field="key"]').value.trim();
          const value = document.querySelector('[data-copy-index="' + i + '"][data-field="value"]').value.trim();
          return { key, value };
        });
        const payload = { items: state.content.siteCopy.data };
        const res = await request("/api/admin/sitecopy", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        state.content.siteCopy = res.siteCopy;
        showAlert(appAlert, "Sivutekstit tallennettu.");
      });
    };

    const renderNews = () => {
      $("news").innerHTML = '<p class="muted">Uutisten tietomalli on käytössä, mutta julkinen uutisnäkymä on v1-vaiheessa pois päältä.</p>';
    };

    const renderSettings = () => {
      $("settings").innerHTML = '<p class="muted">Kirjautuminen käyttää Worker-secrets arvoja ADMIN_USER, ADMIN_PASSWORD_RECORD ja SESSION_SECRET.</p>';
    };

    const saveSessions = async () => {
      const payload = { sessions: state.content.sessions.data };
      const res = await request("/api/admin/sessions", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      state.content.sessions = res.sessions;
      renderSessions();
      showAlert(appAlert, "Sessiot tallennettu.");
    };

    const saveServices = async () => {
      const payload = { services: state.content.services.data };
      const res = await request("/api/admin/services", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      state.content.services = res.services;
      renderServices();
      renderSessions();
      showAlert(appAlert, "Palvelut tallennettu.");
    };

    const renderApp = () => {
      renderSessions();
      renderServices();
      renderSiteCopy();
      renderNews();
      renderSettings();
    };

    const loadContent = async () => {
      const data = await request("/api/admin/content");
      state.csrfToken = data.csrfToken;
      state.content = data.content;
      renderApp();
    };

    $("logout-btn").addEventListener("click", async () => {
      await request("/api/admin/auth/logout", { method: "POST" });
      window.location.assign("/admin/login");
    });

    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-tab]").forEach((entry) => entry.classList.remove("active"));
        button.classList.add("active");
        const tab = button.dataset.tab;
        document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
        $(tab).classList.remove("hidden");
      });
    });

    loadContent().catch(() => {
      window.location.assign("/admin/login");
    });
  </script>
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

      return env.ASSETS.fetch(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unexpected_error";
      return json({ error: message }, { status: 500 });
    }
  },
};
