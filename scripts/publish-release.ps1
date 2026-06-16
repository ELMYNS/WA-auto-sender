# Publier la release GitHub v1.0.0
# Prérequis : gh auth login (une seule fois)

$ErrorActionPreference = "Stop"

$setup = "release-new\WA Auto Sender Setup 1.0.0.exe"
$portable = "release-new\WA Auto Sender 1.0.0.exe"

if (-not (Test-Path $setup)) {
    Write-Host "Fichier manquant: $setup"
    Write-Host "Lancez d'abord: npm run build"
    exit 1
}

gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Connectez-vous d'abord: gh auth login"
    exit 1
}

gh release create v1.0.0 `
    --title "WA Auto Sender v1.0.0" `
    --notes-file RELEASE_NOTES.md `
    $setup $portable

Write-Host "Release publiee: https://github.com/ELMYNS/WA-auto-sender/releases/tag/v1.0.0"
