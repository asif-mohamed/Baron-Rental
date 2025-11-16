# Baron Car Rental - Start All Servers
# This script starts both backend and frontend servers in separate windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Baron Car Rental - Starting All" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = $PSScriptRoot

# Check if database exists
$dbPath = Join-Path $scriptPath "server\prisma\dev.db"
if (-not (Test-Path $dbPath)) {
    Write-Host "⚠️  Database not found!" -ForegroundColor Yellow
    Write-Host "Please run 'setup-database.ps1' first to initialize the database." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to run setup now? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        & "$scriptPath\setup-database.ps1"
    } else {
        Write-Host "Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptPath\start-backend.ps1" -WindowStyle Normal

Write-Host "Waiting 5 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptPath\start-frontend.ps1" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Baron is Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "  Email: manager@baron.local"
Write-Host "  Password: Admin123!"
Write-Host ""
Write-Host "Press Ctrl+C in each terminal window to stop the servers." -ForegroundColor Gray
Write-Host ""
