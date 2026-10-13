# ============================================================
# 停止所有服务（Vite Preview + cpolar）
# ============================================================
$projectRoot = $PSScriptRoot
$cpolarExe  = Join-Path $projectRoot "cpolar_extract\cpolar\cpolar.exe"

Write-Host "正在停止 cpolar 进程..." -ForegroundColor Yellow
Get-Process cpolar -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "正在停止 Vite Preview (端口 4173)..." -ForegroundColor Yellow
$ports = 4173, 4040
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) {
        $procIds = $conn | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($id in $procIds) {
            Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
            Write-Host "  已停止进程 ID: $id (端口 $p)" -ForegroundColor Gray
        }
    }
}

Write-Host "所有服务已停止" -ForegroundColor Green
