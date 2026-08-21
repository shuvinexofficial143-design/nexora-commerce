
$ErrorActionPreference = "Stop"

$commerce = "C:\WebProjects\nexora-commerce"
$scope = "avanti-verse"
$projectName = "nexora-commerce"

if (-not (Test-Path $commerce)) {
    throw "Project not found: $commerce"
}

Set-Location $commerce

. "$commerce\scripts\deploy\read-env.ps1"
. "$commerce\scripts\deploy\vercel-cli.ps1"
. "$commerce\scripts\deploy\set-vercel-env.ps1"

$localEnv = Get-NexoraDotEnv -Path "$commerce\.env.local"

$required = @(
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXT_PUBLIC_SUPABASE_URL"
)

foreach ($key in $required) {
    if (-not $localEnv.ContainsKey($key) -or -not $localEnv[$key]) {
        throw "$key is missing from .env.local"
    }
}

Write-Host ""
Write-Host "NEXORA Production Deployment" -ForegroundColor Cyan
Write-Host "Secrets will not be printed." -ForegroundColor DarkGray
Write-Host ""

$whoami = Invoke-NexoraVercel -Arguments @("whoami")

if ($whoami.ExitCode -ne 0) {
    Write-Host "Vercel login required. Browser sign-in may open..." -ForegroundColor Yellow

    $login = Invoke-NexoraVercel `
        -Arguments @("login") `
        -ShowOutput

    if ($login.ExitCode -ne 0) {
        throw "Vercel login failed."
    }
}
else {
    $account = ($whoami.Output | Where-Object {
        $_ -and $_ -notmatch "^Vercel CLI "
    } | Select-Object -Last 1)

    if ($account) {
        Write-Host "OK Vercel authenticated: $account" -ForegroundColor Green
    }
    else {
        Write-Host "OK Vercel authenticated" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Preparing Vercel project..." -ForegroundColor Cyan

$projectAdd = Invoke-NexoraVercel -Arguments @(
    "project", "add", $projectName,
    "--scope", $scope
)

$link = Invoke-NexoraVercel `
    -Arguments @(
        "link",
        "--yes",
        "--project", $projectName,
        "--scope", $scope
    ) `
    -ShowOutput

if ($link.ExitCode -ne 0) {
    if ($projectAdd.Text) {
        Write-Host ($projectAdd.Text) -ForegroundColor Yellow
    }
    throw "Could not create or link Vercel project '$projectName'."
}

Write-Host "OK Vercel project linked" -ForegroundColor Green

Write-Host ""
Write-Host "Saving production environment..." -ForegroundColor Cyan

Set-NexoraVercelEnv `
    -Name "DATABASE_URL" `
    -Value $localEnv["DATABASE_URL"] `
    -Scope $scope `
    -Sensitive

Set-NexoraVercelEnv `
    -Name "DIRECT_URL" `
    -Value $localEnv["DIRECT_URL"] `
    -Scope $scope `
    -Sensitive

Set-NexoraVercelEnv `
    -Name "NEXT_PUBLIC_SUPABASE_URL" `
    -Value $localEnv["NEXT_PUBLIC_SUPABASE_URL"] `
    -Scope $scope

$initialUrl = "https://nexora-commerce.vercel.app"

Set-NexoraVercelEnv `
    -Name "NEXT_PUBLIC_APP_URL" `
    -Value $initialUrl `
    -Scope $scope

$origins = "https://localhost,capacitor://localhost,http://localhost:5174,http://127.0.0.1:5174"

Set-NexoraVercelEnv `
    -Name "ADMIN_APP_ORIGINS" `
    -Value $origins `
    -Scope $scope

Write-Host ""
Write-Host "Deploying NEXORA to production..." -ForegroundColor Cyan

$deploy = Invoke-NexoraVercel `
    -Arguments @(
        "deploy",
        "--prod",
        "--yes",
        "--project", $projectName,
        "--scope", $scope
    ) `
    -ShowOutput

if ($deploy.ExitCode -ne 0) {
    throw "Vercel production deployment failed."
}

$urlMatches = [regex]::Matches(
    $deploy.Text,
    'https://[A-Za-z0-9.-]+\.vercel\.app'
)

if ($urlMatches.Count -eq 0) {
    throw "Deployment succeeded but the production URL could not be detected."
}

$liveUrl = $urlMatches[$urlMatches.Count - 1].Value.TrimEnd("/")

Write-Host ""
Write-Host "OK Production URL detected: $liveUrl" -ForegroundColor Green

Set-NexoraVercelEnv `
    -Name "NEXT_PUBLIC_APP_URL" `
    -Value $liveUrl `
    -Scope $scope

Write-Host "Redeploying once with final live URL..." -ForegroundColor Cyan

$finalDeploy = Invoke-NexoraVercel `
    -Arguments @(
        "deploy",
        "--prod",
        "--yes",
        "--project", $projectName,
        "--scope", $scope
    ) `
    -ShowOutput

if ($finalDeploy.ExitCode -ne 0) {
    throw "Final Vercel production deployment failed."
}

$finalMatches = [regex]::Matches(
    $finalDeploy.Text,
    'https://[A-Za-z0-9.-]+\.vercel\.app'
)

if ($finalMatches.Count -gt 0) {
    $liveUrl = $finalMatches[$finalMatches.Count - 1].Value.TrimEnd("/")
}

& "$commerce\scripts\deploy\connect-admin-app.ps1" -LiveUrl $liveUrl
& "$commerce\scripts\deploy\verify-production.ps1" -LiveUrl $liveUrl

[System.IO.File]::WriteAllText(
    "$commerce\deployment-url.txt",
    $liveUrl + [Environment]::NewLine,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "NEXORA IS LIVE" -ForegroundColor Green
Write-Host $liveUrl -ForegroundColor Cyan
Write-Host "Admin .env.android configured" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
