
param(
    [Parameter(Mandatory=$true)]
    [string]$LiveUrl
)

$ErrorActionPreference = "Stop"

$LiveUrl = $LiveUrl.Trim().TrimEnd("/")

if ($LiveUrl -notmatch '^https://') {
    throw "Admin APK backend must use HTTPS."
}

$admin = "C:\WebProjects\nexora-admin-app"
if (-not (Test-Path $admin)) {
    throw "Admin app project not found: $admin"
}

$envFile = Join-Path $admin ".env.android"

$content = @"
VITE_NEXORA_API_URL="$LiveUrl"
VITE_NEXORA_BUILD_CHANNEL="android-production"
"@

[System.IO.File]::WriteAllText(
    $envFile,
    $content + [Environment]::NewLine,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host "OK Admin App connected to $LiveUrl" -ForegroundColor Green
