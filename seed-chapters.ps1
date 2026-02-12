Write-Host "Waiting for API to be ready..."
Start-Sleep -Seconds 5

Write-Host "Logging in..."
$loginBody = '{"email":"test@bactunis.tn","password":"password123"}'
$loginResp = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $loginResp.accessToken
Write-Host "Got token (length: $($token.Length))"

Write-Host "Seeding chapters..."
$headers = @{ "Authorization" = "Bearer $token" }
$result = Invoke-RestMethod -Uri "http://localhost:3001/api/subjects/seed-chapters" -Method POST -Headers $headers -TimeoutSec 120
Write-Host "SEED RESULT:"
$result | ConvertTo-Json -Depth 5
