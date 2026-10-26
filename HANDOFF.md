# HANDOFF — Bridge strikes & trade routes map

Last updated: 2026-10-26. Owner: Iman (reads Persian and English).

## State
- Stack: TanStack Start (React 19) + Vite 8 + @cloudflare/vite-plugin, deployed as a Cloudflare Worker with Wrangler. Worker name `bridge-map` (`wrangler.jsonc`).
- `npm ci && npm run build` succeeded locally in the authoring environment and `wrangler deploy --dry-run` was run; see the "Verify" note below for what that did and did not prove.
- The map UI is now React + react-leaflet: `src/components/MapApp.tsx` (client-only, lazy-loaded from `src/routes/index.tsx`), model/GeoJSON helpers in `src/lib/model.ts`, seed data in `src/data/*.json`. Features: layer toggle/colour/rename/add/delete, add point/line, drag points, edit EN/FA name+note+date, GeoJSON import/export, EN/FA UI. Edits persist in browser localStorage only (key `bridge-map:v1`).
- `tsc --noEmit` and `vite build` pass; not yet run in a browser by the author.
- NOT confirmed: a real deploy, a green GitHub Actions run, or a live URL. Do not claim any of these until you have checked the Actions run and opened the deployed URL.

## Main files
- `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/router.tsx` — TanStack routes (`src/routeTree.gen.ts` is generated at build; do not hand-edit)
- `vite.config.ts` — cloudflare plugin must come BEFORE tanstackStart
- `wrangler.jsonc` — Worker config, `main: @tanstack/react-start/server-entry`
- `.github/workflows/deploy.yml` — Node 22, `npm ci`, build, `wrangler deploy` on push to `main`
- `src/data/strikes.json`, `src/data/logistics.json` — seed data; `public/app/` — only PWA manifest + icon remain

## Setup the owner must do
1. Repo secrets: `CLOUDFLARE_API_TOKEN` ("Edit Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID`.
2. Commit `package-lock.json` (CI uses `npm ci`). Push to `main`, then check the Actions run.

## Scope rules (keep)
- Only publicly reported strike events and civilian trade infrastructure (ports, border crossings, schematic corridors). Keep the two views separate.
- Do NOT add military or missile site locations, "strategic chokepoint" lists, vulnerability rankings, or overlays combining strikes with military facilities. The source article contains such material; it was deliberately not extracted.
- Do not copy the source outlet's images, maps or full text. Original summaries plus a link only.

## Known gaps / TODO
1. Shared persistence: add a Cloudflare D1 (or KV) binding + server functions so edits are not per-browser; add auth before enabling public editing.
2. Verify every coordinate in `strikes.json` (many are region-level; see `precision`). Verify Solar Hijri to Gregorian dates (1405: Farvardin 1 = 2026-03-21).
3. Replace seeded trade data with an OpenStreetMap/Overpass pull.
4. Add 192/512 PNG icons and a service worker for offline/installability.
5. Pin the `latest` dependency ranges in package.json to exact versions after the first green deploy.

## Verify
`npm run typecheck` and `npm run build` are enforced by GitHub Actions. A successful build does not prove the Cloudflare account, token or live site work; check the Actions run and open the deployed URL before claiming deployment success.
