$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Dev Toolbar.lnk")
$Shortcut.TargetPath = "C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\dev-toolbar.bat"
$Shortcut.WorkingDirectory = "C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green