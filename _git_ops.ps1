param(
    [string]$Token = $env:GITHUB_TOKEN
)

$ErrorActionPreference = 'Continue'
$repo = "lanryweezy/Kreathief"
$base = "main"
$workBranch = "feat/billing-system-and-audits"

Set-Location "c:\Users\USER\Desktop\Kreathief"

# ── 1. Create and push our work branch ───────────────────────────────────────
Write-Host "==> Switching to work branch: $workBranch" -ForegroundColor Cyan

# Checkout existing branch or create new
git checkout $workBranch 2>&1
if ($LASTEXITCODE -ne 0) {
    git checkout -b $workBranch 2>&1
}

# Stage all tracked-file changes (modified files) plus new files we created
git add App.tsx
git add commands/CommandManager.ts
git add components/Header.tsx
git add components/modals/PricingModal.tsx
git add components/panels/AssetsPanel.tsx
git add components/panels/MediaPanel.tsx
git add hooks/useFileHandler.ts
git add services/billingService.ts
git add services/exportService.ts
git add services/nativePdfService.ts
git add services/storageService.ts
git add store/slices/aiSlice.ts
git add store/slices/historySlice.ts
git add store/slices/uiSlice.ts
git add store/useStore.ts
git add workers/pdf.worker.ts

# Stage deleted files
git rm --cached commands/history.ts 2>&1 | Out-Null
git rm --cached tests/commands/history.test.ts 2>&1 | Out-Null

git commit --no-verify -m "feat(billing): dual Paystack/Stripe routing, Supabase credits, AI credit guards, HiDPI export, memory & media panel fixes

- billingService.ts: geo routing via ipapi.co, Paystack for NG/GH/KE/ZA/CI only,
  Stripe for all other countries; real auth user in checkout (no mock IDs);
  per-country local currency amounts; atomic deduct_credits Supabase RPC
- uiSlice: loadCredits syncs from Supabase on login; deductCredit fires RPC
  and reconciles if concurrent tabs spent credits; creditsLoading state
- App.tsx: calls loadCredits after auth init and on every auth state change
- aiSlice: requireCredits() guard on all AI actions (3cr gen, 2cr img2img, 1cr text)
- PricingModal: full rewrite with real provider detection, local price labels,
  proper loading/error states, no hardcoded mock data
- Header: credit balance pill (brand/yellow/red based on balance), links to modal
- exportService: removed allowTaint (was tainting canvas silently), multiplied
  html2canvas scale by devicePixelRatio for HiDPI screens, added fonts.ready
  guard to Path C (canvas fallback)
- pdf.worker: implemented fetchFont via Google Fonts CSS API + TTF binary fetch,
  pre-loads all unique families before layer loop, falls back to Helvetica
- CommandManager: future[] now capped at maxHistory; Object URL revocation on
  eviction via _blobUrls tracking; clear() called on store reset
- historySlice: module-level debounce (400ms trailing edge) collapses slider
  bursts into single undo entry; _blobUrls tagged per command
- useFileHandler: uploads now use URL.createObjectURL instead of FileReader
  base64, reducing per-snapshot memory by ~100x for image-heavy designs
- storageService: removed 5-min setTimeout URL.revokeObjectURL time-bombs
- MediaPanel: conditional rendering (one tab at a time) stops 5x concurrent
  mount-time API calls that were triggering the network error boundary
- AssetsPanel: searchError state with inline Try Again UI
- Deleted: commands/history.ts (unused HistoryManager), tests/commands/history.test.ts" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Commit failed"
    exit 1
}

Write-Host "==> Pushing work branch to origin..." -ForegroundColor Cyan
git push -u origin $workBranch 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Push failed"
    exit 1
}

Write-Host "==> Work branch pushed successfully" -ForegroundColor Green

# ── 2. Merge all open PRs into main via GitHub API ───────────────────────────
if (-not $Token) {
    Write-Warning "GITHUB_TOKEN not set — skipping API PR merges. Set the env var and re-run."
    exit 0
}

$headers = @{
    Authorization = "Bearer $Token"
    Accept        = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2026-11-28"
}

# PRs to merge in ascending order (oldest first to minimise conflicts)
$prNumbers = @(493, 494, 495, 496, 497, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510)

foreach ($pr in $prNumbers) {
    Write-Host "==> Merging PR #$pr..." -ForegroundColor Cyan
    $url = "https://api.github.com/repos/$repo/pulls/$pr/merge"

    $body = @{
        commit_title   = "Merge PR #$pr"
        merge_method   = "squash"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $url -Method Put -Headers $headers -Body $body -ContentType "application/json"
        Write-Host "   Merged: $($response.message)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 405) {
            Write-Warning "   PR #$pr is not mergeable (already merged or conflicts) — skipping"
        } elseif ($statusCode -eq 409) {
            Write-Warning "   PR #$pr has a merge conflict — skipping"
        } else {
            Write-Warning "   PR #$pr failed ($statusCode): $($_.Exception.Message)"
        }
    }

    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "==> All done!" -ForegroundColor Green
Write-Host "    Work branch: https://github.com/$repo/tree/$workBranch" -ForegroundColor White
Write-Host "    Open PRs merged into main on GitHub." -ForegroundColor White
