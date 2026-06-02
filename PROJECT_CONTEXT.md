# Project Context: Voima Lyhty

This file is a working brief for future Codex sessions. It describes the current repository state as observed from the checked-in files and local filesystem, so project changes should update this file when architecture, commands, deployment, or content ownership changes.

## Purpose

Voima Lyhty is a Finnish wellness business website for Nanna in Helsinki/Pasila. The site presents services, pricing, practitioner information, and contact details for booking.

The current implementation is a static Astro site. It does not use React, TanStack Router, client-side hydration frameworks, MDX content collections, or a CMS in the active app.

## Current Stack

- Astro 6 with `output: "static"`.
- Tailwind CSS 4, configured directly in `src/styles/global.css` with CSS-first `@theme inline`.
- Fonts from `@fontsource/cormorant-garamond` and `@fontsource/karla`.
- `@astrojs/sitemap` integration.
- Cloudflare Wrangler for Worker + static-asset preview, dry-run deploys, and deploys.
- Cloudflare Wrangler pinned for stable local Worker behavior (`4.95.0` in `package.json`).
- TypeScript strict config via `astro/tsconfigs/strict`.

Primary package files:

- `package.json` defines the active scripts and dependencies.
- `package-lock.json` is the npm lockfile. npm is the package manager for the active project.
- There is no active `vite.config.ts`, React app entrypoint, or TanStack route tree in the current filesystem.
- Local Worker/admin secrets are kept in `.dev.vars`; `.dev.vars.example` documents placeholders and generation commands.

## Commands

Run commands from the repository root.

| Command | Purpose |
| :-- | :-- |
| `npm install` | Install dependencies from `package-lock.json`. |
| `npm run dev` | Start the Astro dev server. |
| `npm run build` | Build the static site to `dist/`. |
| `npx tsc --noEmit` | Type-check without building. |
| `npm run check` | Build, type-check, and run `wrangler deploy --dry-run`. |
| `npm run preview` | Build and preview through Wrangler. |
| `npm run preview:worker` | Run only Worker runtime for admin/API troubleshooting. |
| `npm run preview:fallback` | Alternate Wrangler local startup path. |
| `npm run deploy` | Deploy static assets through Wrangler. |

`npm run check` sets `WRANGLER_LOG_PATH=.wrangler/logs` so Wrangler writes logs inside the repo instead of the user home directory.

Generated Wrangler state is intentionally ignored:

- `.wrangler/`
- `.wrangler.backup/`
- `.mf/`
- `worker-configuration.d.ts`

## Build And Deployment

Astro configuration lives in `astro.config.mjs`:

- `site` is `https://voimalyhty.fi`.
- `output` is `static`.
- `integrations` contains only `sitemap()`.

Wrangler configuration lives in `wrangler.json`:

- Worker name is `voima-flame-sparkle`.
- Worker main entrypoint is `src/worker.ts`.
- Static assets are served from `./dist`.
- `not_found_handling` is `404-page`.
- KV namespace binding `CONTENT_KV` stores editable admin content documents.
- Observability is enabled.

The active Wrangler config now serves both Worker routes and static assets in one deployment.

The checked-in KV namespace IDs are deployment configuration, not secrets. Worker secrets still belong in `.dev.vars` locally and `wrangler secret put` for production.

## Source Tree

Current active source files:

```text
src/
  components/
    Reveal.astro
    SessionCalendar.astro
    SiteFooter.astro
    SiteNav.astro
    SoundWave.astro
  layouts/
    BaseLayout.astro
  lib/
    site-data.ts
  pages/
    index.astro
    palvelut.astro
    palvelut/[slug].astro
    hinnasto.astro
    nanna.astro
    yhteys.astro
  styles/
    global.css
  env.d.ts
  worker.ts
```

Static assets live in `public/` and are referenced with root-relative URLs such as `/hero-bowl.jpg`.

`public/.assetsignore` excludes `_worker.js`, `_routes.json`, `_headers`, and `_redirects` from copied static assets.

Admin UI static assets:

- `public/admin/utils.js`
- `public/admin/login.css`
- `public/admin/login.js`
- `public/admin/panel.css`
- `public/admin/panel.js`

Notable public assets:

- `hero-bowl.jpg`
- `nanna-portrait.jpg`
- `og-cover.jpg`
- `service-aanimalja.jpg`
- `service-sointukylpy.jpg`
- `service-vyohyke.jpg`
- `service-hermorata.jpg`
- `service-facelift.jpg`
- `service-voimavara.jpg`
- `favicon.svg`

## Layout And Shared Components

`src/layouts/BaseLayout.astro` is the common page shell:

- Imports `SiteNav`, `SiteFooter`, and global CSS.
- Sets `<html lang="fi">`.
- Accepts `title`, `description`, and optional `ogImage`.
- Defaults `ogImage` to `/og-cover.jpg`.
- Adds favicon, sitemap link, canonical URL, generator meta, Open Graph title/description/url/image, and Twitter card/image metadata.
- Resolves canonical and social image URLs against `Astro.site`, which is configured as `https://voimalyhty.fi`.
- Wraps page content in `<main>` and applies a small global fade-in.

`src/components/SiteNav.astro`:

- Defines local nav links for `/palvelut`, `/nanna`, `/hinnasto`, and `/yhteys`.
- Uses a fixed translucent header.
- Has a small inline script for mobile menu toggle behavior.
- Re-initializes on `astro:after-swap`, though the site is currently standard static navigation.

`src/components/SiteFooter.astro`:

- Uses `contact` from `src/lib/site-data.ts`.
- Shows brand copy, location, WhatsApp link, email link, and current year.
- Uses `SoundWave`.

`src/components/Reveal.astro`:

- Accepts `as`, `delay`, and `class` props.
- Renders the chosen element with a simple reveal animation.
- Respects `prefers-reduced-motion`.

`src/components/SoundWave.astro`:

- Renders an animated SVG equalizer/wave mark.
- Accepts `class` and optional `tint`.
- Respects `prefers-reduced-motion`.

`src/components/SessionCalendar.astro`:

- Renders an interactive, Astro-native calendar for service sessions.
- Accepts `events`, optional `serviceSlug`, optional `title`, and optional `emptyMessage`.
- Uses local inline JavaScript for month navigation, day selection, event details, and upcoming/past lists.
- Can fetch runtime session/service overrides from `/api/content/public` to reflect admin updates without rebuild.
- Does not use React or client-side framework islands.
- Can render a global all-services calendar or a filtered service-specific calendar.

`src/worker.ts`:

- Serves `/admin` and `/admin/login` panel UI.
- Serves admin APIs under `/api/admin/*` for login/logout and KV-backed content updates.
- Serves public runtime content endpoint at `/api/content/public`.
- Uses signed HttpOnly cookie sessions, CSRF checks for mutating APIs, and KV-based login rate limiting.
- Admin login requires Worker secrets `ADMIN_USER`, `ADMIN_PASSWORD_RECORD`, and `SESSION_SECRET`.
- Includes global Turnstile scaffolding (feature-flagged, default non-enforcing) with reusable guard + Siteverify helper.
- Falls back to static `site-data.ts` seed values when KV documents do not exist yet.
- Admin HTML shells now load UI behavior/styles from `public/admin/*` assets (no large inline editor script).

Turnstile-related env vars (scaffolded):

- `TURNSTILE_ENABLED`
- `TURNSTILE_MODE` (`off|observe|enforce`)
- `TURNSTILE_SECRET_KEY`
- `TURNSTILE_SITE_KEY`

Default local mode is `TURNSTILE_ENABLED=false` with `TURNSTILE_MODE=observe`, so the guard can be wired without blocking current admin login behavior.
- Admin panel now includes session quick actions, session list filters/search/sort, and a checklist/conflict hint area for safer edits.

## Data Model

All service and contact data is centralized in `src/lib/site-data.ts`.

`Service` has:

- `slug`
- `number`
- `name`
- `tagline`
- `short`
- `body`
- `duration`
- `price`
- `image`

`SessionEvent` has:

- `id`
- `serviceSlug`
- `date` in `YYYY-MM-DD`
- `startTime`
- optional `endTime`
- `title`
- `location`
- `summary`
- optional `bookingUrl`
- optional `status`

The `services` array currently contains six services:

1. `aanimaljarentoutus` - Äänimaljarentoutus
2. `sointukylpy` - Sointukylpy
3. `vyohyketerapia` - Vyöhyketerapia
4. `hermoratahieronta` - Hermoratahieronta
5. `rentouttava-facelift` - Rentouttava Facelift
6. `voimavaraterapia` - Voimavara-terapia & Lyhytterapia

`contact` currently contains:

- Phone: `040 553 5388`
- International phone: `+358405535388`
- Email: `voimalyhty@gmail.com`
- Address: `Pasilan Urheilutalo, Radiokatu 22, 00240 Helsinki`
- Practitioner: `Nanna`

`sessionEvents` is the single source of truth for every calendar on the site. Add, edit, or remove session dates there. Events are keyed by `serviceSlug`, so adding an event for a service automatically shows it in the global calendars and that service detail page calendar.

Example session event:

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

When updating service names, slugs, prices, durations, images, contact details, or session dates, start in `site-data.ts` and then check affected pages.

## Routes

Astro file-based routes currently generate 11 pages:

- `/`
- `/palvelut/`
- `/palvelut/aanimaljarentoutus/`
- `/palvelut/sointukylpy/`
- `/palvelut/vyohyketerapia/`
- `/palvelut/hermoratahieronta/`
- `/palvelut/rentouttava-facelift/`
- `/palvelut/voimavaraterapia/`
- `/hinnasto/`
- `/nanna/`
- `/yhteys/`

`src/pages/index.astro`:

- Homepage.
- Shows brand promise, first three services from `services.slice(0, 3)`, Nanna block, global calendar, pricing teaser, gift card teaser, and contact CTA.

`src/pages/palvelut.astro`:

- Services overview.
- Maps over the full `services` array.
- Shows service cards and a global all-services calendar.

`src/pages/palvelut/[slug].astro`:

- Static detail pages for each service.
- `getStaticPaths()` maps every service slug from `services`.
- Uses the selected service as route props.
- Shows a next-service card using the next item in `services`, wrapping back to the first service.
- Shows a dedicated `SessionCalendar` filtered to the selected service slug.

`src/pages/hinnasto.astro`:

- Pricing page.
- Maps over `services` for the price list.
- Uses `contact.email` for gift card email CTA.

`src/pages/nanna.astro`:

- Practitioner/about page.
- Uses `/nanna-portrait.jpg`.
- Has CTAs to `/palvelut` and `/yhteys`.

`src/pages/yhteys.astro`:

- Contact page.
- Uses `contact` for WhatsApp, email, and location details.
- Lists opening hours and transport details as static page copy.

## Styling Conventions

The visual design is calm, warm, editorial, and wellness-oriented.

Main theme tokens in `global.css`:

- `sand`
- `mist`
- `driftwood`
- `sun`
- `ember`
- `seafoam`

Typography:

- Display: Cormorant Garamond.
- Body: Karla.
- `font-display` and `font-body` are Tailwind theme tokens.

Common design patterns:

- Root sections use full-width background color bands.
- Cards and image containers often use rounded corners around `rounded-2xl` or `rounded-3xl`.
- Uppercase micro-labels use `text-[10px]` or `text-[11px]` with `tracking-luxe`.
- Static images should generally be placed in `public/` and referenced by root-relative URL.

When changing UI, preserve the current tone and layout unless the user explicitly asks for a redesign.

## Astro-Native Patterns To Preserve

- Prefer `.astro` components for static UI.
- Use standard Astro `class` props, not React-style `className`.
- Avoid adding React islands unless interactivity truly needs them.
- Use `getStaticPaths()` for static dynamic routes based on local data.
- Keep data-driven repeated UI mapped from `src/lib/site-data.ts`.
- Keep small inline scripts acceptable for simple local behavior like the mobile nav.

## Known Migration Notes

The repository has a migration history from a React/TanStack/Vite-style app to Astro. In the current filesystem, the active app is Astro-only.

Historical tracked deletions may still appear in `git status` because old React/TanStack files were removed during the migration. Do not assume those deleted paths are still part of the app.

Examples of old patterns that should not be reintroduced without a reason:

- `@tanstack/react-router`
- `@tanstack/react-start`
- React component trees for static pages
- Radix UI component library wrappers for unused UI
- `vite.config.ts` for the active site
- `src/assets` image imports for static public images
- MDX/blog starter content unless a real blog is being added

## Verification Checklist

Before considering project-level changes complete, run:

```bash
npm run build
npx tsc --noEmit
npm run check
```

For dependency/security work, also run:

```bash
npm audit
npm outdated
```

Expected current state after a healthy build:

- Astro builds 11 static pages.
- Sitemap is generated at `dist/sitemap-index.xml`.
- `npm audit` reports zero vulnerabilities.
- `npm outdated --json` returns `{}` when dependencies are current.

## Maintenance Notes

- Update this file whenever route structure, deployment config, major dependencies, or content ownership changes.
- Keep README shorter and user-facing; keep this file more detailed and implementation-facing.
- Avoid documenting intended future architecture as if it already exists.
- If generated files disagree with source config, describe them as generated or stale until regenerated.
