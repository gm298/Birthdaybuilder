# Tiny Birthdays WordPress plugin

Install this plugin **alongside** the existing Tiny cafe WordPress theme. It does not replace the cafe site, WooCommerce, or the Supabase staff inbox.

## What you get

After activation, WordPress creates these pages:

| Page | URL | Block editor |
| --- | --- | --- |
| About Birthdays | `/birthdays/` | One About Birthdays block (layout and copy live in the plugin) |
| Birthday Builder | `/birthdays/builder/` | Leave the Party Builder block in place |
| Cake Builder | `/cakes/` | Hero/facts copy; leave the Cake Builder block in place |
| Events | `/events/` | Leave the Events block in place |
| Reservations | `/reserve/` | Leave the Table Reservations block in place |
| Your booking | `/booking/` | Leave the Your Booking block in place (guests arrive here from the link in their email) |
| Location | `/location/` | Embedded Google Map, directions, address, hours |
| Menu | `/menu/` | Food, Drink and Nights menu PDFs with download buttons |

The theme's **home page is kept as it is**. The plugin only swaps the theme header on the home page for the Tiny header (Home, Reservations, Shop Online, Events, Birthdays menu, tasting button). The theme's home content and footer are unchanged.

On theme pages, links to the Tiny Google Maps place and to the Google Drive menus (the home page **Our location** and **See our menu** buttons, footer links) are pointed at `/location/` and `/menu/` automatically, so the home page does not need editing.

To update a menu, replace the PDF in `menu/pdf/` (keep the file name: `tiny-food-menu.pdf`, `tiny-drink-menu.pdf`, `tiny-nights-menu.pdf`), run the sync script, and re-upload the plugin.

The builders, reservation wizard and booking page still use the existing JavaScript, `party.json` / `cakes.json`, WhatsApp, and Supabase. Nothing points forms at WordPress.

## Hostinger switchover

Physical folders win over WordPress. Do this in order:

1. From the repo root run `powershell -ExecutionPolicy Bypass -File wordpress/tiny-birthdays/bin/sync-assets.ps1`.
2. Zip the `wordpress/tiny-birthdays` folder (the folder that contains `tiny-birthdays.php`).
3. WordPress Admin → Plugins → Add New → Upload Plugin → activate **Tiny Birthdays** (if an older version is installed, choose **Replace current with uploaded**).
4. Confirm the eight pages exist under Pages. An old **About Birthdays Revised** page is moved to the trash automatically, and `/birthdays/about-birthdays-revised/` redirects to `/birthdays/`.
5. In File Manager, **rename** (safer than delete) any of these folders that exist so WordPress can own the URLs:
   - `public_html/birthdays` → `public_html/birthdays-static-backup`
   - `public_html/cakes` → `public_html/cakes-static-backup`
   - `public_html/events` → `public_html/events-static-backup`
   - `public_html/reserve` → `public_html/reserve-static-backup`
   - `public_html/booking` → `public_html/booking-static-backup`
   - `public_html/location` and `public_html/menu` (only if you uploaded the static versions)
6. Leave these alone:
   - `public_html/staff` (request inbox)
   - Supabase project / Edge Functions
   - The active cafe theme
7. Settings → Permalinks → Save.
8. Visit `/`, `/birthdays/`, `/birthdays/builder/?package=signature`, `/cakes/`, `/events/`, `/reserve/`, `/location/`, `/menu/`, and a `/booking/?t=…` link from a confirmation email. On the home page, click **Our location** and **See our menu**.

If a URL still shows the old static page, the physical folder is still in place. If WordPress 404s, flush permalinks again.

## After you change the static site in this repo

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File wordpress/tiny-birthdays/bin/sync-assets.ps1
```

Then re-zip and upload the plugin (or copy `wordpress/tiny-birthdays/assets` over the copy on Hostinger).

## Do not

- Activate this as a *theme*. It is a plugin.
- Replace the Party Builder, Cake Builder, Table Reservations or Your Booking blocks with columns/HTML.
- Point forms at WordPress — requests still go to Supabase.
- Remove `/staff/` unless you have another inbox.
