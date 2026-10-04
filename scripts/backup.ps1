//src/scripts/backup.ps1
# Respalda la base de datos y las fotos en un solo ZIP dentro de /backups
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$db = "prisma\dev.db"
if (-not (Test-Path $db)) { throw "No se encontro $db" }

$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$tmp = Join-Path $env:TEMP "mdv-backup-$stamp"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
New-Item -ItemType Directory -Force -Path "backups" | Out-Null

Copy-Item $db (Join-Path $tmp "dev.db")
if (Test-Path "uploads") { Copy-Item "uploads" (Join-Path $tmp "uploads") -Recurse }

$zip = "backups\menu-$stamp.zip"
Compress-Archive -Path "$tmp\*" -DestinationPath $zip -Force
Remove-Item $tmp -Recurse -Force

# Conserva solo los 10 respaldos mas recientes
Get-ChildItem "backups\menu-*.zip" | Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 10 | Remove-Item -Force

Write-Host "Respaldo creado: $zip"