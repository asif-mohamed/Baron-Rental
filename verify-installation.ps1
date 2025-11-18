# Baron - Verify Installation Script
# Quick check to ensure all dependencies are installed correctly

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Baron Car Rental - Installation Verification          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$script:issues = @()
$script:warnings = @()
$script:success = @()

# Function to check command
function Test-Command {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Function to check directory
function Test-DirectoryExists {
    param($path, $name)
    if (Test-Path $path) {
        $script:success += "✅ $name exists"
        return $true
    } else {
        $script:issues += "❌ $name not found at: $path"
        return $false
    }
}

# Function to check file
function Test-FileExists {
    param($path, $name)
    if (Test-Path $path) {
        $script:success += "✅ $name exists"
        return $true
    } else {
        $script:warnings += "⚠️  $name not found (may be optional): $path"
        return $false
    }
}

# Get the script directory
$rootPath = $PSScriptRoot

Write-Host "🔍 Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    $versionNumber = $nodeVersion -replace 'v', ''
    $majorVersion = [int]($versionNumber.Split('.')[0])
    
    if ($majorVersion -ge 18) {
        $script:success += "✅ Node.js $nodeVersion (Required: 18+)"
    } else {
        $script:issues += "❌ Node.js version $nodeVersion is too old (Required: 18+)"
    }
} else {
    $script:issues += "❌ Node.js is not installed"
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    $script:success += "✅ npm v$npmVersion"
} else {
    $script:issues += "❌ npm is not installed"
}

Write-Host ""
Write-Host "🔍 Checking Project Structure..." -ForegroundColor Yellow
Write-Host ""

# Check directories
Test-DirectoryExists -path "$rootPath\server" -name "Backend (server) directory" | Out-Null
Test-DirectoryExists -path "$rootPath\client" -name "Frontend (client) directory" | Out-Null
Test-DirectoryExists -path "$rootPath\baron_Docs" -name "Documentation directory" | Out-Null

Write-Host ""
Write-Host "🔍 Checking Backend Setup..." -ForegroundColor Yellow
Write-Host ""

# Check backend files
Test-FileExists -path "$rootPath\server\package.json" -name "Backend package.json" | Out-Null
Test-DirectoryExists -path "$rootPath\server\node_modules" -name "Backend node_modules" | Out-Null
Test-DirectoryExists -path "$rootPath\server\prisma" -name "Prisma directory" | Out-Null
Test-FileExists -path "$rootPath\server\prisma\schema.prisma" -name "Prisma schema" | Out-Null

# Check if Prisma Client is generated
if (Test-Path "$rootPath\server\node_modules\.prisma") {
    $script:success += "✅ Prisma Client is generated"
} else {
    $script:warnings += "⚠️  Prisma Client not generated (run: npx prisma generate)"
}

# Check database
if (Test-Path "$rootPath\server\prisma\dev.db") {
    $script:success += "✅ Database file exists (dev.db)"
} else {
    $script:warnings += "⚠️  Database not created (run: npx prisma migrate deploy)"
}

Write-Host ""
Write-Host "🔍 Checking Frontend Setup..." -ForegroundColor Yellow
Write-Host ""

# Check frontend files
Test-FileExists -path "$rootPath\client\package.json" -name "Frontend package.json" | Out-Null
Test-DirectoryExists -path "$rootPath\client\node_modules" -name "Frontend node_modules" | Out-Null
Test-DirectoryExists -path "$rootPath\client\src" -name "Frontend source directory" | Out-Null

Write-Host ""
Write-Host "🔍 Checking Scripts..." -ForegroundColor Yellow
Write-Host ""

# Check scripts
Test-FileExists -path "$rootPath\install-dependencies.ps1" -name "Dependency installer script" | Out-Null
Test-FileExists -path "$rootPath\setup-database.ps1" -name "Database setup script" | Out-Null
Test-FileExists -path "$rootPath\start-all.ps1" -name "Start all script" | Out-Null

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    Verification Summary                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Display results
if ($script:success.Count -gt 0) {
    Write-Host "✅ Success ($($script:success.Count)):" -ForegroundColor Green
    foreach ($item in $script:success) {
        Write-Host "   $item" -ForegroundColor Green
    }
    Write-Host ""
}

if ($script:warnings.Count -gt 0) {
    Write-Host "⚠️  Warnings ($($script:warnings.Count)):" -ForegroundColor Yellow
    foreach ($item in $script:warnings) {
        Write-Host "   $item" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($script:issues.Count -gt 0) {
    Write-Host "❌ Issues ($($script:issues.Count)):" -ForegroundColor Red
    foreach ($item in $script:issues) {
        Write-Host "   $item" -ForegroundColor Red
    }
    Write-Host ""
}

# Final verdict
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($script:issues.Count -eq 0) {
    if ($script:warnings.Count -eq 0) {
        Write-Host "🎉 Perfect! Everything is installed correctly!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now:" -ForegroundColor Cyan
        Write-Host "  1. Setup database: .\setup-database.ps1" -ForegroundColor Gray
        Write-Host "  2. Start the app: .\start-all.ps1" -ForegroundColor Gray
    } else {
        Write-Host "✅ Installation looks good with minor warnings" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Review warnings above" -ForegroundColor Gray
        Write-Host "  2. Setup database: .\setup-database.ps1" -ForegroundColor Gray
        Write-Host "  3. Start the app: .\start-all.ps1" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  There are issues that need to be fixed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Recommended actions:" -ForegroundColor Yellow
    
    if ($script:issues -match "Node.js") {
        Write-Host "  • Install Node.js 18+ from: https://nodejs.org/" -ForegroundColor Gray
    }
    
    if ($script:issues -match "node_modules") {
        Write-Host "  • Run: .\install-dependencies.ps1" -ForegroundColor Gray
    }
    
    if ($script:issues -match "directory") {
        Write-Host "  • Ensure you extracted the full ZIP file" -ForegroundColor Gray
        Write-Host "  • Check that you're in the correct directory" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "For detailed setup instructions, see: QUICK_START.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
