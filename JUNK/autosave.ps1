# Auto-Save Git Script for Mek Tycoon
# This script automatically commits changes every 30 minutes

Write-Host "🚀 Starting Mek Tycoon Auto-Save System" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$interval = 30 # minutes
$counter = 0

while ($true) {
    $counter++
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $shortTime = Get-Date -Format "HH:mm"
    
    Write-Host "`n[$shortTime] Checking for changes..." -ForegroundColor Cyan
    
    # Check if there are any changes
    $status = git status --porcelain
    
    if ($status) {
        Write-Host "📝 Changes detected! Creating auto-save..." -ForegroundColor Green
        
        # Stage all changes
        git add -A 2>$null
        
        # Create commit with timestamp
        $commitMsg = "Auto-save: $timestamp"
        git commit -m $commitMsg -q
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Auto-save #$counter created successfully!" -ForegroundColor Green
            Write-Host "   Commit: $commitMsg" -ForegroundColor Gray
            
            # Show what was saved
            $filesChanged = (git diff --name-only HEAD~1 HEAD | Measure-Object).Count
            Write-Host "   Files saved: $filesChanged" -ForegroundColor Gray
        }
    } else {
        Write-Host "✓ No changes to save" -ForegroundColor DarkGray
    }
    
    Write-Host "⏰ Next auto-save in $interval minutes..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds ($interval * 60)
}