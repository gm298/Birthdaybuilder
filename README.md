# Tiny Birthday Builder

Static birthday landing page, party builder, and custom cake catalogue for Tiny Healthy Cafe (Berawa, Bali).

**Repository:** https://github.com/gm298/Birthdaybuilder

## Live preview (GitHub Pages)

After Pages is enabled (see below):

- [Birthday landing](https://gm298.github.io/Birthdaybuilder/birthdays/)
- [Party builder](https://gm298.github.io/Birthdaybuilder/birthdays/builder/)
- [Build a cake](https://gm298.github.io/Birthdaybuilder/cakes/)
- [Reserve a table](https://gm298.github.io/Birthdaybuilder/reserve/)

### Enable GitHub Pages (one-time)

1. Open [Repository Settings → Pages](https://github.com/gm298/Birthdaybuilder/settings/pages)
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**
3. Choose **Branch:** `main`, **Folder:** `/ (root)`
4. Save — the site is live in 1–2 minutes at https://gm298.github.io/Birthdaybuilder/

## Local preview

From the repository root:

```bash
python -m http.server 8777
```

Then open:

- http://127.0.0.1:8777/birthdays/
- http://127.0.0.1:8777/birthdays/builder/
- http://127.0.0.1:8777/cakes/
- http://127.0.0.1:8777/reserve/
- http://127.0.0.1:8777/staff/ (staff inbox — login required)

## Request inbox (Supabase)

Party builder and cake forms save full requests (details, quote PDF, custom backdrop, cake photo) to Supabase project `wvfwnnujxvaukwrtydac`, then open WhatsApp.

Secrets live in `.env.local` (gitignored). Deploy / re-sync with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-supabase.ps1
```

### First-time staff login

1. [Auth → Users](https://supabase.com/dashboard/project/wvfwnnujxvaukwrtydac/auth/users) → **Add user** (email + password).
2. [Auth → Providers](https://supabase.com/dashboard/project/wvfwnnujxvaukwrtydac/auth/providers): turn **off** “Allow new users to sign up”.
3. In **SQL Editor**, run (paste the new user’s UUID from Auth):

```sql
insert into public.staff_users (user_id, display_name)
values ('USER_UUID_HERE', 'Tiny bookings');
```

4. Open `/staff/` and sign in.

## WordPress (Hostinger)

A plugin in [`wordpress/tiny-birthdays/`](wordpress/tiny-birthdays/) lets you edit the landing (and cake hero copy) in the WordPress block editor without changing the cafe theme or the Supabase backend. Install notes: [`wordpress/tiny-birthdays/INSTALL.md`](wordpress/tiny-birthdays/INSTALL.md).

Static GitHub Pages preview above is unchanged.

## Structure

| Path | Purpose |
|------|---------|
| `birthdays/` | Landing page |
| `birthdays/builder/` | All-in-one party builder |
| `cakes/` | Standalone cake builder & gallery |
| `reserve/` | Table reservation wizard (saves to Supabase + WhatsApp) |
| `staff/` | Private request inbox (Supabase Auth) |
| `shared/` | Chrome, analytics, Supabase client helpers |
| `supabase/` | Migrations + Edge Functions `submit-request` and `sync-google-calendar` |
| `wordpress/tiny-birthdays/` | WordPress plugin (block editor + same builders) |

Confirmed bookings can sync to a shared staff Google Calendar. Setup: [`supabase/GOOGLE_CALENDAR.md`](supabase/GOOGLE_CALENDAR.md).
