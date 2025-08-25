# Get all JPG files in meks folder
$jpgFiles = Get-ChildItem "C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\meks\*.jpg" | ForEach-Object { $_.BaseName }

# Get all WebP files in 750x750 folder  
$webpFiles = Get-ChildItem "C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react\public\mek-images\750x750\*.webp" | ForEach-Object { $_.BaseName }

# Find missing files
$missing = @()
foreach ($jpg in $jpgFiles) {
    if ($webpFiles -notcontains $jpg) {
        $missing += $jpg
    }
}

Write-Host "Missing Meks in 750x750 folder:"
Write-Host "================================"
$missing | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "Total missing: $($missing.Count)"