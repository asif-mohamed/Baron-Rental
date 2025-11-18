# Baron Car Rental - Dependencies Installation Script
# This script installs all required dependencies for Baron project
# Run this first after downloading the project from GitHub

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Baron Car Rental - Dependencies Installation          ║" -ForegroundColor Cyan
Write-Host "║     Installing Node.js packages for all components        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Function to check Node.js version
function Test-NodeVersion {
    try {
        $nodeVersion = node --version
        $versionNumber = $nodeVersion -replace 'v', ''
        $majorVersion = [int]($versionNumber.Split('.')[0])
        
        if ($majorVersion -lt 18) {
            Write-Host "⚠️  Warning: Node.js version $nodeVersion detected. Version 18+ is recommended." -ForegroundColor Yellow
            return $false
        }
        
        Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Error checking Node.js version" -ForegroundColor Red
        return $false
    }
}

# Function to check npm version
function Test-NpmVersion {
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm v$npmVersion detected" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Error checking npm version" -ForegroundColor Red
        return $false
    }
}

# Function to install dependencies in a directory
function Install-Dependencies {
    param(
        [string]$Path,
        [string]$Name
    )
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Installing $Name dependencies..." -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if (-not (Test-Path $Path)) {
        Write-Host "❌ Directory not found: $Path" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path "$Path\package.json")) {
        Write-Host "⚠️  No package.json found in $Path - Skipping" -ForegroundColor Yellow
        return $true
    }
    
    Push-Location $Path
    
    try {
        Write-Host "📦 Running npm install in $Path..." -ForegroundColor Cyan
        
        # Clean install to avoid conflicts
        if (Test-Path "node_modules") {
            Write-Host "   Removing existing node_modules..." -ForegroundColor Gray
            Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        }
        
        if (Test-Path "package-lock.json") {
            Write-Host "   Removing existing package-lock.json..." -ForegroundColor Gray
            Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
        }
        
        # Install dependencies
        $output = npm install 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Name dependencies installed successfully" -ForegroundColor Green
            
            # Count installed packages
            $packagesCount = (Get-Content package.json | ConvertFrom-Json).dependencies.PSObject.Properties.Count
            $devPackagesCount = 0
            $packageJson = Get-Content package.json | ConvertFrom-Json
            if ($packageJson.devDependencies) {
                $devPackagesCount = $packageJson.devDependencies.PSObject.Properties.Count
            }
            
            Write-Host "   📊 Installed $packagesCount dependencies" -ForegroundColor Gray
            if ($devPackagesCount -gt 0) {
                Write-Host "   📊 Installed $devPackagesCount dev dependencies" -ForegroundColor Gray
            }
            
            Pop-Location
            return $true
        }
        else {
            Write-Host "❌ Failed to install $Name dependencies" -ForegroundColor Red
            Write-Host "Error output:" -ForegroundColor Red
            Write-Host $output -ForegroundColor Red
            Pop-Location
            return $false
        }
    }
    catch {
        Write-Host "❌ Exception during installation: $_" -ForegroundColor Red
        Pop-Location
        return $false
    }
}

# Function to setup Prisma for backend
function Setup-Prisma {
    param([string]$ServerPath)
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Setting up Prisma ORM..." -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    Push-Location $ServerPath
    
    try {
        Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Cyan
        $output = npx prisma generate 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Prisma Client generated successfully" -ForegroundColor Green
            Pop-Location
            return $true
        }
        else {
            Write-Host "⚠️  Warning: Prisma generation had issues" -ForegroundColor Yellow
            Write-Host $output -ForegroundColor Yellow
            Pop-Location
            return $true  # Continue anyway
        }
    }
    catch {
        Write-Host "⚠️  Warning: Prisma setup encountered an error: $_" -ForegroundColor Yellow
        Pop-Location
        return $true  # Continue anyway
    }
}

# Main installation process
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js 18+ from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Download the LTS (Long Term Support) version" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check for npm
if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "npm should come with Node.js. Please reinstall Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check versions
$nodeOk = Test-NodeVersion
$npmOk = Test-NpmVersion

if (-not $nodeOk) {
    Write-Host ""
    Write-Host "⚠️  Your Node.js version is outdated. Please update to version 18 or higher." -ForegroundColor Yellow
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "✅ All prerequisites satisfied" -ForegroundColor Green
Write-Host ""

# Get the script directory (Baron root)
$rootPath = $PSScriptRoot

# Define component paths
$serverPath = Join-Path $rootPath "server"
$clientPath = Join-Path $rootPath "client"

# Installation tracking
$installResults = @{
    Backend = $false
    Frontend = $false
    Prisma = $false
}

# Install Backend Dependencies
$installResults.Backend = Install-Dependencies -Path $serverPath -Name "Backend (Server)"

# Install Frontend Dependencies
$installResults.Frontend = Install-Dependencies -Path $clientPath -Name "Frontend (Client)"

# Setup Prisma (if backend installation succeeded)
if ($installResults.Backend) {
    $installResults.Prisma = Setup-Prisma -ServerPath $serverPath
}

# Summary Report
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              Installation Summary                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$allSuccess = $true

foreach ($component in $installResults.Keys) {
    $status = if ($installResults[$component]) { "✅ SUCCESS" } else { "❌ FAILED" }
    $color = if ($installResults[$component]) { "Green" } else { "Red" }
    
    Write-Host "$component : $status" -ForegroundColor $color
    
    if (-not $installResults[$component]) {
        $allSuccess = $false
    }
}

Write-Host ""

if ($allSuccess) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     ✅ All dependencies installed successfully!           ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Set up environment variables (.env files)" -ForegroundColor Yellow
    Write-Host "2. Run database setup: .\setup-database.ps1" -ForegroundColor Yellow
    Write-Host "3. Start the application: .\master-setup.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For detailed setup instructions, see:" -ForegroundColor Cyan
    Write-Host "  - README.md" -ForegroundColor Gray
    Write-Host "  - baron_Docs/INSTALLATION_GUIDE.md" -ForegroundColor Gray
    Write-Host "  - baron_Docs/BETA_DEPLOYMENT_GUIDE.md" -ForegroundColor Gray
    Write-Host ""
}
else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║     ⚠️  Some components failed to install                 ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check your internet connection" -ForegroundColor Gray
    Write-Host "2. Ensure Node.js version is 18 or higher: node --version" -ForegroundColor Gray
    Write-Host "3. Try deleting node_modules folders and running this script again" -ForegroundColor Gray
    Write-Host "4. Check the error messages above for specific issues" -ForegroundColor Gray
    Write-Host ""
    Write-Host "For support, check: baron_Docs/INSTALLATION_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
