param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$repo = "lanryweezy/Kreathief"
$headers = @{
    Authorization = "Bearer $Token"
    Accept        = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$prNumbers = @(493, 494, 495, 496, 497, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510)
$merged = 0
$skipped = 0

foreach ($pr in $prNumbers) {
    $url = "https://api.github.com/repos/$repo/pulls/$pr/merge"
    $body = @{
        commit_title = "Merge PR #$pr (squash)"
        merge_method = "squash"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $url -Method Put -Headers $headers `
            -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Host "OK PR #$pr merged: $($response.message)" -ForegroundColor Green
        $merged++
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        switch ($code) {
            405 { Write-Host "SKIP PR #$pr not mergeable (conflict or already merged)" -ForegroundColor Yellow; $skipped++ }
            409 { Write-Host "SKIP PR #$pr merge conflict" -ForegroundColor Yellow; $skipped++ }
            422 { Write-Host "SKIP PR #$pr unprocessable" -ForegroundColor Yellow; $skipped++ }
            default { Write-Host "FAIL PR #$pr ($code): $($_.Exception.Message)" -ForegroundColor Red; $skipped++ }
        }
    }
    Start-Sleep -Milliseconds 600
}

Write-Host ""
Write-Host "Done - $merged merged, $skipped skipped" -ForegroundColor Cyan
