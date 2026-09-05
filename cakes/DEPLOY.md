# Deploy cakes page to Hostinger

## Local preview
From this folder:
```powershell
python -m http.server 8766
```
Then open http://127.0.0.1:8766/

Opening `index.html` as `file://` also works (cake data is embedded as a fallback).

## Upload
1. Open Hostinger hPanel → Files → File Manager.
2. Go to `public_html`.
3. Create a folder named `cakes` if it does not exist.
4. Upload the entire contents of this `cakes` folder into `public_html/cakes/`
   (so `index.html` is at `public_html/cakes/index.html`).
5. Visit https://tinyhealthycafe.com/cakes/

## If WordPress still shows a page instead
- In WP Admin → Pages, find any page with slug `cakes` and trash/rename it.
- Physical folders are served before WordPress rewrites when the folder exists.

## Main site navigation
- Appearance → Menus → add a Custom Link: URL `/cakes`, label `Cakes`.
- Keep the Birthdays link to `/birthdays` if already added.

## Analytics (gtag / GA4)
- Paste your Measurement ID into `shared/analytics.js` (`GA_MEASUREMENT_ID`).
- Shared events: `page_view`, `link_click`, `page_time`.
- Page events also fire: `whatsapp_click`, `cake_form_submit`, `cake_filter`, `cake_lightbox_open`.

## Replace before launch
- Add real prices in `data/cakes.json` (sizes currently "Price on request").
- Confirm gluten-free / no-added-sugar add-on pricing with the cafe.
- Confirm privacy / dietary wording against recipes.
