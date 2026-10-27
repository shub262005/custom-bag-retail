$ErrorActionPreference = 'Stop'
$source = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../scripts/setup-lan.ps1') -Raw
# Exercise detection/validation without installing a CA or writing certificates.
$prefix = $source.Substring(0, $source.IndexOf('New-Item -ItemType Directory'))
$prefix = $prefix.Replace('Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)', '')
$validate = [scriptblock]::Create($prefix + "`nWrite-Output `$Address")
function mkcert { }
function node { $global:LASTEXITCODE = 0; return $script:fixture }

$script:fixture = '[{"name":"vEthernet (WSL)","address":"172.18.208.1"},{"name":"Wi-Fi","address":"10.112.95.99"}]'
$detected = & $validate
if ($detected -ne '10.112.95.99') { throw "Wrong Wi-Fi address: $detected" }
$script:fixture = '[{"name":"Ethernet","address":"192.168.1.10"}]'
if ((& $validate) -ne '192.168.1.10') { throw 'Single interface detection failed.' }
if ((& $validate -Address '192.168.1.20') -ne '192.168.1.20') { throw 'Explicit address validation failed.' }
foreach ($invalid in @('127.0.0.1', '0.0.0.0', 'not-an-ip', '::1')) {
    $rejected = $false
    try { & $validate -Address $invalid | Out-Null } catch { $rejected = $true }
    if (-not $rejected) { throw "Invalid address accepted: $invalid" }
}
Write-Output "LAN address detection/validation tests passed (PowerShell $($PSVersionTable.PSVersion))."

# Test the real mkcert wrapper without changing any OS trust store or certificate files.
$start = $source.IndexOf('$previousTrustStores =')
$end = $source.IndexOf('Copy-Item -LiteralPath')
$trustSetup = [scriptblock]::Create($source.Substring($start, $end - $start))
function mkcert {
    $script:observed += $env:TRUST_STORES
    $global:LASTEXITCODE = 0
    if ($script:failInstall) { $global:LASTEXITCODE = 1; return }
    if ($args -contains '-CAROOT') { Write-Output 'C:\test-ca' }
}
$originalTrustStores = $env:TRUST_STORES
try {
    foreach ($prior in @($null, 'java,nss')) {
        if ($null -eq $prior) { Remove-Item Env:TRUST_STORES -ErrorAction SilentlyContinue }
        else { $env:TRUST_STORES = $prior }
        $script:observed = @()
        $script:failInstall = $false
        & $trustSetup
        if ($script:observed.Count -ne 3 -or @($script:observed | Where-Object { $_ -ne 'system' }).Count) { throw 'mkcert was not restricted to the Windows system store.' }
        if ($env:TRUST_STORES -ne $prior) { throw 'Previous trust-store environment was not restored.' }
        $script:failInstall = $true
        $failed = $false
        try { & $trustSetup } catch { $failed = $true }
        if (-not $failed -or $env:TRUST_STORES -ne $prior) { throw 'Failure handling did not restore the trust-store environment.' }
    }
} finally {
    if ($null -eq $originalTrustStores) { Remove-Item Env:TRUST_STORES -ErrorAction SilentlyContinue }
    else { $env:TRUST_STORES = $originalTrustStores }
}
Write-Output 'mkcert system-store selection and environment restoration tests passed.'

$testEnvFile = [System.IO.Path]::GetTempFileName()
try {
    $Address = '192.168.1.20'
    $envLine = ($source -split "`r?`n" | Where-Object { $_ -like "Set-Content -LiteralPath '.env.lan.local'*" })
    $writeEnv = [scriptblock]::Create($envLine.Replace("'.env.lan.local'", '$testEnvFile'))
    & $writeEnv
    $bytes = [System.IO.File]::ReadAllBytes($testEnvFile)
    if ($bytes[0] -ne 0x56 -or [System.IO.File]::ReadAllText($testEnvFile).Trim() -ne 'VITE_PHONE_ORIGIN=https://192.168.1.20:5173') {
        throw 'LAN environment setting must be written without a BOM.'
    }
} finally { Remove-Item -LiteralPath $testEnvFile -ErrorAction SilentlyContinue }
Write-Output 'Vite LAN environment encoding test passed.'
