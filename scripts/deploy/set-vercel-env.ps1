
function Set-NexoraVercelEnv {
    param(
        [Parameter(Mandatory=$true)][string]$Name,
        [Parameter(Mandatory=$true)][string]$Value,
        [string]$Target = "production",
        [string]$Scope = "avanti-verse",
        [switch]$Sensitive
    )

    if (-not (Get-Command Invoke-NexoraVercel -ErrorAction SilentlyContinue)) {
        . "$PSScriptRoot\vercel-cli.ps1"
    }

    $remove = Invoke-NexoraVercel -Arguments @(
        "env", "rm", $Name, $Target,
        "--yes",
        "--scope", $Scope
    )

    $arguments = @(
        "env", "add", $Name, $Target,
        "--scope", $Scope
    )

    if ($Sensitive) {
        $arguments += "--sensitive"
    }

    $add = Invoke-NexoraVercel `
        -Arguments $arguments `
        -InputValue $Value

    if ($add.ExitCode -ne 0) {
        Write-Host ($add.Text) -ForegroundColor Red
        throw "Could not set Vercel environment variable: $Name"
    }

    Write-Host "  OK $Name" -ForegroundColor DarkGreen
}
