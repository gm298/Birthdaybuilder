# Sync front-end assets into the WordPress plugin.
# Run from the repository root:
#   powershell -ExecutionPolicy Bypass -File wordpress/tiny-birthdays/bin/sync-assets.ps1

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$dest = Join-Path $root "wordpress\tiny-birthdays\assets"

function Copy-Tree($from, $to, $excludeHtml = $true) {
  if (-not (Test-Path $from)) {
    Write-Host "Skip missing $from"
    return
  }
  New-Item -ItemType Directory -Force -Path $to | Out-Null
  $opts = @("/E", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np")
  if ($excludeHtml) {
    $opts += @("/XF", "*.html", "*.md", "*.lnk")
  }
  & robocopy $from $to @opts | Out-Null
  $code = $LASTEXITCODE
  if ($code -ge 8) {
    throw "robocopy failed ($code) from $from"
  }
}

Copy-Tree (Join-Path $root "shared") (Join-Path $dest "shared")
Copy-Tree (Join-Path $root "birthdays\css") (Join-Path $dest "birthdays\css")
Copy-Tree (Join-Path $root "birthdays\js") (Join-Path $dest "birthdays\js")
Copy-Tree (Join-Path $root "birthdays\data") (Join-Path $dest "birthdays\data")
Copy-Tree (Join-Path $root "birthdays\img") (Join-Path $dest "birthdays\img")
Copy-Tree (Join-Path $root "birthdays\video") (Join-Path $dest "birthdays\video")
Copy-Tree (Join-Path $root "birthdays\builder\css") (Join-Path $dest "birthdays\builder\css")
Copy-Tree (Join-Path $root "birthdays\builder\js") (Join-Path $dest "birthdays\builder\js")
Copy-Tree (Join-Path $root "birthdays\builder\data") (Join-Path $dest "birthdays\builder\data")
Copy-Tree (Join-Path $root "birthdays\builder\img") (Join-Path $dest "birthdays\builder\img")
Copy-Tree (Join-Path $root "cakes\css") (Join-Path $dest "cakes\css")
Copy-Tree (Join-Path $root "cakes\js") (Join-Path $dest "cakes\js")
Copy-Tree (Join-Path $root "cakes\data") (Join-Path $dest "cakes\data")
Copy-Tree (Join-Path $root "cakes\img") (Join-Path $dest "cakes\img")

Write-Host "Synced Tiny assets into $dest"
