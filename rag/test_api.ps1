$body = @{
    url  = "https://example.com/privacy"
    html = @"
<html><body>
<h1>Privacy Policy</h1>
<p>We collect personal information including your name, email address, location data, and browsing history. This data may be shared with third-party advertising partners. We store your data indefinitely. By using our service you agree to let us sell your data to any buyer. We may track your location even when the app is closed. Your biometric data including facial recognition may be used for identity verification and shared with law enforcement without a warrant. We reserve the right to modify this policy at any time without notice. Camera and microphone access are required for basic app functionality. We collect contacts from your address book to improve our services.</p>
</body></html>
"@
} | ConvertTo-Json

Write-Host "=== 1. Testing /analyze ==="
try {
    $r = Invoke-WebRequest -Uri http://localhost:8000/analyze -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 120
    Write-Host "STATUS: $($r.StatusCode)"
    Write-Host $r.Content.Substring(0, [Math]::Min(500, $r.Content.Length))
    Write-Host "..."
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== 2. Testing /risks ==="
try {
    $r = Invoke-WebRequest -Uri http://localhost:8000/risks -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 120
    Write-Host "STATUS: $($r.StatusCode)"
    Write-Host $r.Content.Substring(0, [Math]::Min(500, $r.Content.Length))
    Write-Host "..."
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== 3. Testing /permissions ==="
try {
    $r = Invoke-WebRequest -Uri http://localhost:8000/permissions -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 120
    Write-Host "STATUS: $($r.StatusCode)"
    Write-Host $r.Content.Substring(0, [Math]::Min(500, $r.Content.Length))
    Write-Host "..."
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== 4. Testing /hidden-clauses ==="
try {
    $r = Invoke-WebRequest -Uri http://localhost:8000/hidden-clauses -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 120
    Write-Host "STATUS: $($r.StatusCode)"
    Write-Host $r.Content.Substring(0, [Math]::Min(500, $r.Content.Length))
    Write-Host "..."
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== 5. Testing /chat ==="
$chatBody = @{
    url      = "https://example.com/privacy"
    question = "What data does this policy collect?"
} | ConvertTo-Json

try {
    $r = Invoke-WebRequest -Uri http://localhost:8000/chat -Method POST -ContentType 'application/json' -Body $chatBody -UseBasicParsing -TimeoutSec 120
    Write-Host "STATUS: $($r.StatusCode)"
    Write-Host $r.Content.Substring(0, [Math]::Min(500, $r.Content.Length))
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== ALL TESTS DONE ==="
