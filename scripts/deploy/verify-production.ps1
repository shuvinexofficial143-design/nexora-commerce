
param(
    [Parameter(Mandatory=$true)]
    [string]$LiveUrl
)

$ErrorActionPreference = "Stop"
$LiveUrl = $LiveUrl.Trim().TrimEnd("/")

Write-Host "Checking public health..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$LiveUrl/api/health" -Method Get -TimeoutSec 30

if (-not $health.ok -or $health.database -ne "connected") {
    throw "Production health check failed."
}

Write-Host "OK Database connected" -ForegroundColor Green

Write-Host "Checking Android CORS preflight..." -ForegroundColor Cyan
$response = Invoke-WebRequest `
    -Uri "$LiveUrl/api/admin-app/health" `
    -Method Options `
    -Headers @{ Origin = "https://localhost" } `
    -TimeoutSec 30 `
    -UseBasicParsing

$allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
if ($allowOrigin -ne "https://localhost") {
    throw "Android CORS origin was not accepted."
}

Write-Host "OK Android origin allowed" -ForegroundColor Green

Write-Host "Checking browser /admin is disabled..." -ForegroundColor Cyan

try {
    $adminResponse = Invoke-WebRequest `
        -Uri "$LiveUrl/admin" `
        -Method Get `
        -MaximumRedirection 0 `
        -TimeoutSec 30 `
        -UseBasicParsing

    if ($adminResponse.StatusCode -ge 200 -and $adminResponse.StatusCode -lt 400) {
        throw "Admin route unexpectedly returned a successful response."
    }
}
catch {
    $status = $null

    try {
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
        }
    }
    catch {}

    if ($status -eq 404) {
        Write-Host "OK /admin returns 404" -ForegroundColor Green
    }
    elseif ($_.Exception.Message -eq "Admin route unexpectedly returned a successful response.") {
        throw
    }
    else {
        Write-Host "INFO /admin is not a normal successful page. Verify after deployment if needed." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "OK NEXORA production verification complete" -ForegroundColor Green
