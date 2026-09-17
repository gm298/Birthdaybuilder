# Tiny Birthdays WordPress plugin

Install this plugin **alongside** the existing Tiny cafe WordPress theme. It does not replace the cafe site, WooCommerce, or the Supabase staff inbox.

## What you get

After activation, WordPress creates three pages:

| Page | URL | Edit in block editor |
| --- | --- | --- |
| Birthdays | `/birthdays/` | Headlines, photos, FAQs, reviews, package *marketing* copy |
| Build your party | `/birthdays/builder/` | Leave the Party Builder block in place |
| Cakes | `/cakes/` | Hero/facts copy; leave the Cake Builder block in place |

The party wizard and cake form still use the existing JavaScript, `party.json` / `cakes.json`, WhatsApp, and Supabase `submit-request`. Changing a price on the Birthdays page does **not** change builder quotes.

## Hostinger switchover

Physical folders currently win over WordPress. Do this in order:

1. Zip the `wordpress/tiny-birthdays` folder (the folder that contains `tiny-birthdays.php`).
2. WordPress Admin → Plugins → Add New → Upload Plugin → activate **Tiny Birthdays**.
3. Confirm the three pages exist under Pages.
4. In File Manager, **rename** (safer than delete) these folders so WordPress can own the URLs:
   - `public_html/birthdays` → `public_html/birthdays-static-backup`
   - `public_html/cakes` → `public_html/cakes-static-backup`
5. Leave these alone:
   - `public_html/staff` (request inbox)
   - Supabase project / Edge Function
   - The active cafe theme
6. Settings → Permalinks → Save.
7. Visit `/birthdays/`, `/birthdays/builder/?package=signature`, and `/cakes/`.
8. Edit **Birthdays** in the block editor (right-hand sidebar on each Tiny block).

If a URL still shows the old static page, the physical folder is still in place. If WordPress 404s, flush permalinks again.

## After you change the static site in this repo

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File wordpress/tiny-birthdays/bin/sync-assets.ps1
```

Then re-zip and upload the plugin (or copy `wordpress/tiny-birthdays/assets` over the copy on Hostinger).

## Do not

- Activate this as a *theme*. It is a plugin.
- Replace the Party Builder or Cake Builder blocks with columns/HTML.
- Point forms at WordPress — requests still go to Supabase.
- Remove `/staff/` unless you have another inbox.
