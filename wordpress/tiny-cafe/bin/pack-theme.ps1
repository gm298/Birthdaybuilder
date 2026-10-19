# Pack tiny-cafe.zip with Unix forward-slash paths (WordPress on Hostinger requires this).
# Run from the repository root:
#   powershell -ExecutionPolicy Bypass -File wordpress/tiny-cafe/bin/pack-theme.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$themeDir = Join-Path $root "wordpress\tiny-cafe"
$themeZip = Join-Path $root "tiny-cafe.zip"

if (-not (Test-Path (Join-Path $themeDir "style.css"))) {
  throw "Missing style.css in $themeDir"
}

if (Test-Path $themeZip) {
  Remove-Item $themeZip -Force
}

$zip = [System.IO.Compression.ZipFile]::Open($themeZip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $themeDir -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($themeDir.Length).TrimStart("\", "/")
    $entryName = "tiny-cafe/" + ($rel -replace "\\", "/")
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip,
      $_.FullName,
      $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    )
  }
} finally {
  $zip.Dispose()
}

$check = [System.IO.Compression.ZipFile]::OpenRead($themeZip)
try {
  $style = $check.Entries | Where-Object { $_.FullName -eq "tiny-cafe/style.css" }
  if (-not $style) {
    throw "Packed zip is missing tiny-cafe/style.css"
  }
  Write-Host ("Packed {0} ({1:N1} MB) with {2} entries" -f $themeZip, ((Get-Item $themeZip).Length / 1MB), $check.Entries.Count)
} finally {
  $check.Dispose()
}
