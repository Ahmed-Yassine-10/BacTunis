$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$apiCmd = "cd `"$root\apps\api`"; & `"$root\node_modules\.bin\ts-node.cmd`" -r tsconfig-paths/register src/main.ts"
$webCmd = "cd `"$root\apps\web`"; npx vite --host"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd
Start-Process powershell -ArgumentList "-NoExit", "-Command", $webCmd

Write-Host "API: http://localhost:3001"
Write-Host "Web: http://localhost:5173"