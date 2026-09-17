# Tiny Bookings Google Calendar

Confirmed requests (`status = booked` with a date and time) sync to one shared **Tiny Bookings** calendar. Staff subscribe to that calendar; they do not connect Google individually.

## 1. Google Cloud + calendar (one-time)

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project (or reuse Tiny’s).
2. Enable **Google Calendar API** and **Google Drive API** (Drive is used to attach birthday quotation PDFs and event pictures).
3. **IAM & Admin → Service accounts → Create**. Skip optional permissions. Open the account → **Keys → Add key → JSON** and download the file.
4. In [Google Calendar](https://calendar.google.com), create a calendar named **Tiny Bookings**.
5. Calendar settings → **Share with specific people** → add the service account email (`…@….iam.gserviceaccount.com`) with **Make changes to events**.
6. Share the same calendar with staff Gmail addresses as **See all event details**. Keep the calendar unlisted (do not make it public) so guest phones stay private.
7. Copy the **Calendar ID** from calendar settings (often `…@group.calendar.google.com`).
8. Copy a staff subscribe link from **Integrate calendar** (the `https://calendar.google.com/calendar/u/0?cid=…` URL). Paste it into `.env.local` as `GOOGLE_CALENDAR_SUBSCRIBE_URL` so the staff inbox can show **Open Tiny calendar**.

## 2. Supabase secrets

In [Edge Function secrets](https://supabase.com/dashboard/project/wvfwnnujxvaukwrtydac/settings/functions) set:

| Secret | Value |
| --- | --- |
| `GOOGLE_CALENDAR_ID` | Calendar ID from step 7 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key file as one line |
| `CALENDAR_SYNC_SECRET` | Long random string (webhook + backfill) |

Example (PowerShell, from the repo root after `npx supabase link`):

```powershell
npx supabase secrets set GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"
npx supabase secrets set CALENDAR_SYNC_SECRET="paste-a-long-random-string"
npx supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(Get-Content -Raw .\google-service-account.json)"
```

Do not commit the JSON key.

## 3. Database webhook

1. Apply migrations (`npx supabase db push` or `scripts/deploy-supabase.ps1`).
2. Deploy the function:

```powershell
npx supabase functions deploy sync-google-calendar --no-verify-jwt
```

3. [Database → Webhooks](https://supabase.com/dashboard/project/wvfwnnujxvaukwrtydac/integrations/webhooks) → Create a hook:
   - Table: `requests`
   - Events: **Insert**, **Update**, **Delete**
   - URL: `https://wvfwnnujxvaukwrtydac.supabase.co/functions/v1/sync-google-calendar`
   - HTTP header: `Authorization` = `Bearer <CALENDAR_SYNC_SECRET>`

Status changes in the staff inbox already `update` `requests`, so confirmed bookings sync without extra frontend calls.

## 4. Backfill existing confirmed bookings

After go-live, sync rows that were booked before the webhook existed:

```powershell
curl -X POST "https://wvfwnnujxvaukwrtydac.supabase.co/functions/v1/sync-google-calendar?backfill=1" -H "Authorization: Bearer <CALENDAR_SYNC_SECRET>"
```

## 5. Weekly cooking class (tables 18 and 19)

Cooking class is not a `requests` row. Create one recurring Saturday 14:00–17:00 Asia/Makassar event:

```powershell
curl -X POST "https://wvfwnnujxvaukwrtydac.supabase.co/functions/v1/sync-google-calendar?seed_cooking_class=1" -H "Authorization: Bearer <CALENDAR_SYNC_SECRET>"
```

Or in Google Calendar: repeating event **Saturday 14:00–17:00**, title `Cooking class · Tables 18 & 19`.

## What syncs

- **Creates / updates** when `status = booked` and `party_date` + `party_time` are set (reservations, birthday parties, events, cake/PDF with a time).
- **Attaches** the birthday quotation PDF, invoice PDF, and any event pictures to the Google event (via Drive). File links are also added to the event description.
- **Payment** deposit and balance status (Permata EDC / QRIS, bank transfer, cash) is written into the event title and description when staff save Track payment.
- **Deletes** the Google event when status becomes `cancelled`, `rejected`, or `noshow`, or the row is deleted.
- **Keeps** the Google event when status is `closed` (finished).
- Times match staff occupy windows: reservations 3 hours, birthdays 4 hours, events use the block end time.
