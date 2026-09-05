# Birthday builder

Static builder at `/birthdays/builder/`.

## Local preview
From the project root:
```powershell
python -m http.server 8777
```
Then open:
- http://127.0.0.1:8777/birthdays/
- http://127.0.0.1:8777/birthdays/builder/
- http://127.0.0.1:8777/cakes/

## Upload (Hostinger)
1. Keep `shared/` next to `birthdays/` and `cakes/` under `public_html/` (chrome CSS/JS is shared).
2. Upload `birthdays/builder/` so `index.html` is at `public_html/birthdays/builder/index.html`.
3. Visit https://tinyhealthycafe.com/birthdays/builder/

## Notes
- Cake step reuses the cakes catalogue assets from `/cakes/` (`../../cakes/...`).
- Package deep links: `/birthdays/builder/?package=simple|signature|terrace`
- Shared header/footer: `shared/chrome.js` + `shared/chrome.css` on landing, cakes, and builder.
- Analytics: paste the GA4 Measurement ID into `shared/analytics.js`.
