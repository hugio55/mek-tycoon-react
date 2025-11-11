# Display branch warning in RED
param(
    [string]$WarningType,
    [string]$CurrentBranch = ""
)

Write-Host ""
Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
if ($WarningType -eq "detached") {
    Write-Host " WARNING: DETACHED HEAD STATE!" -ForegroundColor Red
    Write-Host " You are NOT on any branch!" -ForegroundColor Red
    Write-Host " Commits will be orphaned!" -ForegroundColor Red
} elseif ($WarningType -eq "wrong") {
    Write-Host " WARNING: Wrong Branch!" -ForegroundColor Red
    Write-Host " Current: $CurrentBranch" -ForegroundColor Yellow
    Write-Host " Expected: custom-minting-system" -ForegroundColor Green
}
Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
Write-Host ""
