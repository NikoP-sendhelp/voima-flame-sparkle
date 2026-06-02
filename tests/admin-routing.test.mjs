import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";

const outdir = path.join(tmpdir(), "voima-flame-sparkle-tests");
const outfile = path.join(outdir, "worker-under-test.mjs");

async function loadWorker() {
  await rm(outdir, { force: true, recursive: true });
  await mkdir(outdir, { recursive: true });
  await esbuild.build({
    bundle: true,
    entryPoints: ["src/worker.ts"],
    format: "esm",
    outfile,
    platform: "browser",
    target: "es2022",
  });
  const moduleUrl = `${pathToFileURL(outfile).href}?v=${Date.now()}`;
  return import(moduleUrl);
}

function createKv() {
  const store = new Map();
  return {
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    },
  };
}

function createEnv(overrides = {}) {
  return {
    CONTENT_KV: createKv(),
    SESSION_SECRET: "test-session-secret",
    ASSETS: {
      fetch: async () => new Response("asset fallback", { status: 404 }),
    },
    ...overrides,
  };
}

function signPayload(payload, secret = "test-session-secret") {
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

test("GET /admin redirects to login when session cookie is malformed", async () => {
  const worker = await loadWorker();
  const request = new Request("https://example.test/admin", {
    headers: {
      cookie: "vl_admin_session=not-a-valid-session-token",
    },
    redirect: "manual",
  });

  const response = await worker.default.fetch(request, createEnv());

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://example.test/admin/login");
});

test("GET /admin/ uses the same admin route as /admin", async () => {
  const worker = await loadWorker();
  const response = await worker.default.fetch(
    new Request("https://example.test/admin/", { redirect: "manual" }),
    createEnv(),
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://example.test/admin/login");
});

test("GET /admin/login/ renders the login route", async () => {
  const worker = await loadWorker();
  const response = await worker.default.fetch(
    new Request("https://example.test/admin/login/", { redirect: "manual" }),
    createEnv(),
  );
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /Kirjaudu sisään/);
});

test("GET /admin treats a signed malformed session payload as logged out", async () => {
  const worker = await loadWorker();
  const request = new Request("https://example.test/admin", {
    headers: {
      cookie: `vl_admin_session=${signPayload("not-json")}`,
    },
    redirect: "manual",
  });

  const response = await worker.default.fetch(request, createEnv());

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://example.test/admin/login");
});
