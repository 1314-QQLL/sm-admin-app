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
    Write-Host "[$i/$total] Uploading: $relativePath ..." -NoNewline

    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $base64 = [Convert]::ToBase64String($bytes)

    $body = @{
        access_token = $token
        content      = $base64
        message      = "Add $relativePath"
        branch        = $branch
    } | ConvertTo-Json

    $url = "https://gitee.com/api/v5/repos/$owner/$repo/contents/$relativePath"
    try {
        $resp = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " FAILED: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Upload complete!" -ForegroundColor Green
Write-Host "Repo: https://gitee.com/$owner/$repo"
