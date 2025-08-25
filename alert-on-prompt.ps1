# PowerShell script to run commands with audio alerts on prompts
param(
    [string]$Command = "npm run dev:all"
)

# Function to play alert sound
function Play-Alert {
    # Play Windows system sound
    [System.Media.SystemSounds]::Exclamation.Play()
    
    # Also use console beep for redundancy (frequency, duration in ms)
    [console]::beep(800, 300)
    Start-Sleep -Milliseconds 200
    [console]::beep(800, 300)
    Start-Sleep -Milliseconds 200
    [console]::beep(1000, 500)
}

Write-Host "Starting command with prompt detection: $Command" -ForegroundColor Cyan
Write-Host "Audio alerts will play when input is needed" -ForegroundColor Yellow
Write-Host ""

# Create a process to run the command
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"
$psi.Arguments = "/c $Command"
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.RedirectStandardInput = $true
$psi.CreateNoWindow = $false

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $psi

# Set up event handlers for output
$outputBuffer = ""
$lastAlertTime = [DateTime]::MinValue

$outputHandler = {
    $data = $Event.SourceEventArgs.Data
    if ($data) {
        Write-Host $data
        
        # Check for common prompt patterns
        $promptPatterns = @(
            "? ",
            "(y/N)",
            "(Y/n)", 
            "[y/n]",
            "[Y/N]",
            "Press any key",
            "Enter to continue",
            "Proceed?",
            "Continue?",
            "Are you sure",
            "Do you want",
            "Would you like",
            "Choose",
            "Select",
            "Option:",
            ">>",
            "›"
        )
        
        foreach ($pattern in $promptPatterns) {
            if ($data -like "*$pattern*") {
                $now = [DateTime]::Now
                # Only alert if we haven't alerted in the last 5 seconds
                if (($now - $script:lastAlertTime).TotalSeconds -gt 5) {
                    Play-Alert
                    Write-Host "`n*** INPUT REQUIRED - CHECK CONSOLE ***" -ForegroundColor Red -BackgroundColor Yellow
                    $script:lastAlertTime = $now
                }
                break
            }
        }
    }
}

Register-ObjectEvent -InputObject $process -EventName OutputDataReceived -Action $outputHandler | Out-Null
Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -Action $outputHandler | Out-Null

# Start the process
$process.Start() | Out-Null
$process.BeginOutputReadLine()
$process.BeginErrorReadLine()

# Forward input from console to the process
while (!$process.HasExited) {
    if ([Console]::KeyAvailable) {
        $key = [Console]::ReadKey($true)
        $process.StandardInput.Write($key.KeyChar)
        
        if ($key.Key -eq [ConsoleKey]::Enter) {
            $process.StandardInput.WriteLine()
        }
    }
    Start-Sleep -Milliseconds 100
}

$process.WaitForExit()
Write-Host "`nProcess completed with exit code: $($process.ExitCode)" -ForegroundColor Cyan