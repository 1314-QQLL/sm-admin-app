$token = "9455a1b0aa886571822ef7dd2313e49e"
$owner = "zzhjs"
$repo  = "sm-admin"
$branch = "master"
$distPath = Join-Path $PSScriptRoot "dist"

$files = Get-ChildItem -Path $distPath -Recurse -File
$total = $files.Count
$i = 0

foreach ($file in $files) {
    $i++
    $relativePath = $file.FullName.Substring($distPath.Length + 1).Replace("\","/")
    Write-Host "[$i/$total] Updating: $relativePath ..." -NoNewline

    # 获取当前文件的 SHA（如果存在）
    $getUrl = "https://gitee.com/api/v5/repos/$owner/$repo/contents/$relativePath?ref=$branch"
    $sha = $null
    try {
        $existing = Invoke-RestMethod -Uri $getUrl -Method Get -TimeoutSec 10
        $sha = $existing.sha
    } catch {
        # 文件不存在，是新增
    }

    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $base64 = [Convert]::ToBase64String($bytes)

    $body = @{
        access_token = $token
        content      = $base64
        message      = "Update $relativePath"
        branch        = $branch
    }
    if ($sha) { $body["sha"] = $sha }

    $jsonBody = $body | ConvertTo-Json

    $url = "https://gitee.com/api/v5/repos/$owner/$repo/contents/$relativePath"
    try {
        $resp = Invoke-RestMethod -Uri $url -Method Put -Body $jsonBody -ContentType "application/json" -TimeoutSec 60
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " FAILED: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Update complete!" -ForegroundColor Green
Write-Host "Repo: https://gitee.com/$owner/$repo"
Write-Host "CDN:  https://cdn.jsdelivr.net/gh/$owner/$repo@$branch/index.html"
