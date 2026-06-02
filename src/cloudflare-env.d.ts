type WorkerAssetBinding = {
  fetch: (request: Request | URL | string) => Promise<Response>;
};

interface Env {
  ASSETS?: WorkerAssetBinding;
  CONTENT_KV: KVNamespace;
  ADMIN_USER?: string;
  ADMIN_PASSWORD_RECORD?: string;
  SESSION_SECRET?: string;
  TURNSTILE_ENABLED?: string;
  TURNSTILE_MODE?: "off" | "observe" | "enforce";
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
}
