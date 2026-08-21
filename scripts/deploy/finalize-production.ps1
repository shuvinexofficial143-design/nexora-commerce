
$ErrorActionPreference = "Stop"

$liveUrl = "https://nexora-commerce-tau.vercel.app"
$commerce = "C:\WebProjects\nexora-commerce"
$admin = "C:\WebProjects\nexora-admin-app"

if (-not (Test-Path $commerce)) {
    throw "nexora-commerce project not found."
}

if (-not (Test-Path $admin)) {
    throw "nexora-admin-app project not found."
}

Write-Host "Finalizing NEXORA production URL..." -ForegroundColor Cyan

$envContent = @"
VITE_NEXORA_API_URL="$liveUrl"
VITE_NEXORA_BUILD_CHANNEL="android-production"
"@

[System.IO.File]::WriteAllText(
    "$admin\.env.android",
    $envContent + [Environment]::NewLine,
    [System.Text.UTF8Encoding]::new($false)
)

[System.IO.File]::WriteAllText(
    "$commerce\deployment-url.txt",
    $liveUrl + [Environment]::NewLine,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Checking live backend..." -ForegroundColor Cyan

$health = Invoke-RestMethod `
    -Uri "$liveUrl/api/health" `
    -Method Get `
    -TimeoutSec 30

if (-not $health.ok -or $health.database -ne "connected") {
    throw "Stable production backend health check failed."
}

Write-Host "OK Stable production backend healthy" -ForegroundColor Green
Write-Host "OK Database connected" -ForegroundColor Green

Set-Location $admin

Write-Host "Checking Admin Android backend configuration..." -ForegroundColor Cyan
node scripts/android/verify-backend.mjs

if ($LASTEXITCODE -ne 0) {
    throw "Admin Android backend verification failed."
}

Write-Host ""
Write-Host "NEXORA PRODUCTION READY FOR APK BUILD" -ForegroundColor Green
Write-Host "Backend: $liveUrl" -ForegroundColor Cyan
Write-Host "Next command: npm.cmd run android:apk" -ForegroundColor Yellow
