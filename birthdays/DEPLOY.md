# Deploy birthdays page to Hostinger

## Local preview
Opening `index.html` as a `file://` URL now works (packages are in the HTML). For video autoplay and fonts to match production, a local server is still better, e.g. from this folder: `python -m http.server 8765`

## Upload
1. Open Hostinger hPanel ? Files ? File Manager.
2. Go to `public_html`.
3. Create a folder named `birthdays` if it does not exist.
4. Upload the entire contents of this `birthdays` folder into `public_html/birthdays/`
   (so `index.html` is at `public_html/birthdays/index.html`).
5. Visit https://tinyhealthycafe.com/birthdays/

## If WordPress still shows a page instead
- In WP Admin ? Pages, find any page with slug `birthdays` and trash/rename it.
- Physical folders are served before WordPress rewrites when the folder exists.

## Main site navigation
- Appearance ? Menus ? add a Custom Link: URL `/birthdays`, label `Birthdays`.

## Optional analytics
- Add your GA4 snippet to `index.html` `<head>` if not already loaded site-wide.
  Events already fire: `whatsapp_click`, `pdf_form_submit`, `scroll_past_packages`.

## Replace before launch
- `pdf/Tiny-Birthday-Packages-2026.pdf` (add real PDF)
- Landscape hero video for desktop (current video is portrait)
- Confirm privacy policy URL matches live site
