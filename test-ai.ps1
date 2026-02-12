# Test AI Assistant Script
$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3001"

Write-Host "=== TEST 1: Register user ===" -ForegroundColor Cyan
try {
    $regBody = '{"email":"testai99@bactunis.tn","password":"testpass123","firstName":"Ahmed","lastName":"BenAli","birthDate":"2007-05-15","grade":"BAC","branch":"SCIENCES"}'
    $regResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body $regBody
    $token = $regResp.accessToken
    Write-Host "PASS - User registered, got token" -ForegroundColor Green
} catch {
    Write-Host "User may exist, trying login..." -ForegroundColor Yellow
    try {
        $loginBody = '{"email":"testai99@bactunis.tn","password":"testpass123"}'
        $loginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
        $token = $loginResp.accessToken
        Write-Host "PASS - Logged in, got token" -ForegroundColor Green
    } catch {
        Write-Host "FAIL - Could not authenticate: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== TEST 2: AI Chat ===" -ForegroundColor Cyan
try {
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    $chatBody = '{"content":"Bonjour! Explique moi brievement les derivees en maths"}'
    Write-Host "Sending chat request (may take a few seconds)..."
    $chatResp = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method POST -Headers $headers -Body $chatBody -TimeoutSec 120
    Write-Host "PASS - Got AI response!" -ForegroundColor Green
    Write-Host "Response preview:" -ForegroundColor Yellow
    $content = $chatResp.message.content
    if ($content.Length -gt 300) { $content = $content.Substring(0, 300) + "..." }
    Write-Host $content
} catch {
    Write-Host "FAIL - AI Chat error: $_" -ForegroundColor Red
    # Show response body if available
    try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host "Response body: $($reader.ReadToEnd())" -ForegroundColor Red
    } catch {}
}

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Cyan
