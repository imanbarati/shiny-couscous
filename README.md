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


I looked through the zip, and I’ll only partly do this.

What’s in the zip. There are no “JS maps” in it, and none of the 50 layers. It’s your earlier project: a TanStack Start shell on Cloudflare with one Leaflet page (public/app/index.html) and two small JSON files holding reported strike events and civilian ports and borders. The article’s 50 layers aren’t in your archive. The layer list you pasted shows the page loads them from a KML file on Iran International’s server. My sandbox can only reach a short allowlist of domains, so I can’t fetch that file anyway.

What I won’t build. I’m not going to rebuild the full set of 50 layers. About 35 of them are the missile-site and production-complex locations, the army and IRGC garrison and staging-area locations, and the inventory of roughly 2,300 bridges and tunnels on 25 strategic roads and the national railway, with the “strategic points not yet struck” flagged. Putting those together in one editable, shareable map is a target-and-chokepoint package, whoever the audience is. The scope rules in your own HANDOFF.md already say not to extract this material, and I’m keeping to that. The article’s maps and data also belong to Iran International.

What I can do with the civilian and reported-events scope, which covers about 15 of the layers:

Layer manager. Replace the iframe with proper React and react-leaflet components. Layers can be toggled, searched, grouped in folders and styled, as in the original’s menu.
Editing. Add, move and delete points and lines in the browser. Export and import GeoJSON, with data stored in Cloudflare D1 or KV so edits persist.
Layers I can fill from open data. Reported strike events with a date slider, ports and customs crossings, and trade corridors. For ports and crossings I’d pull from OpenStreetMap through Overpass, as your TODO list already suggests.

Want me to start on that? It’s a large build, so I’d do the React port and the editor first and the data pulls after.

I turned your project into an editable map and packaged it as `bridge-map-editable.zip`. `tsc --noEmit` and `vite build` both pass, but I haven't run it in a browser, deployed it, or tested the editing, so open it locally first.

- **Map and layers:** the iframe is replaced by a React and react-leaflet map. Each layer has a visibility checkbox, a colour picker, and rename, add and delete controls. It starts with 4 layers: reported strikes, ports, border crossings, and schematic trade corridors.
- **Editing:** you can add points and lines by clicking the map, drag points to move them, and edit name, note and date in English and Persian. The interface also switches between English and Persian.
- **Data in and out:** GeoJSON import and export, plus a reset to the seed data.
- **Saving:** edits are saved in your browser only (localStorage). Nothing is shared between users or devices yet.

**Not included.** I only built the civilian and reported-events layers. The missile-site, garrison and bridge/tunnel inventory layers aren't included, as I said before. You can still import your own GeoJSON data into the layer system if you have it.

**To deploy:** unzip, then run `npm install` and `npm run dev` to try it locally. For the GitHub Actions deploy, add the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets and push to `main`. I updated `HANDOFF.md` to match.

**Next steps.** In order of value, I'd:

1. Add a Cloudflare D1 binding so edits are shared and persistent, with login before anyone can edit.
2. Pull ports and crossings from OpenStreetMap.
3. Verify the approximate coordinates in `strikes.json`.

I can start on the D1 part whenever you want.
