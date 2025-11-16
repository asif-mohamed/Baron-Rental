# Baron Car Rental System - Quick Setup Script

Write-Host "🚗 سلسلة البارون - Baron Car Rental System Setup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Backend Setup
Write-Host ""
Write-Host "📦 Setting up Backend..." -ForegroundColor Yellow
Set-Location server

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npm run prisma:generate

Write-Host "Running database migrations..." -ForegroundColor Cyan
npm run prisma:migrate

Write-Host "Seeding database with demo data..." -ForegroundColor Cyan
npm run seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database setup complete" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database seeding had issues, but continuing..." -ForegroundColor Yellow
}

# Frontend Setup
Write-Host ""
Write-Host "📦 Setting up Frontend..." -ForegroundColor Yellow
Set-Location ..\client

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

# Return to root
Set-Location ..

Write-Host ""
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open TWO terminal windows" -ForegroundColor White
Write-Host ""
Write-Host "   Terminal 1 (Backend):" -ForegroundColor Yellow
Write-Host "   cd server" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   Terminal 2 (Frontend):" -ForegroundColor Yellow
Write-Host "   cd client" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open browser to: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "3. Login with:" -ForegroundColor White
Write-Host "   Email: admin@baron.local" -ForegroundColor Gray
Write-Host "   Password: Admin123!" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green
