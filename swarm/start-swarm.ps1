Write-Host "========================================"
Write-Host "   MEK TYCOON AUTONOMOUS SWARM" -ForegroundColor Yellow
Write-Host "========================================"
Write-Host ""

# Check if API key is set
if (-not $env:ANTHROPIC_API_KEY) {
    Write-Host "ERROR: ANTHROPIC_API_KEY not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set your API key first:"
    Write-Host '  $env:ANTHROPIC_API_KEY = "your-api-key-here"' -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Green
Set-Location $PSScriptRoot
npm install

Write-Host ""
Write-Host "Starting swarm..." -ForegroundColor Green
Write-Host "Dashboard will be available at: http://localhost:4200" -ForegroundColor Cyan
Write-Host ""

# Run with a default task or accept command line argument
if ($args.Count -eq 0) {
    node mek-swarm.js "Create an engaging Three.js mini-game for Mek Tycoon where players stack blocks to earn essence. Include glass-morphism UI elements and smooth animations."
} else {
    node mek-swarm.js $args
}

Read-Host "Press Enter to exit"