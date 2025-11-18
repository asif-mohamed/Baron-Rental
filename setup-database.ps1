# Baron Car Rental - Database Setup
# This script prepares Prisma and seeds the database
# Run this ONCE after copying the project to a new computer

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Baron Car Rental - Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check and create .env files if missing
Write-Host "[0/3] Checking environment files..." -ForegroundColor Yellow

# Backend .env
if (-not (Test-Path "$PSScriptRoot\server\.env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
    
    $backendEnv = @"
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="baron-secret-key-2025-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
CLIENT_URL="http://localhost:5173"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
"@
    
    Set-Content -Path "$PSScriptRoot\server\.env" -Value $backendEnv -Encoding UTF8
    Write-Host "✅ Backend .env created" -ForegroundColor Green
} else {
    Write-Host "✅ Backend .env exists" -ForegroundColor Green
}

# Frontend .env
if (-not (Test-Path "$PSScriptRoot\client\.env")) {
    Write-Host "Creating frontend .env file..." -ForegroundColor Yellow
    
    $frontendEnv = @"
VITE_API_URL=http://localhost:5000
"@
    
    Set-Content -Path "$PSScriptRoot\client\.env" -Value $frontendEnv -Encoding UTF8
    Write-Host "✅ Frontend .env created" -ForegroundColor Green
} else {
    Write-Host "✅ Frontend .env exists" -ForegroundColor Green
}

Write-Host ""

# Navigate to server directory
Set-Location -Path "$PSScriptRoot\server"

# Check if database exists (corrected path)
$dbPath = ".\dev.db"
if (Test-Path $dbPath) {
    Write-Host "⚠️  Existing database found!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to reset and reseed the database? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "Deleting existing database..." -ForegroundColor Yellow
        Remove-Item $dbPath -Force
        Write-Host "✅ Database deleted" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Keeping existing database. Only running Prisma generate..." -ForegroundColor Yellow
        npx prisma generate
        Write-Host ""
        Write-Host "✅ Setup complete (database unchanged)" -ForegroundColor Green
        Read-Host "Press Enter to exit"
        exit 0
    }
}

Write-Host "[1/3] Generating Prisma Client..." -ForegroundColor Yellow

$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"

npx prisma generate 2>&1 | Out-Null
$generateResult = $LASTEXITCODE

$ErrorActionPreference = $prevErrorAction

if ($generateResult -ne 0) {
    Write-Host "❌ Prisma generation failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Prisma Client generated successfully" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Running database migrations..." -ForegroundColor Yellow

$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"

npx prisma migrate deploy 2>&1 | Out-Null
$migrateResult = $LASTEXITCODE

$ErrorActionPreference = $prevErrorAction

if ($migrateResult -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Migrations applied successfully" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Seeding database with demo data..." -ForegroundColor Yellow

$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"

npm run seed 2>&1 | Out-Null
$seedResult = $LASTEXITCODE

$ErrorActionPreference = $prevErrorAction

if ($seedResult -ne 0) {
    Write-Host "❌ Seeding failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Database Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Cyan
Write-Host "  Email: manager@baron.local" -ForegroundColor White
Write-Host "  Password: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "You can now run the backend and frontend servers." -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"
