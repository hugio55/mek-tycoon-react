$lines = Get-Content 'src\app\essence-market\page.tsx.BROKEN_BACKUP_20251030_114918'

Write-Host "OPENING STRUCTURE (Lines 5507-5575):"
Write-Host "======================================"
$depth = 0
for ($i = 5506; $i -lt 5575; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1

    # Count changes
    $openDivs = ([regex]::Matches($line, '<div(?:\s|>)')).Count
    $closeDivs = ([regex]::Matches($line, '</div>')).Count
    $openBraces = ([regex]::Matches($line, '\{(?!showMyListingsModal)')).Count  # Exclude the variable name
    $closeBraces = ([regex]::Matches($line, '\}')).Count

    $depth = $depth + $openDivs - $closeDivs

    if ($openDivs -gt 0 -or $closeDivs -gt 0 -or $line -match '\{' -or $line -match '\}') {
        $indent = "  " * [Math]::Max(0, $depth)
        Write-Host "$lineNum : [depth=$depth] $indent$($line.Trim())"
    }
}

Write-Host ""
Write-Host "CLOSING STRUCTURE (Lines 6230-6260):"
Write-Host "======================================"
$depth = 14  # Starting with the known imbalance
for ($i = 6229; $i -lt 6260; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1

    $openDivs = ([regex]::Matches($line, '<div(?:\s|>)')).Count
    $closeDivs = ([regex]::Matches($line, '</div>')).Count

    if ($openDivs -gt 0 -or $closeDivs -gt 0 -or $line -match '\}' -or $line -match '^\s*\)') {
        $indent = "  " * [Math]::Max(0, $depth)
        Write-Host "$lineNum : [depth=$depth] $indent$($line.Trim())"
    }

    $depth = $depth + $openDivs - $closeDivs
}
Write-Host "Final depth: $depth"
