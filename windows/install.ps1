#requires -version 5.1
# Offline desktop shortcut installer. No administrator privileges required.
$ErrorActionPreference = 'Stop'
try {
    $sourceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $installRoot = Join-Path $env:LOCALAPPDATA 'TypingHarbor'
    $appRoot = Join-Path $installRoot 'App'
    New-Item -ItemType Directory -Force -Path $appRoot | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $appRoot 'assets') | Out-Null
    foreach ($name in @('index.html', 'styles.css', 'app.js', 'engine.js', 'lessons.js')) {
        Copy-Item -LiteralPath (Join-Path $sourceRoot $name) -Destination (Join-Path $appRoot $name) -Force
    }
    Copy-Item -LiteralPath (Join-Path $sourceRoot 'assets\typing.ico') -Destination (Join-Path $appRoot 'assets\typing.ico') -Force
    $paths = @()
    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA)) {
        if ([string]::IsNullOrWhiteSpace($base)) { continue }
        $paths += Join-Path $base 'Microsoft\Edge\Application\msedge.exe'
        $paths += Join-Path $base 'Google\Chrome\Application\chrome.exe'
    }
    $browser = $paths | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
    if (-not $browser) {
        $command = Get-Command msedge.exe -ErrorAction SilentlyContinue
        if (-not $command) { $command = Get-Command chrome.exe -ErrorAction SilentlyContinue }
        if ($command) { $browser = $command.Source }
    }
    if (-not $browser) { throw 'Microsoft Edge or Google Chrome is required. Install either browser before setting up.' }
    $fileUri = ([System.Uri] (Join-Path $appRoot 'index.html')).AbsoluteUri
    $profile = Join-Path $installRoot 'BrowserProfile'
    $arguments = '--app="' + $fileUri + '" --user-data-dir="' + $profile + '" --no-first-run'
    $desktop = [Environment]::GetFolderPath('Desktop')
    if ([string]::IsNullOrWhiteSpace($desktop)) { throw 'Cannot locate Windows desktop folder.' }
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut((Join-Path $desktop '打字小站.lnk'))
    $shortcut.TargetPath = $browser
    $shortcut.Arguments = $arguments
    $shortcut.WorkingDirectory = $appRoot
    $shortcut.IconLocation = (Join-Path $appRoot 'assets\typing.ico') + ',0'
    $shortcut.Description = 'Offline beginner typing practice'
    $shortcut.Save()
    # First launch provides immediate confirmation that the desktop app works.
    Start-Process -FilePath $browser -ArgumentList $arguments -WorkingDirectory $appRoot
    Write-Host 'Desktop shortcut created: 打字小站'
} catch {
    Write-Error ('Installation failed: ' + $_.Exception.Message)
    exit 1
}
