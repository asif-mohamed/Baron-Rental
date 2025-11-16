# ============================================================================
# NEXUS PLATFORM - Docker Setup Script
# Platform Owner: Nexus | Business License: Baron Car Rental
# ============================================================================
# This script sets up and runs the complete Baron platform using Docker Compose
# 
# Architecture:
# - Platform: Routes API requests between Baron services (frontend/backend)
# - Baron Backend: Business logic, connects to platform
# - Baron Frontend: UI served through platform routing
# - PostgreSQL: Separate databases for platform + Baron tenant
# - Redis: Caching and session management
#
# The platform acts as the control plane, discovering and routing to Baron services
# which can run locally or remotely, all listening to platform API connections.
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('up', 'down', 'restart', 'build', 'logs', 'status', 'clean')]
    [string]$Action = 'up',
    
    [Parameter(Mandatory=$false)]
    [switch]$Dev,
    
    [Parameter(Mandatory=$false)]
    [switch]$Build,
    
    [Parameter(Mandatory=$false)]
    [switch]$Detached
)

# Script configuration
$ErrorActionPreference = "Stop"
$BaronRoot = $PSScriptRoot
$EnvFile = Join-Path $BaronRoot ".env.docker"
$ComposeFile = Join-Path $BaronRoot "docker-compose.yml"

# Color output functions
function Write-Header {
    param([string]$Message)
    Write-Host "`n============================================================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "============================================================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n▶ $Message" -ForegroundColor Magenta
}

# Check prerequisites
function Test-Prerequisites {
    Write-Header "NEXUS PLATFORM - Docker Setup"
    Write-Host "Platform Owner: Nexus | Business License: Baron Car Rental`n" -ForegroundColor Gray
    
    Write-Step "Checking prerequisites..."
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker installed: $dockerVersion"
    } catch {
        Write-Error-Custom "Docker is not installed or not in PATH"
        Write-Info "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
        exit 1
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker compose version
        Write-Success "Docker Compose installed: $composeVersion"
    } catch {
        Write-Error-Custom "Docker Compose is not available"
        Write-Info "Please ensure Docker Desktop is running"
        exit 1
    }
    
    # Check Docker daemon
    try {
        docker ps | Out-Null
        Write-Success "Docker daemon is running"
    } catch {
        Write-Error-Custom "Docker daemon is not running"
        Write-Info "Please start Docker Desktop"
        exit 1
    }
    
    # Check environment file
    if (-not (Test-Path $EnvFile)) {
        Write-Info "Environment file not found. Creating from template..."
        if (Test-Path (Join-Path $BaronRoot ".env.docker")) {
            Copy-Item (Join-Path $BaronRoot ".env.docker") $EnvFile
            Write-Success "Created .env.docker file"
        } else {
            Write-Error-Custom ".env.docker template not found"
            exit 1
        }
    } else {
        Write-Success "Environment file found: .env.docker"
    }
    
    # Check compose file
    if (-not (Test-Path $ComposeFile)) {
        Write-Error-Custom "docker-compose.yml not found at $ComposeFile"
        exit 1
    }
    Write-Success "Docker Compose file found"
}

# Setup environment
function Initialize-Environment {
    Write-Step "Initializing environment..."
    
    # Load environment variables
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.+)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Info "Loaded: $key"
            }
        }
    }
    
    # Set development mode if requested
    if ($Dev) {
        Write-Info "Development mode enabled"
        [Environment]::SetEnvironmentVariable("PLATFORM_DOCKERFILE", "Dockerfile.dev", "Process")
        [Environment]::SetEnvironmentVariable("BACKEND_DOCKERFILE", "Dockerfile.dev", "Process")
        [Environment]::SetEnvironmentVariable("FRONTEND_DOCKERFILE", "Dockerfile.dev", "Process")
        [Environment]::SetEnvironmentVariable("NODE_ENV", "development", "Process")
    }
    
    Write-Success "Environment initialized"
}

# Create required directories
function Initialize-Directories {
    Write-Step "Creating required directories..."
    
    $directories = @(
        (Join-Path $BaronRoot "platform\logs"),
        (Join-Path $BaronRoot "platform\uploads"),
        (Join-Path $BaronRoot "server\logs"),
        (Join-Path $BaronRoot "server\uploads")
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Info "Created: $dir"
        }
    }
    
    Write-Success "Directories ready"
}

# Build services
function Build-Services {
    Write-Step "Building Docker images..."
    
    $buildArgs = @("compose", "-f", $ComposeFile, "--env-file", $EnvFile, "build")
    
    if (-not $Build) {
        $buildArgs += "--pull"
    }
    
    Write-Info "Running: docker $($buildArgs -join ' ')"
    & docker $buildArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker images built successfully"
    } else {
        Write-Error-Custom "Failed to build Docker images"
        exit 1
    }
}

# Start services
function Start-Services {
    Write-Step "Starting Baron platform services..."
    
    $upArgs = @("compose", "-f", $ComposeFile, "--env-file", $EnvFile, "up")
    
    if ($Detached) {
        $upArgs += "-d"
    }
    
    Write-Info "Running: docker $($upArgs -join ' ')"
    & docker $upArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Services started successfully"
        Show-ServiceInfo
    } else {
        Write-Error-Custom "Failed to start services"
        exit 1
    }
}

# Stop services
function Stop-Services {
    Write-Step "Stopping Baron platform services..."
    
    docker compose -f $ComposeFile --env-file $EnvFile down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Services stopped successfully"
    } else {
        Write-Error-Custom "Failed to stop services"
        exit 1
    }
}

# Restart services
function Restart-Services {
    Write-Step "Restarting Baron platform services..."
    
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services
}

# Show logs
function Show-Logs {
    Write-Step "Showing service logs (Ctrl+C to exit)..."
    
    docker compose -f $ComposeFile --env-file $EnvFile logs -f
}

# Show status
function Show-Status {
    Write-Header "Service Status"
    
    docker compose -f $ComposeFile --env-file $EnvFile ps
    
    Write-Host "`n"
    docker compose -f $ComposeFile --env-file $EnvFile top
}

# Clean everything
function Clean-All {
    Write-Step "Cleaning up Docker resources..."
    
    $confirm = Read-Host "This will remove all containers, volumes, and images. Continue? (y/N)"
    
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        docker compose -f $ComposeFile --env-file $EnvFile down -v --rmi all
        Write-Success "Cleanup complete"
    } else {
        Write-Info "Cleanup cancelled"
    }
}

# Show service information
function Show-ServiceInfo {
    Write-Header "Baron Platform - Service Information"
    
    Write-Host "Platform Owner: Asif | Business License: Baron Car Rental`n" -ForegroundColor Gray
    
    # Load ports from env
    $platformPort = if ($env:PLATFORM_HTTP_PORT) { $env:PLATFORM_HTTP_PORT } else { "6000" }
    $sshPort = if ($env:PLATFORM_SSH_PORT) { $env:PLATFORM_SSH_PORT } else { "2222" }
    $wsPort = if ($env:PLATFORM_WS_PORT) { $env:PLATFORM_WS_PORT } else { "6001" }
    $backendPort = if ($env:BACKEND_PORT) { $env:BACKEND_PORT } else { "5000" }
    $frontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "3000" }
    
    Write-Host "🌐 NEXUS PLATFORM (Control Plane)" -ForegroundColor Cyan
    Write-Host "   HTTP API:   http://localhost:$platformPort" -ForegroundColor White
    Write-Host "   SSH Access: ssh admin@localhost -p $sshPort" -ForegroundColor White
    Write-Host "   WebSocket:  ws://localhost:$wsPort" -ForegroundColor White
    Write-Host "   Health:     http://localhost:$platformPort/health" -ForegroundColor Gray
    Write-Host "   Info:       http://localhost:$platformPort/info`n" -ForegroundColor Gray
    
    Write-Host "🚗 BARON BACKEND (Tenant Instance)" -ForegroundColor Green
    Write-Host "   API:        http://localhost:$backendPort/api" -ForegroundColor White
    Write-Host "   Health:     http://localhost:$backendPort/api/health`n" -ForegroundColor Gray
    
    Write-Host "💻 BARON FRONTEND (Client Application)" -ForegroundColor Yellow
    Write-Host "   URL:        http://localhost:$frontendPort" -ForegroundColor White
    Write-Host "   Health:     http://localhost:$frontendPort/health`n" -ForegroundColor Gray
    
    Write-Host "📊 INFRASTRUCTURE" -ForegroundColor Magenta
    Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor White
    Write-Host "   Redis:      localhost:6379`n" -ForegroundColor White
    
    Write-Host "📝 PLATFORM ARCHITECTURE" -ForegroundColor Cyan
    Write-Host "   • Platform routes API requests between Baron services" -ForegroundColor Gray
    Write-Host "   • Baron backend connects to platform for service discovery" -ForegroundColor Gray
    Write-Host "   • Baron frontend served through platform routing" -ForegroundColor Gray
    Write-Host "   • Services can run locally or remotely" -ForegroundColor Gray
    Write-Host "   • All services listen to platform API connections`n" -ForegroundColor Gray
    
    Write-Host "🔐 SSH SOURCE CODE ACCESS" -ForegroundColor Yellow
    Write-Host "   Username:   admin" -ForegroundColor White
    Write-Host "   Password:   Admin123!@#Platform" -ForegroundColor White
    Write-Host "   Purpose:    Read-only access to platform source code for forking`n" -ForegroundColor Gray
    
    Write-Host "💡 USEFUL COMMANDS" -ForegroundColor Cyan
    Write-Host "   View logs:  .\setup-docker.ps1 -Action logs" -ForegroundColor White
    Write-Host "   Status:     .\setup-docker.ps1 -Action status" -ForegroundColor White
    Write-Host "   Restart:    .\setup-docker.ps1 -Action restart" -ForegroundColor White
    Write-Host "   Stop:       .\setup-docker.ps1 -Action down`n" -ForegroundColor White
}

# Main execution
try {
    switch ($Action) {
        'up' {
            Test-Prerequisites
            Initialize-Environment
            Initialize-Directories
            
            if ($Build) {
                Build-Services
            }
            
            Start-Services
        }
        'down' {
            Stop-Services
        }
        'restart' {
            Restart-Services
        }
        'build' {
            Test-Prerequisites
            Initialize-Environment
            Build-Services
        }
        'logs' {
            Show-Logs
        }
        'status' {
            Show-Status
        }
        'clean' {
            Clean-All
        }
        default {
            Write-Error-Custom "Unknown action: $Action"
            exit 1
        }
    }
} catch {
    Write-Error-Custom "An error occurred: $_"
    exit 1
}

Write-Host "`n"
