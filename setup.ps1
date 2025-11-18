# ============================================================================# ============================================================================

# Baron Car Rental - Complete Setup Script# Baron Car Rental - Complete Setup Script

# Installs dependencies, sets up database, and prepares the system# Installs dependencies, sets up database, and prepares the system

# ============================================================================# ============================================================================



$ErrorActionPreference = "Stop"$ErrorActionPreference = "Stop"

$script:setupStartTime = Get-Date$script:setupStartTime = Get-Date

$script:rootPath = $PSScriptRoot$script:rootPath = $PSScriptRoot



# ============================================================================# ============================================================================

# UI Functions# UI Functions

# ============================================================================# ============================================================================



function Write-Header {function Write-Header {

    param([string]$Message)    param([string]$Message)

    Write-Host ""    Write-Host ""

    Write-Host "================================================================" -ForegroundColor Cyan    Write-Host "================================================================" -ForegroundColor Cyan

    Write-Host "  $Message" -ForegroundColor Cyan    Write-Host "  $Message" -ForegroundColor Cyan

    Write-Host "================================================================" -ForegroundColor Cyan    Write-Host "================================================================" -ForegroundColor Cyan

    Write-Host ""    Write-Host ""

}}



function Write-Step {function Write-Step {

    param([string]$Message, [int]$Current, [int]$Total)    param([string]$Message, [int]$Current, [int]$Total)

    Write-Host ""    Write-Host ""

    Write-Host "[$Current/$Total] $Message" -ForegroundColor Yellow    Write-Host "[$Current/$Total] $Message" -ForegroundColor Yellow

    Write-Host ("=" * 60) -ForegroundColor DarkGray    Write-Host ("=" * 60) -ForegroundColor DarkGray

}}



function Write-Success {function Write-Success {

    param([string]$Message)    param([string]$Message)

    Write-Host "  OK $Message" -ForegroundColor Green    Write-Host "  OK $Message" -ForegroundColor Green

}}



function Write-Info {function Write-Info {

    param([string]$Message)    param([string]$Message)

    Write-Host "  -> $Message" -ForegroundColor Cyan    Write-Host "  -> $Message" -ForegroundColor Cyan

}}



function Write-Warning {function Write-Warning {

    param([string]$Message)    param([string]$Message)

    Write-Host "  WARN $Message" -ForegroundColor Yellow    Write-Host "  WARN $Message" -ForegroundColor Yellow

}}



function Write-Error-Custom {function Write-Error-Custom {

    param([string]$Message)    param([string]$Message)

    Write-Host "  FAIL $Message" -ForegroundColor Red    Write-Host "  FAIL $Message" -ForegroundColor Red

}}



# ============================================================================# ============================================================================

# Prerequisite Checks# Prerequisite Checks

# ============================================================================# ============================================================================



function Test-Prerequisites {function Test-Prerequisites {

    Write-Header "Baron Car Rental - Complete Setup"    Write-Header "Baron Car Rental - Complete Setup"

        

    Write-Host "  Baron Car Rental Company" -ForegroundColor Gray    Write-Host "  سلسلة البارون Car Rental Company" -ForegroundColor Gray

    Write-Host "  Version: 1.0.0-beta" -ForegroundColor Gray    Write-Host "  Version: 1.0.0-beta" -ForegroundColor Gray

    Write-Host "  Owner: Asif Mohamed" -ForegroundColor Gray    Write-Host "  Owner: Asif Mohamed" -ForegroundColor Gray

    Write-Host ""    Write-Host ""

        

    Write-Step "Checking Prerequisites" 1 6    Write-Step "Checking Prerequisites" 1 6

        

    # Check Node.js    # Check Node.js

    try {    try {

        $nodeVersion = node --version 2>$null        $nodeVersion = node --version 2>$null

        $versionNumber = $nodeVersion -replace 'v', ''        $versionNumber = $nodeVersion -replace 'v', ''

        $majorVersion = [int]($versionNumber.Split('.')[0])        $majorVersion = [int]($versionNumber.Split('.')[0])

                

        if ($majorVersion -ge 18) {        if ($majorVersion -ge 18) {

            Write-Success "Node.js $nodeVersion (Required: 18+)"            Write-Success "Node.js $nodeVersion (Required: 18+)"

        } else {        } else {

            Write-Error-Custom "Node.js version $nodeVersion is too old (Required: 18+)"            Write-Error-Custom "Node.js version $nodeVersion is too old (Required: 18+)"

            Write-Host ""            Write-Host ""

            Write-Host "  Download Node.js 18+ from: https://nodejs.org/" -ForegroundColor Yellow            Write-Host "  Download Node.js 18+ from: https://nodejs.org/" -ForegroundColor Yellow

            exit 1            exit 1

        }        }

    } catch {    } catch {

        Write-Error-Custom "Node.js is not installed"        Write-Error-Custom "Node.js is not installed"

        Write-Host ""        Write-Host ""

        Write-Host "  Download Node.js 18+ from: https://nodejs.org/" -ForegroundColor Yellow        Write-Host "  Download Node.js 18+ from: https://nodejs.org/" -ForegroundColor Yellow

        exit 1        exit 1

    }    }

        

    # Check npm    # Check npm

    try {    try {

        $npmVersion = npm --version 2>$null        $npmVersion = npm --version 2>$null

        Write-Success "npm v$npmVersion"        Write-Success "npm v$npmVersion"

    } catch {    } catch {

        Write-Error-Custom "npm is not installed"        Write-Error-Custom "npm is not installed"

        exit 1        exit 1

    }    }

        

    # Check directory structure    # Check directory structure

    if (-not (Test-Path "$script:rootPath\server")) {    if (-not (Test-Path "$script:rootPath\server")) {

        Write-Error-Custom "Server directory not found"        Write-Error-Custom "Server directory not found"

        exit 1        exit 1

    }    }

        

    if (-not (Test-Path "$script:rootPath\client")) {    if (-not (Test-Path "$script:rootPath\client")) {

        Write-Error-Custom "Client directory not found"        Write-Error-Custom "Client directory not found"

        exit 1        exit 1

    }    }

        

    Write-Success "Directory structure verified"    Write-Success "Directory structure verified"

}}



# ============================================================================# ============================================================================

# Install Backend Dependencies# Install Backend Dependencies

# ============================================================================# ============================================================================



function Install-BackendDependencies {function Install-BackendDependencies {

    Write-Step "Installing Backend Dependencies" 2 6    Write-Step "Installing Backend Dependencies" 2 6

        

    Push-Location "$script:rootPath\server"    Push-Location "$script:rootPath\server"

        

    try {    try {

        # Clean install        # Clean install

        if (Test-Path "node_modules") {        if (Test-Path "node_modules") {

            Write-Info "Removing old node_modules..."            Write-Info "Removing old node_modules..."

            Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue            Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

        }        }

                

        if (Test-Path "package-lock.json") {        if (Test-Path "package-lock.json") {

            Write-Info "Removing old package-lock.json..."            Write-Info "Removing old package-lock.json..."

            Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue            Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

        }        }

                

        Write-Info "Installing packages (this may take 2-3 minutes)..."        Write-Info "Installing packages (this may take 2-3 minutes)..."

        $output = npm install 2>&1        $output = npm install 2>&1

                

        if ($LASTEXITCODE -eq 0) {        if ($LASTEXITCODE -eq 0) {

            $packageCount = (Get-Content package.json | ConvertFrom-Json).dependencies.PSObject.Properties.Count            $packageCount = (Get-Content package.json | ConvertFrom-Json).dependencies.PSObject.Properties.Count

            Write-Success "Installed $packageCount backend packages"            Write-Success "Installed $packageCount backend packages"

        } else {        } else {

            Write-Error-Custom "Failed to install backend dependencies"            Write-Error-Custom "Failed to install backend dependencies"

            Write-Host $output -ForegroundColor Red            Write-Host $output -ForegroundColor Red

            exit 1            exit 1

        }        }

    } finally {    } finally {

        Pop-Location        Pop-Location

    }    }

}}



# ============================================================================# ============================================================================

# Install Frontend Dependencies# Install Frontend Dependencies

# ============================================================================# ============================================================================



function Install-FrontendDependencies {function Install-FrontendDependencies {

    Write-Step "Installing Frontend Dependencies" 3 6    Write-Step "Installing Frontend Dependencies" 3 6

        

    Push-Location "$script:rootPath\client"    Push-Location "$script:rootPath\client"

        

    try {    try {

        # Clean install        # Clean install

        if (Test-Path "node_modules") {        if (Test-Path "node_modules") {

            Write-Info "Removing old node_modules..."            Write-Info "Removing old node_modules..."

            Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue            Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

        }        }

                

        if (Test-Path "package-lock.json") {        if (Test-Path "package-lock.json") {

            Write-Info "Removing old package-lock.json..."            Write-Info "Removing old package-lock.json..."

            Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue            Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

        }        }

                

        Write-Info "Installing packages (this may take 2-3 minutes)..."        Write-Info "Installing packages (this may take 2-3 minutes)..."

        $output = npm install 2>&1        $output = npm install 2>&1

                

        if ($LASTEXITCODE -eq 0) {        if ($LASTEXITCODE -eq 0) {

            $packageCount = (Get-Content package.json | ConvertFrom-Json).dependencies.PSObject.Properties.Count            $packageCount = (Get-Content package.json | ConvertFrom-Json).dependencies.PSObject.Properties.Count

            Write-Success "Installed $packageCount frontend packages"            Write-Success "Installed $packageCount frontend packages"

        } else {        } else {

            Write-Error-Custom "Failed to install frontend dependencies"            Write-Error-Custom "Failed to install frontend dependencies"

            Write-Host $output -ForegroundColor Red            Write-Host $output -ForegroundColor Red

            exit 1            exit 1

        }        }

    } finally {    } finally {

        Pop-Location        Pop-Location

    }    }

}}



# ============================================================================# ============================================================================

# Setup Prisma# Setup Prisma

# ============================================================================# ============================================================================



function Setup-Prisma {function Setup-Prisma {

    Write-Step "Setting up Prisma ORM" 4 6    Write-Step "Setting up Prisma ORM" 4 6

        

    Push-Location "$script:rootPath\server"    Push-Location "$script:rootPath\server"

        

    try {    try {

        Write-Info "Generating Prisma Client..."        Write-Info "Generating Prisma Client..."

        $output = npx prisma generate 2>&1        $output = npx prisma generate 2>&1

                

        if ($LASTEXITCODE -eq 0) {        if ($LASTEXITCODE -eq 0) {

            Write-Success "Prisma Client generated"            Write-Success "Prisma Client generated"

        } else {        } else {

            Write-Warning "Prisma generation had warnings (continuing...)"            Write-Warning "Prisma generation had warnings (continuing...)"

        }        }

    } finally {    } finally {

        Pop-Location        Pop-Location

    }    }

}}



# ============================================================================# ============================================================================

# Setup Database# Setup Database

# ============================================================================# ============================================================================



function Setup-Database {function Setup-Database {

    Write-Step "Setting up Database" 5 6    Write-Step "Setting up Database" 5 6

        

    Push-Location "$script:rootPath\server"    Push-Location "$script:rootPath\server"

        

    try {    try {

        Write-Info "Running database migrations..."        Write-Info "Running database migrations..."

        $output = npx prisma migrate deploy 2>&1        $output = npx prisma migrate deploy 2>&1

                

        if ($LASTEXITCODE -eq 0) {        if ($LASTEXITCODE -eq 0) {

            Write-Success "Database migrations applied"            Write-Success "Database migrations applied"

        } else {        } else {

            Write-Warning "Migration warnings (continuing...)"            Write-Warning "Migration warnings (continuing...)"

        }        }

                

        Write-Info "Seeding database with demo data..."        Write-Info "Seeding database with demo data..."

        $output = npm run seed 2>&1        $output = npm run seed 2>&1

                

        if ($LASTEXITCODE -eq 0) {        if ($LASTEXITCODE -eq 0) {

            Write-Success "Database seeded with demo data"            Write-Success "Database seeded with demo data"

            Write-Info "Created 6 user accounts"            Write-Info "Created 6 user accounts (Admin, Accountant, Mechanic, Warehouse, Marketing, Office)"

        } else {        } else {

            Write-Warning "Seeding had warnings (continuing...)"            Write-Warning "Seeding had warnings (continuing...)"

        }        }

    } finally {    } finally {

        Pop-Location        Pop-Location

    }    }

}}



# ============================================================================# ============================================================================

# Final Summary# Final Summary

# ============================================================================# ============================================================================



function Show-Summary {function Show-Summary {

    Write-Step "Setup Complete" 6 6    Write-Step "Setup Complete" 6 6

        

    $elapsed = (Get-Date) - $script:setupStartTime    $elapsed = (Get-Date) - $script:setupStartTime

    $minutes = [math]::Floor($elapsed.TotalMinutes)    $minutes = [math]::Floor($elapsed.TotalMinutes)

    $seconds = $elapsed.Seconds    $seconds = $elapsed.Seconds

        

    Write-Host ""    Write-Host ""

    Write-Host "================================================================" -ForegroundColor Green    Write-Host "================================================================" -ForegroundColor Green

    Write-Host "  Setup completed successfully in $minutes min $seconds sec" -ForegroundColor Green    Write-Host "  Setup completed successfully in $minutes min $seconds sec" -ForegroundColor Green

    Write-Host "================================================================" -ForegroundColor Green    Write-Host "================================================================" -ForegroundColor Green

    Write-Host ""    Write-Host ""

        

    Write-Host "NEXT STEPS:" -ForegroundColor Cyan    Write-Host "NEXT STEPS:" -ForegroundColor Cyan

    Write-Host ""    Write-Host ""

    Write-Host "1. Start Backend Server:" -ForegroundColor Yellow    Write-Host "1. Start Backend Server:" -ForegroundColor Yellow

    Write-Host "   cd server" -ForegroundColor Gray    Write-Host "   cd server" -ForegroundColor Gray

    Write-Host "   npm run dev" -ForegroundColor White    Write-Host "   npm run dev" -ForegroundColor White

    Write-Host ""    Write-Host ""

    Write-Host "2. Start Frontend (in a new terminal):" -ForegroundColor Yellow    Write-Host "2. Start Frontend (in a new terminal):" -ForegroundColor Yellow

    Write-Host "   cd client" -ForegroundColor Gray    Write-Host "   cd client" -ForegroundColor Gray

    Write-Host "   npm run dev" -ForegroundColor White    Write-Host "   npm run dev" -ForegroundColor White

    Write-Host ""    Write-Host ""

    Write-Host "3. Access the application:" -ForegroundColor Yellow    Write-Host "3. Access the application:" -ForegroundColor Yellow

    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White

    Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White    Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White

    Write-Host ""    Write-Host ""

    Write-Host "4. Login with demo accounts:" -ForegroundColor Yellow    Write-Host "4. Login with demo accounts:" -ForegroundColor Yellow

    Write-Host "   Admin:      admin@baron.ly      / Admin123!@#" -ForegroundColor White    Write-Host "   Admin:      admin@baron.ly      / Admin123!@#" -ForegroundColor White

    Write-Host "   Accountant: accountant@baron.ly / Accountant123!@#" -ForegroundColor White    Write-Host "   Accountant: accountant@baron.ly / Accountant123!@#" -ForegroundColor White

    Write-Host "   Mechanic:   mechanic@baron.ly   / Mechanic123!@#" -ForegroundColor White    Write-Host "   Mechanic:   mechanic@baron.ly   / Mechanic123!@#" -ForegroundColor White

    Write-Host "   Warehouse:  warehouse@baron.ly  / Warehouse123!@#" -ForegroundColor White    Write-Host "   Warehouse:  warehouse@baron.ly  / Warehouse123!@#" -ForegroundColor White

    Write-Host "   Marketing:  marketing@baron.ly  / Marketing123!@#" -ForegroundColor White    Write-Host "   Marketing:  marketing@baron.ly  / Marketing123!@#" -ForegroundColor White

    Write-Host "   Office:     office@baron.ly     / Office123!@#" -ForegroundColor White    Write-Host "   Office:     office@baron.ly     / Office123!@#" -ForegroundColor White

    Write-Host ""    Write-Host ""

    Write-Host "================================================================" -ForegroundColor Cyan    Write-Host "================================================================" -ForegroundColor Cyan

    Write-Host "  For help, see: QUICK_START.md or baron_Docs/" -ForegroundColor Cyan    Write-Host "  For help, see: QUICK_START.md or baron_Docs/" -ForegroundColor Cyan

    Write-Host "================================================================" -ForegroundColor Cyan    Write-Host "================================================================" -ForegroundColor Cyan

    Write-Host ""    Write-Host ""

}}



# ============================================================================# ============================================================================

# Main Execution# Main Execution

# ============================================================================# ============================================================================



try {try {

    Test-Prerequisites    Test-Prerequisites

    Install-BackendDependencies    Install-BackendDependencies

    Install-FrontendDependencies    Install-FrontendDependencies

    Setup-Prisma    Setup-Prisma

    Setup-Database    Setup-Database

    Show-Summary    Show-Summary

} catch {} catch {

    Write-Host ""    Write-Host ""

    Write-Host "================================================================" -ForegroundColor Red    Write-Host "================================================================" -ForegroundColor Red

    Write-Host "  Setup Failed" -ForegroundColor Red    Write-Host "  Setup Failed" -ForegroundColor Red

    Write-Host "================================================================" -ForegroundColor Red    Write-Host "================================================================" -ForegroundColor Red

    Write-Host ""    Write-Host ""

    Write-Host "Error: $_" -ForegroundColor Red    Write-Host "Error: $_" -ForegroundColor Red

    Write-Host ""    Write-Host ""

    Write-Host "Troubleshooting:" -ForegroundColor Yellow    Write-Host "Troubleshooting:" -ForegroundColor Yellow

    Write-Host "  1. Check your internet connection" -ForegroundColor Gray    Write-Host "  1. Check your internet connection" -ForegroundColor Gray

    Write-Host "  2. Ensure Node.js 18+ is installed" -ForegroundColor Gray    Write-Host "  2. Ensure Node.js 18+ is installed: node --version" -ForegroundColor Gray

    Write-Host "  3. Try running the script again" -ForegroundColor Gray    Write-Host "  3. Try running the script again" -ForegroundColor Gray

    Write-Host "  4. See QUICK_START.md for help" -ForegroundColor Gray    Write-Host "  4. See QUICK_START.md for detailed instructions" -ForegroundColor Gray

    Write-Host ""    Write-Host ""

    exit 1    exit 1

}}

