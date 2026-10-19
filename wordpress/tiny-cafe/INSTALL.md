# Tiny Cafe WordPress theme

Upload this theme to Hostinger WordPress. It replaces the cafe theme with the full Tiny site from this repo: home, birthdays, party builder, cakes, events, reservations, booking, location and menu.

Forms still use Supabase and WhatsApp. Keep `/staff/` as a static folder.

## Install

1. From the repo root run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File wordpress/tiny-cafe/bin/sync-assets.ps1
   powershell -ExecutionPolicy Bypass -File wordpress/tiny-cafe/bin/pack-theme.ps1
   ```
   Use `pack-theme.ps1` (not File Explorer “Send to compressed folder”). Explorer zips use Windows backslashes and WordPress on Hostinger then reports “missing style.css”.
2. The zip root must be `tiny-cafe/` with `tiny-cafe/style.css` inside.
3. WordPress Admin → **Appearance → Themes → Add New → Upload Theme** → choose `tiny-cafe.zip`.
4. Optional: **Live Preview** the theme before activating.
5. **Activate** Tiny Cafe.

On activate, WordPress creates these pages as **drafts** (edit before the public sees them):

| Page | URL | Template |
| --- | --- | --- |
| Home | `/` (front page) | Tiny Home block |
| About Birthdays | `/birthdays/` | Tiny — About Birthdays |
| Birthday Builder | `/birthdays/builder/` | Tiny — Birthday Builder |
| Cake Builder | `/cakes/` | Tiny — Cakes |
| Events | `/events/` | Tiny — Events |
| Reservations | `/reserve/` | Tiny — Table Reservations |
| Your booking | `/booking/` | Tiny — Your Booking |
| Location | `/location/` | Tiny — Location |
| Menu | `/menu/` | Tiny — Menu |

6. Open **Pages**, edit each draft, use **Preview**, then **Publish** when ready. Home is already set as the front page — publish it to show visitors the Tiny home.
7. If the old **Tiny Birthdays** plugin is installed, deactivate and delete it so pages are not created twice.
8. In File Manager, **rename** (safer than delete) any of these folders that exist so WordPress can own the URLs:
   - `public_html/birthdays` → `birthdays-static-backup`
   - `public_html/cakes` → `cakes-static-backup`
   - `public_html/events` → `events-static-backup`
   - `public_html/reserve` → `reserve-static-backup`
   - `public_html/booking` → `booking-static-backup`
   - `public_html/location` / `public_html/menu` if static copies were uploaded
9. Leave alone: `public_html/staff`, Supabase, Edge Functions.
10. Settings → Permalinks → Save.

## Adding pages and templates later

- **Simple page:** Pages → Add New. Uses `page.php` (Tiny header/footer + content).
- **New layout:** add `page-templates/canvas-yourname.php` with a `Template Name:` header, include `templates/canvas.php`, register the type in `tiny_cafe_page_templates()` in `includes/helpers.php`, add assets in `includes/assets.php` if needed, then assign that template on a page.

## After you change the static site in this repo

```powershell
powershell -ExecutionPolicy Bypass -File wordpress/tiny-cafe/bin/sync-assets.ps1
```

Re-zip and upload the theme (or copy `wordpress/tiny-cafe` over the theme on Hostinger).

## Staff inbox

Upload `staff-for-hostinger.zip` into `public_html` so you have `/staff/` and `/shared/supabase-config.js` + `reserve-tables.js`.

## Do not

- Activate the old Tiny Birthdays **plugin** alongside this theme.
- Replace Party Builder, Cake Builder, Events, Reservations or Your Booking blocks with columns/HTML.
- Point forms at WordPress — requests still go to Supabase.
- Remove `/staff/` unless you have another inbox.
