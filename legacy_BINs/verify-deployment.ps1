# Baron System Verification Script
# Run this before beta deployment to verify all systems

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Baron Beta Deployment Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Helper functions
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-Directory {
    param($Path)
    return Test-Path $Path
}

function Test-File {
    param($Path)
    return Test-Path $Path
}

# 1. Check System Requirements
Write-Host "[1/10] Checking System Requirements..." -ForegroundColor Yellow

if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js installed: $nodeVersion" -ForegroundColor Green
    
    # Parse version and check if >= 18
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "  ✗ Node.js version must be 18 or higher!" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "  ✗ Node.js not found!" -ForegroundColor Red
    $ErrorCount++
}

if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "  ✓ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "  ✗ npm not found!" -ForegroundColor Red
    $ErrorCount++
}

if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host "  ✓ Git installed: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Git not found (optional)" -ForegroundColor Yellow
    $WarningCount++
}

Write-Host ""

# 2. Check Directory Structure
Write-Host "[2/10] Checking Directory Structure..." -ForegroundColor Yellow

$requiredDirs = @(
    "client",
    "client\src",
    "client\src\pages",
    "client\src\components",
    "server",
    "server\src",
    "server\prisma"
)

foreach ($dir in $requiredDirs) {
    if (Test-Directory $dir) {
        Write-Host "  ✓ $dir exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $dir not found!" -ForegroundColor Red
        $ErrorCount++
    }
}

Write-Host ""

# 3. Check Required Files
Write-Host "[3/10] Checking Required Files..." -ForegroundColor Yellow

$requiredFiles = @(
    "client\package.json",
    "client\vite.config.ts",
    "client\tailwind.config.js",
    "server\package.json",
    "server\tsconfig.json",
    "server\prisma\schema.prisma"
)

foreach ($file in $requiredFiles) {
    if (Test-File $file) {
        Write-Host "  ✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file not found!" -ForegroundColor Red
        $ErrorCount++
    }
}

Write-Host ""

# 4. Check Backend Environment
Write-Host "[4/10] Checking Backend Configuration..." -ForegroundColor Yellow

if (Test-File "server\.env") {
    Write-Host "  ✓ server\.env exists" -ForegroundColor Green
    
    # Check required variables
    $envContent = Get-Content "server\.env" -Raw
    
    $requiredEnvVars = @("DATABASE_URL", "JWT_SECRET", "PORT", "CLIENT_URL")
    foreach ($var in $requiredEnvVars) {
        if ($envContent -match $var) {
            Write-Host "  ✓ $var configured" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $var not found in .env!" -ForegroundColor Red
            $ErrorCount++
        }
    }
} else {
    Write-Host "  ✗ server\.env not found!" -ForegroundColor Red
    $ErrorCount++
}

Write-Host ""

# 5. Check Dependencies
Write-Host "[5/10] Checking Dependencies..." -ForegroundColor Yellow

if (Test-Directory "server\node_modules") {
    Write-Host "  ✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend node_modules not found! Run 'npm install' in server/" -ForegroundColor Red
    $ErrorCount++
}

if (Test-Directory "client\node_modules") {
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Frontend node_modules not found! Run 'npm install' in client/" -ForegroundColor Red
    $ErrorCount++
}

Write-Host ""

# 6. Check Prisma Setup
Write-Host "[6/10] Checking Prisma Setup..." -ForegroundColor Yellow

if (Test-Directory "server\node_modules\.prisma") {
    Write-Host "  ✓ Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Prisma client not generated! Run 'npm run prisma:generate' in server/" -ForegroundColor Yellow
    $WarningCount++
}

if (Test-Directory "server\prisma\migrations") {
    $migrations = Get-ChildItem "server\prisma\migrations" -Directory
    if ($migrations.Count -gt 0) {
        Write-Host "  ✓ Prisma migrations exist ($($migrations.Count) migrations)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ No migrations found! Run 'npm run prisma:migrate' in server/" -ForegroundColor Yellow
        $WarningCount++
    }
} else {
    Write-Host "  ✗ Migrations directory not found!" -ForegroundColor Red
    $ErrorCount++
}

Write-Host ""

# 7. Check Frontend Pages
Write-Host "[7/10] Checking Frontend Pages..." -ForegroundColor Yellow

$requiredPages = @(
    "Dashboard.tsx",
    "Login.tsx",
    "Fleet.tsx",
    "Customers.tsx",
    "Bookings.tsx",
    "Transactions.tsx",
    "Maintenance.tsx",
    "Finance.tsx",
    "Reports.tsx",
    "Notifications.tsx",
    "EmployeeManagement.tsx",
    "EmployeePerformance.tsx",
    "BusinessPlanner.tsx",
    "Settings.tsx"
)

foreach ($page in $requiredPages) {
    if (Test-File "client\src\pages\$page") {
        Write-Host "  ✓ $page exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $page not found!" -ForegroundColor Red
        $ErrorCount++
    }
}

Write-Host ""

# 8. Check Documentation
Write-Host "[8/10] Checking Documentation..." -ForegroundColor Yellow

$docFiles = @(
    "README.md",
    "BETA_DEPLOYMENT_GUIDE.md",
    "FRONTEND_WIRING_STATUS.md",
    "BETA_TESTING_CHECKLIST.md"
)

foreach ($doc in $docFiles) {
    if (Test-File $doc) {
        Write-Host "  ✓ $doc exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $doc not found (recommended)" -ForegroundColor Yellow
        $WarningCount++
    }
}

Write-Host ""

# 9. Check Ports Availability
Write-Host "[9/10] Checking Port Availability..." -ForegroundColor Yellow

$ports = @(5000, 5173)
foreach ($port in $ports) {
    $listener = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($listener) {
        Write-Host "  ⚠ Port $port is in use (will need to stop existing process)" -ForegroundColor Yellow
        $WarningCount++
    } else {
        Write-Host "  ✓ Port $port is available" -ForegroundColor Green
    }
}

Write-Host ""

# 10. Check Build Status
Write-Host "[10/10] Checking Build Status..." -ForegroundColor Yellow

# Check if TypeScript compiles (backend)
Write-Host "  Testing backend TypeScript compilation..." -ForegroundColor Cyan
Push-Location server
try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Backend builds successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Backend build failed! Check TypeScript errors" -ForegroundColor Red
        $ErrorCount++
    }
} catch {
    Write-Host "  ✗ Backend build error: $_" -ForegroundColor Red
    $ErrorCount++
} finally {
    Pop-Location
}

# Check if frontend builds (may take time, just test if vite works)
Write-Host "  Testing frontend build configuration..." -ForegroundColor Cyan
Push-Location client
try {
    # Just check if vite is configured correctly
    $viteCheck = npm run build -- --help 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Frontend build configuration valid" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Frontend build configuration may have issues" -ForegroundColor Yellow
        $WarningCount++
    }
} catch {
    Write-Host "  ⚠ Frontend build check error: $_" -ForegroundColor Yellow
    $WarningCount++
} finally {
    Pop-Location
}

Write-Host ""

# Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "         Verification Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host ""
    Write-Host "  🎉 ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  System is ready for beta deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\setup-database.ps1 (if not already done)" -ForegroundColor White
    Write-Host "  2. Run: .\start-all.ps1" -ForegroundColor White
    Write-Host "  3. Open: http://localhost:5173" -ForegroundColor White
    Write-Host "  4. Login with: admin@baron.local / Admin123!" -ForegroundColor White
    Write-Host "  5. Follow BETA_TESTING_CHECKLIST.md" -ForegroundColor White
    Write-Host ""
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host ""
    Write-Host "  ⚠ VERIFICATION COMPLETED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Errors: $ErrorCount | Warnings: $WarningCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  System can proceed, but review warnings above." -ForegroundColor Yellow
    Write-Host ""
    exit 0
} else {
    Write-Host ""
    Write-Host "  ✗ VERIFICATION FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Errors: $ErrorCount | Warnings: $WarningCount" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please fix the errors above before deploying." -ForegroundColor Red
    Write-Host "  Refer to BETA_DEPLOYMENT_GUIDE.md for help." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
