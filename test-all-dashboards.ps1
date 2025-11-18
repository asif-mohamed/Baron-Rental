# Baron Car Rental - All User Roles Dashboard Testing Script
# Tests backend endpoints for all 6 user roles

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Baron Car Rental Dashboard Testing" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api"
$testResults = @()

# Test 1: Backend Health Check
Write-Host "[1/7] Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
    if ($health.status -eq "ok") {
        Write-Host "  ✅ Backend is healthy" -ForegroundColor Green
        $testResults += @{ Test = "Health Check"; Status = "PASS" }
    } else {
        Write-Host "  ❌ Backend health check failed" -ForegroundColor Red
        $testResults += @{ Test = "Health Check"; Status = "FAIL" }
    }
} catch {
    Write-Host "  ❌ Cannot connect to backend (is it running?)" -ForegroundColor Red
    Write-Host "     Run: cd server && npm run dev" -ForegroundColor Gray
    $testResults += @{ Test = "Health Check"; Status = "FAIL" }
    exit 1
}

Write-Host ""

# Test 2-7: Role-specific endpoints (without auth - just checking if routes exist)
Write-Host "[2/7] Testing Admin Dashboard Endpoint..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/reports/dashboard" -Method Get -ErrorAction Stop | Out-Null
    Write-Host "  ✅ Admin endpoint exists (401 expected without token)" -ForegroundColor Green
    $testResults += @{ Test = "Admin Endpoint"; Status = "EXISTS" }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✅ Admin endpoint exists (401 Unauthorized - needs login)" -ForegroundColor Green
        $testResults += @{ Test = "Admin Endpoint"; Status = "EXISTS" }
    } else {
        Write-Host "  ❌ Admin endpoint NOT FOUND" -ForegroundColor Red
        $testResults += @{ Test = "Admin Endpoint"; Status = "MISSING" }
    }
}

Write-Host "[3/7] Testing Manager Dashboard Endpoint..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/reports/manager-overview" -Method Get -ErrorAction Stop | Out-Null
    Write-Host "  ✅ Manager endpoint exists" -ForegroundColor Green
    $testResults += @{ Test = "Manager Endpoint"; Status = "EXISTS" }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✅ Manager endpoint exists (401 Unauthorized - needs login)" -ForegroundColor Green
        $testResults += @{ Test = "Manager Endpoint"; Status = "EXISTS" }
    } else {
        Write-Host "  ❌ Manager endpoint NOT FOUND" -ForegroundColor Red
        $testResults += @{ Test = "Manager Endpoint"; Status = "MISSING" }
    }
}

Write-Host "[4/7] Testing Accountant Dashboard Endpoint..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/reports/financial-overview" -Method Get -ErrorAction Stop | Out-Null
    Write-Host "  ✅ Accountant endpoint exists" -ForegroundColor Green
    $testResults += @{ Test = "Accountant Endpoint"; Status = "EXISTS" }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✅ Accountant endpoint exists (401 Unauthorized - needs login)" -ForegroundColor Green
        $testResults += @{ Test = "Accountant Endpoint"; Status = "EXISTS" }
    } else {
        Write-Host "  ❌ Accountant endpoint NOT FOUND" -ForegroundColor Red
        $testResults += @{ Test = "Accountant Endpoint"; Status = "MISSING" }
    }
}

Write-Host "[5/7] Testing Reception Dashboard Endpoint..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/reports/receptionist-stats" -Method Get -ErrorAction Stop | Out-Null
    Write-Host "  ✅ Reception endpoint exists" -ForegroundColor Green
    $testResults += @{ Test = "Reception Endpoint"; Status = "EXISTS" }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✅ Reception endpoint exists (401 Unauthorized - needs login)" -ForegroundColor Green
        $testResults += @{ Test = "Reception Endpoint"; Status = "EXISTS" }
    } else {
        Write-Host "  ❌ Reception endpoint NOT FOUND" -ForegroundColor Red
        $testResults += @{ Test = "Reception Endpoint"; Status = "MISSING" }
    }
}

Write-Host "[6/7] Testing Warehouse Dashboard Endpoint..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/reports/warehouse-overview" -Method Get -ErrorAction Stop | Out-Null
    Write-Host "  ✅ Warehouse endpoint exists" -ForegroundColor Green
    $testResults += @{ Test = "Warehouse Endpoint"; Status = "EXISTS" }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✅ Warehouse endpoint exists (401 Unauthorized - needs login)" -ForegroundColor Green
        $testResults += @{ Test = "Warehouse Endpoint"; Status = "EXISTS" }
    } else {
        Write-Host "  ❌ Warehouse endpoint NOT FOUND" -ForegroundColor Red
        $testResults += @{ Test = "Warehouse Endpoint"; Status = "MISSING" }
    }
}

Write-Host "[7/7] Testing Mechanic Dashboard Endpoint..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/maintenance/mechanic-view" -Method Get -ErrorAction Stop | Out-Null
    Write-Host "  ✅ Mechanic endpoint exists" -ForegroundColor Green
    $testResults += @{ Test = "Mechanic Endpoint"; Status = "EXISTS" }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✅ Mechanic endpoint exists (401 Unauthorized - needs login)" -ForegroundColor Green
        $testResults += @{ Test = "Mechanic Endpoint"; Status = "EXISTS" }
    } else {
        Write-Host "  ❌ Mechanic endpoint NOT FOUND" -ForegroundColor Red
        $testResults += @{ Test = "Mechanic Endpoint"; Status = "MISSING" }
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -in @("PASS", "EXISTS") }).Count
$total = $testResults.Count

Write-Host ""
foreach ($result in $testResults) {
    $status = $result.Status
    $color = if ($status -in @("PASS", "EXISTS")) { "Green" } else { "Red" }
    Write-Host "  $($result.Test): $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "Results: $passed / $total tests passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host ""
    Write-Host "✅ All backend endpoints are properly configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Start frontend: cd client && npm run dev" -ForegroundColor Gray
    Write-Host "  2. Open browser: http://localhost:5173" -ForegroundColor Gray
    Write-Host "  3. Login with any role account" -ForegroundColor Gray
    Write-Host "  4. Check browser console (F12) for errors" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "⚠️ Some endpoints are missing or misconfigured" -ForegroundColor Yellow
    Write-Host "Review the test results above and fix the failing endpoints" -ForegroundColor Gray
}

Write-Host ""
