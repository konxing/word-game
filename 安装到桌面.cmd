@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0windows\install.ps1"
if errorlevel 1 (
  echo Setup failed. Please check Microsoft Edge or Google Chrome.
  pause
  exit /b 1
)
exit /b 0
