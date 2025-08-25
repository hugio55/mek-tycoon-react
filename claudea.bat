@echo off
:: Claude with Alerts - wrapper that beeps on prompts
:: Usage: claudea (instead of claude)

powershell -ExecutionPolicy Bypass -Command ^
"$process = Start-Process claude -ArgumentList $args -NoNewWindow -PassThru; ^
while (!$process.HasExited) { ^
    if ([Console]::KeyAvailable) { ^
        [console]::beep(800, 200); ^
        Start-Sleep -Milliseconds 100; ^
        [console]::beep(1000, 300); ^
    } ^
    Start-Sleep -Milliseconds 500; ^
} ^
exit $process.ExitCode" %*