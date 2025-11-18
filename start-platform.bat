@echo off
echo ====================================
echo Baron Platform - Setup & Start
echo ====================================
echo.

cd platform

echo [1/5] Installing dependencies...
call npm install

echo.
echo [2/5] Generating Prisma client...
call npm run prisma:generate

echo.
echo [3/5] Running database migrations...
call npm run prisma:migrate

echo.
echo [4/5] Creating logs directory...
if not exist "logs" mkdir logs

echo.
echo [5/5] Starting platform server...
echo.
echo Platform will be available at:
echo   HTTP API:  http://localhost:6000
echo   SSH:       ssh admin@localhost -p 2222
echo   WebSocket: ws://localhost:6001
echo.
call npm run dev
