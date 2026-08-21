
function Invoke-NexoraVercel {
    param(
        [Parameter(Mandatory=$true)]
        [string[]]$Arguments,

        [AllowNull()]
        [string]$InputValue = $null,

        [switch]$ShowOutput
    )

    $previousPreference = $ErrorActionPreference
    $nativeVariableExists = Test-Path variable:PSNativeCommandUseErrorActionPreference

    if ($nativeVariableExists) {
        $previousNativePreference = $PSNativeCommandUseErrorActionPreference
    }

    try {
        $ErrorActionPreference = "Continue"

        if ($nativeVariableExists) {
            $PSNativeCommandUseErrorActionPreference = $false
        }

        if ($null -ne $InputValue) {
            $output = $InputValue | & npx.cmd --yes vercel@latest @Arguments 2>&1
        }
        else {
            $output = & npx.cmd --yes vercel@latest @Arguments 2>&1
        }

        $exitCode = $LASTEXITCODE

        $lines = @(
            $output | ForEach-Object {
                if ($_ -is [System.Management.Automation.ErrorRecord]) {
                    $_.Exception.Message
                }
                else {
                    $_.ToString()
                }
            }
        )

        if ($ShowOutput) {
            foreach ($line in $lines) {
                Write-Host $line
            }
        }

        return [pscustomobject]@{
            ExitCode = $exitCode
            Output   = $lines
            Text     = ($lines -join "`n")
        }
    }
    finally {
        if ($nativeVariableExists) {
            $PSNativeCommandUseErrorActionPreference = $previousNativePreference
        }

        $ErrorActionPreference = $previousPreference
    }
}
