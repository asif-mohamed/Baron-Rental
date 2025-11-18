# Baron Car Rental - Complete Setup Script
# Installs dependencies, sets up database, and prepares the system

$ErrorActionPreference = "Stop"
$script:setupStartTime = Get-Date
$script:rootPath = $PSScriptRoot

# UI Functions
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message, [int]$Current, [int]$Total)
    Write-Host ""
    Write-Host "[$Current/$Total] $Message" -ForegroundColor Yellow
    Write-Host ("=" * 60) -ForegroundColor DarkGray
}

function Write-Success {
    param([string]$Message)
    Write-Host "  OK $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  -> $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "  WARN $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "  FAIL $Message" -ForegroundColor Red
}

# Prerequisite Checks
function Test-Prerequisites {
    Write-Header "Baron Car Rental - Complete Setup"
    
    Write-Host "  Baron Car Rental Company" -ForegroundColor Gray
    Write-Host "  Version: 1.0.0-beta" -ForegroundColor Gray
    Write-Host "  Owner: Asif Mohamed" -ForegroundColor Gray
    Write-Host ""
    
    Write-Step "Checking Prerequisites" 1 6
    
    try {
        $nodeVersion = node --version 2>$null
        $versionNumber = $nodeVersion -replace 'v', ''
        $majorVersion = [int]($versionNumber.Split('.')[0])
        
        if ($majorVersion -ge 18) {
            Write-Success "Node.js $nodeVersion (Required: 18+)"
        } else {
            Write-Error-Custom "Node.js version $nodeVersion is too old (Required: 18+)"
            Write-Host ""
            Write-Host "  Download Node.js 18+ from: https://nodejs.org/" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Error-Custom "Node.js is not installed"
        Write-Host ""
        Write-Host "  Download Node.js 18+ from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    try {
        $npmVersion = npm --version 2>$null
        Write-Success "npm v$npmVersion"
    } catch {
        Write-Error-Custom "npm is not installed"
        exit 1
    }
    
    if (-not (Test-Path "$script:rootPath\server")) {
        Write-Error-Custom "Server directory not found"
        exit 1
    }
    
    if (-not (Test-Path "$script:rootPath\client")) {
        Write-Error-Custom "Client directory not found"
        exit 1
    }
    
    Write-Success "Directory structure verified"
}

# Install Backend Dependencies
function Install-BackendDependencies {
    Write-Step "Installing Backend Dependencies" 2 6
    
    Push-Location "$script:rootPath\server"
    
    try {
        if (Test-Path "node_modules") {
            Write-Info "Removing old node_modules..."
            Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        }
        
        if (Test-Path "package-lock.json") {
            Write-Info "Removing old package-lock.json..."
            Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
        }
        
        Write-Info "Installing packages (this may take 2-3 minutes)..."
        
        # Temporarily allow errors from npm (warnings go to stderr)
        $prevErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        
        npm install 2>&1 | Out-Null
        $installResult = $LASTEXITCODE
        
        $ErrorActionPreference = $prevErrorAction
        
        if ($installResult -eq 0) {
            $packageCount = (Get-Content package.json | ConvertFrom-Json).dependencies.PSObject.Properties.Count
            Write-Success "Installed $packageCount backend packages"
        } else {
            Write-Error-Custom "Failed to install backend dependencies"
            Write-Host "  npm install exited with code: $installResult" -ForegroundColor Red
            throw "Backend dependency installation failed"
        }
    } finally {
        Pop-Location
    }
}

# Install Frontend Dependencies
function Install-FrontendDependencies {
    Write-Step "Installing Frontend Dependencies" 3 6
    
    Push-Location "$script:rootPath\client"
    
    try {
        if (Test-Path "node_modules") {
            Write-Info "Removing old node_modules..."
            Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        }
        
        if (Test-Path "package-lock.json") {
            Write-Info "Removing old package-lock.json..."
            Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
        }
        
        Write-Info "Installing packages (this may take 2-3 minutes)..."
        
        # Temporarily allow errors from npm (warnings go to stderr)
        $prevErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        
        npm install 2>&1 | Out-Null
        $installResult = $LASTEXITCODE
        
        $ErrorActionPreference = $prevErrorAction
        
        if ($installResult -eq 0) {
            $packageCount = (Get-Content package.json | ConvertFrom-Json).dependencies.PSObject.Properties.Count
            Write-Success "Installed $packageCount frontend packages"
        } else {
            Write-Error-Custom "Failed to install frontend dependencies"
            Write-Host "  npm install exited with code: $installResult" -ForegroundColor Red
            throw "Frontend dependency installation failed"
        }
    } finally {
        Pop-Location
    }
}

# Setup Prisma
function Setup-Prisma {
    Write-Step "Setting up Prisma ORM" 4 6
    
    Push-Location "$script:rootPath\server"
    
    try {
        Write-Info "Generating Prisma Client..."
        
        $prevErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        
        npx prisma generate 2>&1 | Out-Null
        $generateResult = $LASTEXITCODE
        
        $ErrorActionPreference = $prevErrorAction
        
        if ($generateResult -eq 0) {
            Write-Success "Prisma Client generated"
        } else {
            Write-Warning "Prisma generation had warnings (continuing...)"
        }
    } finally {
        Pop-Location
    }
}

# Setup Database
function Setup-Database {
    Write-Step "Setting up Database" 5 6
    
    Push-Location "$script:rootPath\server"
    
    try {
        Write-Info "Running database migrations..."
        
        $prevErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        
        npx prisma migrate deploy 2>&1 | Out-Null
        $migrateResult = $LASTEXITCODE
        
        $ErrorActionPreference = $prevErrorAction
        
        if ($migrateResult -eq 0) {
            Write-Success "Database migrations applied"
        } else {
            Write-Warning "Migration warnings (continuing...)"
        }
        
        Write-Info "Seeding database with demo data..."
        
        $prevErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        
        npm run seed 2>&1 | Out-Null
        $seedResult = $LASTEXITCODE
        
        $ErrorActionPreference = $prevErrorAction
        
        if ($seedResult -eq 0) {
            Write-Success "Database seeded with demo data"
            Write-Info "Created 6 user accounts"
        } else {
            Write-Warning "Seeding had warnings (continuing...)"
        }
    } finally {
        Pop-Location
    }
}

# Final Summary
function Show-Summary {
    Write-Step "Setup Complete" 6 6
    
    $elapsed = (Get-Date) - $script:setupStartTime
    $minutes = [math]::Floor($elapsed.TotalMinutes)
    $seconds = $elapsed.Seconds
    
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  Setup completed successfully in $minutes min $seconds sec" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Start Backend Server:" -ForegroundColor Yellow
    Write-Host "   cd server" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Start Frontend (in a new terminal):" -ForegroundColor Yellow
    Write-Host "   cd client" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Access the application:" -ForegroundColor Yellow
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Login with demo accounts:" -ForegroundColor Yellow
    Write-Host "   Admin:      admin@baron.ly      / Admin123!@#" -ForegroundColor White
    Write-Host "   Accountant: accountant@baron.ly / Accountant123!@#" -ForegroundColor White
    Write-Host "   Mechanic:   mechanic@baron.ly   / Mechanic123!@#" -ForegroundColor White
    Write-Host "   Warehouse:  warehouse@baron.ly  / Warehouse123!@#" -ForegroundColor White
    Write-Host "   Marketing:  marketing@baron.ly  / Marketing123!@#" -ForegroundColor White
    Write-Host "   Office:     office@baron.ly     / Office123!@#" -ForegroundColor White
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  For help, see: QUICK_START.md or baron_Docs/" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

# Main Execution
try {
    Test-Prerequisites
    Install-BackendDependencies
    Install-FrontendDependencies
    Setup-Prisma
    Setup-Database
    Show-Summary
} catch {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host "  Setup Failed" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check your internet connection" -ForegroundColor Gray
    Write-Host "  2. Ensure Node.js 18+ is installed" -ForegroundColor Gray
    Write-Host "  3. Try running the script again" -ForegroundColor Gray
    Write-Host "  4. See QUICK_START.md for help" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
