# ============================================================
# 管理平台持久化启动脚本（Vite Preview + cpolar 内网穿透）
# 用法：右键 -> 使用 PowerShell 运行，或在终端执行 .\start-tunnel.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$cpolarExe  = Join-Path $projectRoot "cpolar_extract\cpolar\cpolar.exe"
$logDir     = Join-Path $projectRoot "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

# ---------- 工具函数 ----------
function Test-PortListen {
    param([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return ($null -ne $conn)
    } catch { return $false }
}

function Start-VitePreview {
    if (Test-PortListen 4173) {
        Write-Host "[Vite] 预览服务已在运行 (端口 4173)" -ForegroundColor Green
        return
    }
    Write-Host "[Vite] 启动预览服务器 (端口 4173)..." -ForegroundColor Cyan
    $outLog = Join-Path $logDir "vite-out.log"
    $errLog = Join-Path $logDir "vite-err.log"
    Start-Process -FilePath "npx.cmd" `
        -ArgumentList "vite","preview","--port","4173","--host" `
        -WorkingDirectory $projectRoot `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -WindowStyle Hidden
    # 等待服务启动
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        if (Test-PortListen 4173) {
            Write-Host "[Vite] 预览服务已启动成功" -ForegroundColor Green
            return
        }
    }
    Write-Host "[Vite] 启动超时，请检查日志: $errLog" -ForegroundColor Red
}

function Start-Cpolar {
    # 检查 cpolar authtoken 是否已配置
    $cfgFile = Join-Path $env:USERPROFILE ".cpolar\cpolar.yml"
    if (-not (Test-Path $cfgFile)) {
        Write-Host "[cpolar] 未检测到 authtoken 配置，正在配置..." -ForegroundColor Yellow
        & $cpolarExe authtoken "NzJkMDIzZWYtMjlmYy00OWI3LWE2ZDMtMTc4NzU3YWNkYzg1" 2>&1 | Out-Null
    }

    if (Test-PortListen 4040) {
        Write-Host "[cpolar] 隧道服务已在运行" -ForegroundColor Green
        return
    }
    Write-Host "[cpolar] 启动内网穿透隧道..." -ForegroundColor Cyan
    $outLog = Join-Path $logDir "cpolar-out.log"
    $errLog = Join-Path $logDir "cpolar-err.log"
    Start-Process -FilePath $cpolarExe `
        -ArgumentList "http","4173" `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -WindowStyle Hidden
    # 等待隧道建立
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        if (Test-PortListen 4040) {
            Write-Host "[cpolar] 隧道服务已启动成功" -ForegroundColor Green
            return
        }
    }
    Write-Host "[cpolar] 启动超时，请检查日志: $errLog" -ForegroundColor Red
}

function Get-CpolarUrl {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:4040" -TimeoutSec 5 -UseBasicParsing
        $urls = [regex]::Matches($resp.Content, 'https?://[a-z0-9.-]*cpolar[a-z0-9.-]*') |
                ForEach-Object { $_.Value } | Sort-Object -Unique
        return $urls
    } catch { return @() }
}

# ---------- 主流程 ----------
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  管理平台 持久化启动脚本" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

Start-VitePreview
Start-Cpolar

Write-Host ""
Write-Host "等待隧道地址生成..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

$urls = Get-CpolarUrl
if ($urls.Count -gt 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  启动完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "本机访问:  http://localhost:4173/" -ForegroundColor White
    Write-Host "公网访问:" -ForegroundColor Yellow
    foreach ($u in $urls) {
        Write-Host "  $u" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "提示: 关闭此窗口后服务仍会继续运行" -ForegroundColor Gray
} else {
    Write-Host "隧道地址获取失败，请查看日志目录: $logDir" -ForegroundColor Red
}

Write-Host ""
Write-Host "按任意键退出此窗口（服务不会停止）..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
