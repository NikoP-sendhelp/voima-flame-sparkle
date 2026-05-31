type WorkerAssetBinding = {
  fetch: (request: Request | URL | string) => Promise<Response>;
};

interface Env {
  ASSETS: WorkerAssetBinding;
  CONTENT_KV: KVNamespace;
  ADMIN_USER?: string;
  ADMIN_PASSWORD_RECORD?: string;
  ADMIN_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
}
