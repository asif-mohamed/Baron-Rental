# Baron Car Rental - Database Setup
# This script prepares Prisma and seeds the database
# Run this ONCE after copying the project to a new computer

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Baron Car Rental - Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to server directory
Set-Location -Path "$PSScriptRoot\server"

# Check if database exists
$dbPath = ".\prisma\dev.db"
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
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generation failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Prisma Client generated successfully" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Migrations applied successfully" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Seeding database with demo data..." -ForegroundColor Yellow
npm run seed

if ($LASTEXITCODE -ne 0) {
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
