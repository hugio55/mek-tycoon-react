$lines = Get-Content 'src\app\essence-market\page.tsx.BROKEN_BACKUP_20251030_114918'
$modalStart = 5506  # 0-indexed, so line 5507 in editor
$modalEnd = 6255    # 0-indexed, so line 6256 in editor

$openDivs = 0
$closeDivs = 0
$openBraces = 0
$closeBraces = 0

for ($i = $modalStart; $i -le $modalEnd; $i++) {
    $line = $lines[$i]
    $openDivs += ([regex]::Matches($line, '<div')).Count
    $closeDivs += ([regex]::Matches($line, '</div>')).Count
    $openBraces += ([regex]::Matches($line, '\{')).Count
    $closeBraces += ([regex]::Matches($line, '\}')).Count
}

Write-Host "My Listings Modal Section (Lines 5507-6256):"
Write-Host "============================================="
Write-Host "Opening <div tags:     $openDivs"
Write-Host "Closing </div> tags:   $closeDivs"
Write-Host "Div difference:        $($openDivs - $closeDivs)"
Write-Host ""
Write-Host "Opening { braces:      $openBraces"
Write-Host "Closing } braces:      $closeBraces"
Write-Host "Brace difference:      $($openBraces - $closeBraces)"
