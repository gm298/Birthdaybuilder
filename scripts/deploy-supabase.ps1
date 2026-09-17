# Syncs anon key into shared/supabase-config.js and deploys schema + function.
# Usage: powershell -File scripts/deploy-supabase.ps1
# Reads .env.local — never prints secret values.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root ".env.local"))) {
  $root = Get-Location
}
Set-Location $root

function Load-DotEnv($path) {
  Get-Content $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    if ($_ -match '^([^=]+)=(.*)$') {
      $name = $matches[1].Trim()
      $value = $matches[2].Trim().Trim('"').Trim("'")
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

Load-DotEnv (Join-Path $root ".env.local")

$required = @(
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL"
)
foreach ($key in $required) {
  if (-not [string]::IsNullOrWhiteSpace((Get-Item "Env:$key").Value)) { continue }
  throw "Missing $key in .env.local"
}

$configPath = Join-Path $root "shared\supabase-config.js"
$config = @"
(() => {
  "use strict";

  window.TINY_SUPABASE = {
    url: "$($env:SUPABASE_URL)",
    anonKey: "$($env:SUPABASE_ANON_KEY)",
    submitUrl: "$($env:SUPABASE_URL)/functions/v1/submit-request",
    manageUrl: "$($env:SUPABASE_URL)/functions/v1/manage-request",
    googleCalendarUrl: "$($env:GOOGLE_CALENDAR_SUBSCRIBE_URL)",
  };
})();
"@
Set-Content -Path $configPath -Value $config -Encoding utf8
Write-Host "Updated shared/supabase-config.js (anon key only)."

if (-not $env:RATE_LIMIT_SALT) {
  $env:RATE_LIMIT_SALT = "tiny-birthday-" + $env:SUPABASE_PROJECT_REF
}

Write-Host "Linking project $($env:SUPABASE_PROJECT_REF)…"
$env:SUPABASE_ACCESS_TOKEN = $env:SUPABASE_ACCESS_TOKEN
try {
  npx supabase link --project-ref $env:SUPABASE_PROJECT_REF -p $env:SUPABASE_DB_PASSWORD
} catch {
  Write-Host "Warning: supabase link failed (token privileges). Continuing with db password / project-ref flags…"
}

Write-Host "Pushing database migration…"
npx supabase db push --yes -p $env:SUPABASE_DB_PASSWORD

Write-Host "Setting function secrets…"
npx supabase secrets set RATE_LIMIT_SALT=$env:RATE_LIMIT_SALT --project-ref $env:SUPABASE_PROJECT_REF
if ($LASTEXITCODE -ne 0) {
  Write-Host "secrets set failed — create a new personal access token at https://supabase.com/dashboard/account/tokens with full access, update SUPABASE_ACCESS_TOKEN in .env.local, then re-run."
}

Write-Host "Deploying submit-request function…"
npx supabase functions deploy submit-request --project-ref $env:SUPABASE_PROJECT_REF --no-verify-jwt

Write-Host "Deploying manage-request function…"
npx supabase functions deploy manage-request --project-ref $env:SUPABASE_PROJECT_REF --no-verify-jwt

Write-Host "Deploying sync-google-calendar function…"
npx supabase functions deploy sync-google-calendar --project-ref $env:SUPABASE_PROJECT_REF --no-verify-jwt

if ($env:GOOGLE_CALENDAR_ID) {
  npx supabase secrets set "GOOGLE_CALENDAR_ID=$env:GOOGLE_CALENDAR_ID" --project-ref $env:SUPABASE_PROJECT_REF
}
if ($env:CALENDAR_SYNC_SECRET) {
  npx supabase secrets set "CALENDAR_SYNC_SECRET=$env:CALENDAR_SYNC_SECRET" --project-ref $env:SUPABASE_PROJECT_REF
}
if ($env:RESEND_API_KEY) {
  npx supabase secrets set "RESEND_API_KEY=$env:RESEND_API_KEY" --project-ref $env:SUPABASE_PROJECT_REF
}
if ($env:BOOKING_FROM_EMAIL) {
  npx supabase secrets set "BOOKING_FROM_EMAIL=$env:BOOKING_FROM_EMAIL" --project-ref $env:SUPABASE_PROJECT_REF
}
if ($env:PUBLIC_SITE_ORIGIN) {
  npx supabase secrets set "PUBLIC_SITE_ORIGIN=$env:PUBLIC_SITE_ORIGIN" --project-ref $env:SUPABASE_PROJECT_REF
}

Write-Host "Done. Staff site: /staff/ - create a user in Auth, then insert into staff_users."
Write-Host "Google Calendar: see supabase/GOOGLE_CALENDAR.md"
Write-Host "Resend: set RESEND_API_KEY (+ optional BOOKING_FROM_EMAIL, PUBLIC_SITE_ORIGIN) in .env.local"
