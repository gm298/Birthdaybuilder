# Sync front-end assets into the Tiny Cafe WordPress theme.
# Run from the repository root:
#   powershell -ExecutionPolicy Bypass -File wordpress/tiny-cafe/bin/sync-assets.ps1

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$dest = Join-Path $root "wordpress\tiny-cafe\assets"

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
Copy-Tree (Join-Path $root "home\css") (Join-Path $dest "home\css")
Copy-Tree (Join-Path $root "home\img") (Join-Path $dest "home\img")
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
Copy-Tree (Join-Path $root "events\css") (Join-Path $dest "events\css")
Copy-Tree (Join-Path $root "events\js") (Join-Path $dest "events\js")
Copy-Tree (Join-Path $root "events\video") (Join-Path $dest "events\video")
Copy-Tree (Join-Path $root "reserve\css") (Join-Path $dest "reserve\css")
Copy-Tree (Join-Path $root "reserve\js") (Join-Path $dest "reserve\js")
Copy-Tree (Join-Path $root "reserve\img") (Join-Path $dest "reserve\img")
Copy-Tree (Join-Path $root "booking\css") (Join-Path $dest "booking\css")
Copy-Tree (Join-Path $root "booking\js") (Join-Path $dest "booking\js")
Copy-Tree (Join-Path $root "menu\js") (Join-Path $dest "menu\js")
Copy-Tree (Join-Path $root "menu\css") (Join-Path $dest "menu\css")
Copy-Tree (Join-Path $root "menu\img") (Join-Path $dest "menu\img")
Copy-Tree (Join-Path $root "menu\data") (Join-Path $dest "menu\data")
Copy-Tree (Join-Path $root "menu\pdf") (Join-Path $dest "menu\pdf")
Copy-Tree (Join-Path $root "menu\pages") (Join-Path $dest "menu\pages")

function Write-Partial($htmlPath, $partialPath) {
  $html = [IO.File]::ReadAllText($htmlPath, [Text.Encoding]::UTF8)
  $m = [regex]::Match($html, '(?s)<main(?<attrs>[^>]*)>(?<body>.*?)</main>')
  if (-not $m.Success) {
    throw "No <main> in $htmlPath"
  }
  $attrs = $m.Groups["attrs"].Value
  $body = $m.Groups["body"].Value.Trim()
  if ($attrs.Trim() -ne "") {
    $body = "<div$attrs>`n    $body`n  </div>"
  }
  $after = [regex]::Match($html, '(?s)<div id="site-chrome-footer"></div>(?<rest>.*?)<script')
  $extra = if ($after.Success) { $after.Groups["rest"].Value.Trim() } else { "" }
  $out = "<?php`nif (!defined('ABSPATH')) {`n    exit;`n}`n?>`n  $body`n"
  if ($extra -ne "") {
    $out += "`n  $extra`n"
  }
  [IO.File]::WriteAllText($partialPath, $out, (New-Object Text.UTF8Encoding $false))
}

$partials = Join-Path $root "wordpress\tiny-cafe\templates\partials"
Write-Partial (Join-Path $root "reserve\index.html") (Join-Path $partials "reserve.php")
Write-Partial (Join-Path $root "booking\index.html") (Join-Path $partials "booking.php")
Write-Partial (Join-Path $root "location\index.html") (Join-Path $partials "location.php")
Write-Partial (Join-Path $root "menu\index.html") (Join-Path $partials "menu.php")

function Write-PartyBuilder($htmlPath, $partialPath) {
  $html = [IO.File]::ReadAllText($htmlPath, [Text.Encoding]::UTF8)
  $main = [regex]::Match($html, '(?s)<main[^>]*>(?<body>.*?)</main>')
  if (-not $main.Success) {
    throw "No <main> in $htmlPath"
  }
  $staff = [regex]::Match($html, '(?s)(<div class="staff-decor-bar" id="staff-decor-bar".*?)\s*<main>')
  $after = [regex]::Match($html, '(?s)<div id="site-chrome-footer"></div>(?<rest>.*?)<script')
  $parts = @()
  if ($staff.Success) { $parts += $staff.Groups[1].Value.Trim() }
  $parts += $main.Groups["body"].Value.Trim()
  if ($after.Success -and $after.Groups["rest"].Value.Trim() -ne "") {
    $parts += $after.Groups["rest"].Value.Trim()
  }
  $chunk = ($parts -join "`n`n")
  $chunk = [regex]::Replace($chunk, 'src="img/hero\.jpg(?:\?[^"]*)?"', 'src="<?php echo esc_url($hero); ?>"')
  $chunk = [regex]::Replace($chunk, 'src="img/food\.jpg(?:\?[^"]*)?"', 'src="<?php echo esc_url($food); ?>"')
  $chunk = [regex]::Replace($chunk, 'href="(?:\.\./)+menu/"', 'href="<?php echo $menu; ?>"')
  $chunk = [regex]::Replace($chunk, 'id="builder-exit" href="\.\./"', 'id="builder-exit" href="<?php echo esc_url(tiny_birthdays_page_url(''landing'')); ?>"')
  $header = @'
<?php
if (!defined('ABSPATH')) {
    exit;
}
$hero = tiny_birthdays_asset('birthdays/builder/img/hero.jpg');
$food = tiny_birthdays_asset('birthdays/builder/img/food.jpg');
$menu = esc_url(tiny_birthdays_page_url('menu'));
?>

'@
  [IO.File]::WriteAllText($partialPath, $header + $chunk + "`n", (New-Object Text.UTF8Encoding $false))
}

Write-PartyBuilder (Join-Path $root "birthdays\builder\index.html") (Join-Path $partials "party-builder.php")

Write-Host "Synced Tiny Cafe assets into $dest"
