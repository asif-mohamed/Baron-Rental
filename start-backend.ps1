# Baron Car Rental - Start Backend Server
# This script starts the backend development server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Baron Car Rental - Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to server directory
Set-Location -Path "$PSScriptRoot\server"

Write-Host "Starting backend server on port 5000..." -ForegroundColor Green
Write-Host ""

# Start the development server
npm run dev
