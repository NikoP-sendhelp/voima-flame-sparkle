# Voima Lyhty

Modern Astro website for Voima Lyhty, deployed as one Cloudflare Worker that serves both static assets and admin/API routes.

## Stack

- Astro 6 static output
- Tailwind CSS 4 via CSS-first configuration in `src/styles/global.css`
- Astro sitemap integration
- Cloudflare Worker routes for `/admin` and `/api/*`
- Cloudflare Wrangler for local preview, dry runs, and deploys

## Project Structure

```text
src/
  components/   Astro components shared by pages
  layouts/      Page shell and shared metadata
  lib/          Site data
  pages/        File-based Astro routes
  styles/       Global CSS and Tailwind theme tokens
public/         Static images and favicon
```

The active source tree is Astro-only. Previous React/TanStack migration files are no longer part of the filesystem or build.

## Quick Start

```bash
npm install
npm run dev
```

For Worker/admin development, copy `.dev.vars.example` to `.dev.vars`, replace every placeholder, and run:

```bash
npm run preview
```

## Commands

All commands run from the repository root:

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies from `package-lock.json` |
| `npm run dev` | Start the Astro dev server |
| `npm run build` | Build the static site to `dist/` |
| `npm run preview` | Build and preview through Wrangler |
| `npm run check` | Build, type-check, and run a Wrangler dry-run deploy |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run preview:worker` | Run Worker only for admin/API troubleshooting |
| `npm run preview:fallback` | Alternate local Worker startup path |

## Notes

- The site is framework-free at runtime: pages and UI are Astro templates with small inline scripts only where needed.
- Service content and all calendar sessions live in `src/lib/site-data.ts`.
- Static images are referenced from `public/` with root-relative URLs.
- Admin panel and admin APIs are served by Cloudflare Worker routes at `/admin` and `/api/admin/*`.
- Public runtime overrides are served at `/api/content/public` (KV-backed with static fallback).
- Admin UI assets live in `public/admin/` (`utils.js`, `login.css`, `login.js`, `panel.css`, `panel.js`) and are served by the same Worker.
- Wrangler is pinned to `4.95.0` for predictable local Worker behavior.
- Local secrets belong in `.dev.vars`; the file is ignored by git.

## Environment Variables

| Name | Required | Where | Purpose |
| :-- | :-- | :-- | :-- |
| `ADMIN_USER` | Yes | `.dev.vars` / Wrangler secret | Admin login username |
| `ADMIN_PASSWORD_RECORD` | Yes | `.dev.vars` / Wrangler secret | PBKDF2 password record for admin login |
| `SESSION_SECRET` | Yes | `.dev.vars` / Wrangler secret | Signs admin session cookies |
| `TURNSTILE_ENABLED` | No | `.dev.vars` / Wrangler secret or var | Enables Turnstile guard scaffolding |
| `TURNSTILE_MODE` | No | `.dev.vars` / Wrangler secret or var | `off`, `observe`, or `enforce` |
| `TURNSTILE_SECRET_KEY` | Later | `.dev.vars` / Wrangler secret | Turnstile Siteverify secret |
| `TURNSTILE_SITE_KEY` | Later | `.dev.vars` / Wrangler var | Reserved for future UI integration |

## Worker Admin Setup

1. Create KV namespaces:
   - `npx wrangler kv namespace create CONTENT_KV`
   - `npx wrangler kv namespace create CONTENT_KV --preview`
2. Copy the returned IDs into `wrangler.json`:
   - `kv_namespaces[0].id` = production namespace ID
   - `kv_namespaces[0].preview_id` = preview namespace ID
3. Copy `.dev.vars.example` to `.dev.vars` for local development and replace placeholders.
4. Generate the recommended `ADMIN_PASSWORD_RECORD` value:
   - Node:
     - `node -e 'const c=require("crypto");const p=process.argv[1];const i=100000;const s=c.randomBytes(16).toString("hex");const h=c.pbkdf2Sync(p,Buffer.from(s,"hex"),i,32,"sha256").toString("hex");console.log("pbkdf2$sha256$"+i+"$"+s+"$"+h)' "YOUR_PASSWORD_HERE"`
   - Use the printed value for `ADMIN_PASSWORD_RECORD`.
   - Paste the value exactly as printed (without extra quotes or line breaks).
   - Note: current Worker runtime accepts at most `100000` PBKDF2 iterations.
5. Generate `SESSION_SECRET` (long random value):
   - Node: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Use the printed value for `SESSION_SECRET`.
6. Set production admin secrets:
   - `npx wrangler secret put ADMIN_USER`
   - `npx wrangler secret put ADMIN_PASSWORD_RECORD`
   - `npx wrangler secret put SESSION_SECRET`
7. Verify and deploy:
   - Optional (when local environment allows Wrangler runtime-type generation):
     - `WRANGLER_LOG_PATH=.wrangler/logs npx wrangler types ./worker-configuration.d.ts`
   - `npm run check`
   - `npm run deploy`
8. Open `/admin`:
   - unauthenticated users are redirected to `/admin/login`
   - after login, use tabs to manage sessions/services/site text/news scaffold
   - session forms use typed controls (date/time/select), service-aware defaults, quick actions (`Duplikoi`, `+7 pv`, `Merkitse perutuksi`, `Luo seuraava sessio`), plus list filters/search/sort

## Local Preflight (Admin / Worker)

Before debugging local admin:

1. `node -v` (project requires Node `>=22.12.0`)
2. `npx wrangler --version` (pinned path is `4.95.0`)
3. Verify `.dev.vars` exists with:
   - `ADMIN_USER`
   - `ADMIN_PASSWORD_RECORD`
   - `SESSION_SECRET`
4. Verify `wrangler.json` has valid `CONTENT_KV` `id` + `preview_id`.
5. Start with `npm run preview` (or `npm run preview:worker` for API-only troubleshooting).

The Worker now stores editable documents in KV:
- `content:services:v1`
- `content:sessions:v1`
- `content:sitecopy:v1`
- `content:news:v1`

### Admin Troubleshooting

- `missing_worker_secrets` error: one or more secrets are missing.
- `invalid_password_record` error: `ADMIN_PASSWORD_RECORD` is malformed. Re-generate it and paste exactly without quotes/newline.
- `NotSupportedError ... iteration counts above 100000`: regenerate `ADMIN_PASSWORD_RECORD` with `i=100000` and update the secret.
- Login always fails: verify `ADMIN_USER` and `ADMIN_PASSWORD_RECORD` values are from the same setup.
- Content is not updating publicly: confirm `CONTENT_KV` IDs are correct and deployment completed.
- Local preview mismatch: ensure both `id` and `preview_id` are populated in `wrangler.json`.
- Local Wrangler runtime issue (`uv_interface_addresses ...`): use `npm run preview:fallback` and verify pinned Wrangler version.
- After rotating `SESSION_SECRET`, all existing admin sessions are invalidated and users must log in again.

## Turnstile Scaffolding (Global, Feature-Flagged)

Turnstile scaffolding is wired in Worker runtime with reusable guard helpers and structured logs.
Current default behavior is non-enforcing (safe for existing login flow).

Environment variables:

- `TURNSTILE_ENABLED=false|true`
- `TURNSTILE_MODE=off|observe|enforce`
- `TURNSTILE_SECRET_KEY=...`
- `TURNSTILE_SITE_KEY=...` (reserved for UI integration)

### Enable Turnstile Later

1. Set `TURNSTILE_SECRET_KEY` and `TURNSTILE_SITE_KEY`.
2. Set `TURNSTILE_ENABLED=true`.
3. Start with `TURNSTILE_MODE=observe` to verify logs without blocking.
4. Move to `TURNSTILE_MODE=enforce` when ready.
5. Attach the shared guard to additional endpoints as needed.

## Editing Calendar Sessions

All service calendars use the single `sessionEvents` array in `src/lib/site-data.ts`.
Add a new dated session there and it will appear in the global calendar plus the
matching service page calendar.

Example:

```ts
{
  id: "vyohyke-2026-06-10",
  serviceSlug: "vyohyketerapia",
  date: "2026-06-10",
  startTime: "17:30",
  endTime: "18:30",
  title: "Vyöhyketerapia",
  location: contact.address,
  summary: "Yksilöllinen hoitoaika Pasilan Urheilutalolla.",
}
```
