# Voima Lyhty

Modern static Astro website for Voima Lyhty, deployed as Cloudflare Workers static assets.

## Stack

- Astro 6 static output
- Tailwind CSS 4 via CSS-first configuration in `src/styles/global.css`
- Astro sitemap integration
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

## Notes

- The site is framework-free at runtime: pages and UI are Astro templates with small inline scripts only where needed.
- Service content lives in `src/lib/site-data.ts`.
- Static images are referenced from `public/` with root-relative URLs.
