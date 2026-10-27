param([string]$Address)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
    throw 'Install mkcert first: winget install --id FiloSottile.mkcert -e . Then reopen your terminal and run npm run setup:lan.'
}
if (-not $Address) {
    $interfaces = node -e "const os=require('node:os'); const all=Object.entries(os.networkInterfaces()).flatMap(([name,addresses])=>addresses.filter(a=>a.family==='IPv4'&&!a.internal&&!a.address.startsWith('169.254.')).map(a=>({name,address:a.address}))); process.stdout.write(JSON.stringify(all));"
    if ($LASTEXITCODE -ne 0) { throw 'Could not detect network addresses using Node.js. Run setup again with -Address followed by the PC Wi-Fi IPv4 address.' }
    # Windows PowerShell 5.1 emits a JSON array as one pipeline object.
    # Assign it first, then enumerate it; @(ConvertFrom-Json ...) nests that array.
    $decoded = ConvertFrom-Json -InputObject ($interfaces -join [Environment]::NewLine)
    $candidates = @($decoded | Where-Object { $_.address -and $_.name })
    $preferred = @($candidates | Where-Object { $_.name -match 'Wi-Fi|Wireless|WLAN' })
    if ($preferred.Count -eq 1) { $Address = $preferred[0].address }
    elseif ($candidates.Count -eq 1) { $Address = $candidates[0].address }
    else {
        $candidates | Format-Table
        throw 'Choose the Wi-Fi IPv4 address above and run: npm run setup:lan -- -Address 192.168.1.10 (replace with your PC address).'
    }
}
$Address = $Address.Trim()
$parsedAddress = $null
if (-not [System.Net.IPAddress]::TryParse($Address, [ref]$parsedAddress) -or $parsedAddress.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork -or [System.Net.IPAddress]::IsLoopback($parsedAddress) -or $Address -eq '0.0.0.0') {
    throw 'Supply the PC Wi-Fi IPv4 address, for example 192.168.1.10.'
}

New-Item -ItemType Directory -Path '.cert' -Force | Out-Null
# The browser uses Windows trust; the HTTP backend does not need a Java CA.
# Limit all mkcert calls, including certificate generation, to the system store.
$previousTrustStores = $env:TRUST_STORES
try {
    $env:TRUST_STORES = 'system'
    & mkcert -install
    if ($LASTEXITCODE -ne 0) { throw 'mkcert could not install its local CA in the Windows trust store.' }
    & mkcert -cert-file '.cert/lan.pem' -key-file '.cert/lan-key.pem' $Address localhost 127.0.0.1 '::1'
    if ($LASTEXITCODE -ne 0) { throw 'Could not generate the local HTTPS certificate.' }
    $caOutput = & mkcert -CAROOT
    if ($LASTEXITCODE -ne 0) { throw 'Could not locate the local certificate authority.' }
    $caDirectory = ($caOutput -join [Environment]::NewLine).Trim()
} finally {
    if ($null -eq $previousTrustStores) { Remove-Item Env:TRUST_STORES -ErrorAction SilentlyContinue }
    else { $env:TRUST_STORES = $previousTrustStores }
}
Copy-Item -LiteralPath (Join-Path $caDirectory 'rootCA.pem') -Destination '.cert/phone-rootCA.crt'
# Windows PowerShell 5.1 adds a BOM with -Encoding utf8, which Vite's env parser rejects.
# IPv4 addresses and this setting are ASCII, so use a BOM-free encoding.
Set-Content -LiteralPath '.env.lan.local' -Value "VITE_PHONE_ORIGIN=https://${Address}:5173" -Encoding ascii

Write-Host "PC address: https://${Address}:5173"
Write-Host 'Transfer .cert/phone-rootCA.crt to your phone and install/trust it as a CA certificate. Transfer only this public certificate, never a key file.'
Write-Host 'Start the backend normally, then run npm run dev:lan. Allow Node.js through Windows Firewall on your private Wi-Fi network if prompted.'
Write-Host 'Open the PC address above, sign in, open Sales or Purchases, and click Connect phone scanner.'
