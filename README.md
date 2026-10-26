# Bridge strikes & trade routes map

TanStack Start (React) shell deployed to Cloudflare Workers (free plan). The map is a bilingual (EN/FA) react-leaflet editor in `src/components/MapApp.tsx` with two separate views: publicly reported bridge strikes, and civilian trade infrastructure.

## Run
    npm install
    npm run dev        # local
    npm run build      # production build
    npm run deploy     # build + wrangler deploy

## Deploy via GitHub Actions
Add repo secrets `CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers template) and `CLOUDFLARE_ACCOUNT_ID`. Push to `main` or run the workflow manually.

## Data
`src/data/strikes.json` and `src/data/logistics.json`. Strike source: Iran International, 2026-09-18 (link inside the JSON). Original summaries only; do not copy the outlet's maps, images or text.
