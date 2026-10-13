# ============================================================
# 看门狗脚本：持续监控 Vite Preview 和 cpolar，停止则自动重启
# 用法：.\watchdog.ps1
# ============================================================

$ErrorActionPreference = "SilentlyContinue"
$projectRoot = $PSScriptRoot
$cpolarExe  = Join-Path $projectRoot "cpolar_extract\cpolar\cpolar.exe"
$logDir     = Join-Path $projectRoot "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

function Test-PortListen {
    param([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return ($null -ne $conn)
    } catch { return $false }
}

function Start-VitePreview {
    if (Test-PortListen 4173) { return }
    $outLog = Join-Path $logDir "vite-out.log"
    $errLog = Join-Path $logDir "vite-err.log"
    Start-Process -FilePath "npx.cmd" `
        -ArgumentList "vite","preview","--port","4173","--host" `
        -WorkingDirectory $projectRoot `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -WindowStyle Hidden
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 重启 Vite Preview" -ForegroundColor Green
}

function Start-Cpolar {
    if (Test-PortListen 4040) { return }
    $cfgFile = Join-Path $env:USERPROFILE ".cpolar\cpolar.yml"
    if (-not (Test-Path $cfgFile)) {
        & $cpolarExe authtoken "NzJkMDIzZWYtMjlmYy00OWI3LWE2ZDMtMTc4NzU3YWNkYzg1" 2>&1 | Out-Null
    }
    $outLog = Join-Path $logDir "cpolar-out.log"
    $errLog = Join-Path $logDir "cpolar-err.log"
    Start-Process -FilePath $cpolarExe `
        -ArgumentList "http","4173" `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -WindowStyle Hidden
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 重启 cpolar 隧道" -ForegroundColor Green
}

function Get-CpolarUrl {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:4040" -TimeoutSec 5 -UseBasicParsing
        return [regex]::Matches($resp.Content, 'https?://[a-z0-9.-]*cpolar[a-z0-9.-]*') |
               ForEach-Object { $_.Value } | Sort-Object -Unique
    } catch { return @() }
}

Write-Host "看门狗已启动，每 30 秒检查一次服务状态 (Ctrl+C 停止)" -ForegroundColor Magenta
$lastUrl = ""
while ($true) {
    Start-VitePreview
    Start-Cpolar
    $urls = Get-CpolarUrl
    if ($urls.Count -gt 0) {
        $currentUrl = ($urls | Where-Object { $_ -like "https://*" } | Select-Object -First 1)
        if ($currentUrl -ne $lastUrl) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 公网地址: $currentUrl" -ForegroundColor Yellow
            $lastUrl = $currentUrl
        }
    }
    Start-Sleep -Seconds 30
}
