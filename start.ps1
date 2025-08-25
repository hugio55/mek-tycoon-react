Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Mek Tycoon Development Servers" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next.js will run on: " -NoNewline; Write-Host "http://localhost:3100" -ForegroundColor Green
Write-Host "Convex Dashboard: " -NoNewline; Write-Host "https://dashboard.convex.dev" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot
npm run dev:all