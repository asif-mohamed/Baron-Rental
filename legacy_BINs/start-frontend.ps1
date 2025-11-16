# Baron Car Rental - Start Frontend Server
# This script starts the frontend development server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Baron Car Rental - Frontend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to client directory
Set-Location -Path "$PSScriptRoot\client"

Write-Host "Starting frontend server on port 5173..." -ForegroundColor Green
Write-Host ""

# Start the development server
npm run dev
