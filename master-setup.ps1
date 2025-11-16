# ============================================================================
# ASIF PLATFORM - MASTER SETUP SCRIPT
# Platform Owner: Asif | Business License: Baron Car Rental
# ============================================================================
# Comprehensive setup orchestration:
# 1. Initialization and path validation
# 2. Platform folder structure validation
# 3. Docker Compose deployment for platform infrastructure
# 4. Environment files validation and deployment (CRITICAL)
# 5. Directory structure integrity validation
# 6. Automatic dependency resolution and patching
# 7. Database setup and seeding with updated Prisma streams
# 8. Local service startup with platform orchestration
# 9. Deployment validation and reporting
# ============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipDocker,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipIntegrityCheck,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSeeding,
    
    [Parameter(Mandatory=$false)]
    [switch]$LocalOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# Configuration
$ErrorActionPreference = "Stop"
$Global:ScriptRoot = $PSScriptRoot
$Global:BaronRoot = "C:\Users\asif1\Desktop\Baron"
$Global:SetupLog = Join-Path $Global:ScriptRoot "master-setup.log"
$Global:ErrorsFound = @()
$Global:PatchesApplied = @()

# ============================================================================
# LOGGING AND UI FUNCTIONS
# ============================================================================

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $Global:SetupLog -Value $logMessage
    
    switch ($Level) {
        "ERROR"   { Write-Host "✗ $Message" -ForegroundColor Red }
        "SUCCESS" { Write-Host "✓ $Message" -ForegroundColor Green }
        "WARNING" { Write-Host "⚠ $Message" -ForegroundColor Yellow }
        "INFO"    { Write-Host "→ $Message" -ForegroundColor Cyan }
        "STEP"    { Write-Host "`n▶ $Message" -ForegroundColor Magenta }
        default   { Write-Host $Message }
    }
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n============================================================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "============================================================================`n" -ForegroundColor Cyan
    Write-Log $Message "STEP"
}

function Write-SubHeader {
    param([string]$Message)
    Write-Host "`n--- $Message ---" -ForegroundColor Yellow
    Write-Log $Message "INFO"
}

# ============================================================================
# PHASE 1: INITIALIZATION AND PATH VALIDATION
# ============================================================================

function Initialize-Setup {
    Write-Header "ASIF PLATFORM - MASTER SETUP INITIALIZATION"
    Write-Host "Platform Owner: Asif | Business License: Baron Car Rental`n" -ForegroundColor Gray
    
    # Initialize log file
    if (Test-Path $Global:SetupLog) {
        Remove-Item $Global:SetupLog -Force
    }
    New-Item -ItemType File -Path $Global:SetupLog -Force | Out-Null
    
    Write-Log "Master setup script started" "INFO"
    Write-Log "Script location: $Global:ScriptRoot" "INFO"
    Write-Log "Baron root: $Global:BaronRoot" "INFO"
    
    # Validate script is in correct location
    if ($Global:ScriptRoot -ne $Global:BaronRoot) {
        Write-Log "Script is not in Baron root directory!" "ERROR"
        Write-Log "Current: $Global:ScriptRoot" "ERROR"
        Write-Log "Expected: $Global:BaronRoot" "ERROR"
        
        if (-not $Force) {
            $move = Read-Host "Move script to correct location? (y/N)"
            if ($move -eq 'y' -or $move -eq 'Y') {
                Copy-Item -Path $PSCommandPath -Destination (Join-Path $Global:BaronRoot "master-setup.ps1") -Force
                Write-Log "Script copied to Baron root. Please run from there." "SUCCESS"
                exit 0
            } else {
                Write-Log "Setup aborted - script must be in Baron root" "ERROR"
                exit 1
            }
        }
    }
    
    Write-Log "Script location validated" "SUCCESS"
}

# ============================================================================
# PHASE 2: PLATFORM FOLDER VALIDATION
# ============================================================================

function Test-PlatformFolder {
    Write-Header "PLATFORM FOLDER VALIDATION"
    
    $platformPath = Join-Path $Global:BaronRoot "platform"
    
    if (-not (Test-Path $platformPath)) {
        Write-Log "Platform folder not found at: $platformPath" "ERROR"
        $Global:ErrorsFound += "Missing platform folder"
        return $false
    }
    
    Write-Log "Platform folder found" "SUCCESS"
    
    # Check critical platform files
    $criticalFiles = @(
        "package.json",
        "tsconfig.json",
        "Dockerfile",
        "src/index.ts",
        "prisma/schema.prisma"
    )
    
    $missing = @()
    foreach ($file in $criticalFiles) {
        $filePath = Join-Path $platformPath $file
        if (-not (Test-Path $filePath)) {
            $missing += $file
            Write-Log "Missing critical file: $file" "WARNING"
        } else {
            Write-Log "Found: $file" "INFO"
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Log "Platform folder incomplete - missing $($missing.Count) files" "ERROR"
        $Global:ErrorsFound += "Incomplete platform folder"
        return $false
    }
    
    Write-Log "Platform folder structure validated" "SUCCESS"
    return $true
}

# ============================================================================
# PHASE 3: DOCKER INFRASTRUCTURE DEPLOYMENT
# ============================================================================

function Deploy-DockerInfrastructure {
    if ($SkipDocker) {
        Write-Log "Skipping Docker deployment (--SkipDocker flag)" "WARNING"
        return $true
    }
    
    Write-Header "DOCKER INFRASTRUCTURE DEPLOYMENT"
    
    # Check Docker prerequisites
    Write-SubHeader "Checking Docker prerequisites"
    
    try {
        $dockerVersion = docker --version 2>&1
        Write-Log "Docker installed: $dockerVersion" "SUCCESS"
    } catch {
        Write-Log "Docker not found - attempting to install..." "WARNING"
        $Global:ErrorsFound += "Docker not installed"
        
        if (-not (Install-Docker)) {
            return $false
        }
    }
    
    # Check if Docker daemon is running
    try {
        docker ps 2>&1 | Out-Null
        Write-Log "Docker daemon is running" "SUCCESS"
    } catch {
        Write-Log "Docker daemon not running - please start Docker Desktop" "ERROR"
        $Global:ErrorsFound += "Docker daemon not running"
        return $false
    }
    
    # Check for docker-compose.yml
    $composeFile = Join-Path $Global:BaronRoot "docker-compose.yml"
    if (-not (Test-Path $composeFile)) {
        Write-Log "docker-compose.yml not found" "ERROR"
        $Global:ErrorsFound += "Missing docker-compose.yml"
        return $false
    }
    
    Write-Log "Docker Compose file found" "SUCCESS"
    
    # Check for .env.docker
    $envFile = Join-Path $Global:BaronRoot ".env.docker"
    if (-not (Test-Path $envFile)) {
        Write-Log ".env.docker not found - creating from template..." "WARNING"
        
        # Create default .env.docker
        $defaultEnv = @"
# ASIF PLATFORM - Docker Environment
NODE_ENV=production
POSTGRES_PASSWORD=postgres_secure_password
REDIS_PASSWORD=redis_secure_password
PLATFORM_HTTP_PORT=6000
PLATFORM_SSH_PORT=2222
PLATFORM_WS_PORT=6001
BACKEND_PORT=5000
FRONTEND_PORT=3000
PLATFORM_JWT_SECRET=asif-platform-jwt-secret-change-in-production
PLATFORM_SECRET=shared-secret-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!@#Platform
BARON_JWT_SECRET=baron-jwt-secret-change-in-production
ENABLE_SSH_SERVER=true
ENABLE_WS_SERVER=true
ENABLE_AUTO_DISCOVERY=true
LOG_LEVEL=info
"@
        Set-Content -Path $envFile -Value $defaultEnv
        Write-Log "Created default .env.docker" "SUCCESS"
        $Global:PatchesApplied += "Created .env.docker"
    }
    
    # Deploy Docker infrastructure
    Write-SubHeader "Deploying Docker containers"
    
    try {
        Write-Log "Building Docker images..." "INFO"
        $buildOutput = docker compose -f $composeFile --env-file $envFile build 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Docker build failed" "ERROR"
            Write-Log $buildOutput "ERROR"
            $Global:ErrorsFound += "Docker build failed"
            return $false
        }
        
        Write-Log "Docker images built successfully" "SUCCESS"
        
        Write-Log "Starting Docker containers..." "INFO"
        $upOutput = docker compose -f $composeFile --env-file $envFile up -d 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Docker container startup failed" "ERROR"
            Write-Log $upOutput "ERROR"
            $Global:ErrorsFound += "Docker startup failed"
            return $false
        }
        
        Write-Log "Docker containers started successfully" "SUCCESS"
        
        # Wait for services to be healthy
        Write-SubHeader "Waiting for services to be healthy"
        Start-Sleep -Seconds 10
        
        $services = @("postgres", "redis", "platform")
        foreach ($service in $services) {
            $containerName = switch ($service) {
                "postgres" { "baron-postgres" }
                "redis" { "baron-redis" }
                "platform" { "asif-platform" }
            }
            
            $maxAttempts = 30
            $attempt = 0
            $healthy = $false
            
            while ($attempt -lt $maxAttempts -and -not $healthy) {
                $attempt++
                $status = docker inspect --format='{{.State.Health.Status}}' $containerName 2>&1
                
                if ($status -eq "healthy") {
                    $healthy = $true
                    Write-Log "$service is healthy" "SUCCESS"
                } else {
                    Write-Host "." -NoNewline
                    Start-Sleep -Seconds 2
                }
            }
            
            if (-not $healthy) {
                Write-Log "$service failed health check" "ERROR"
                $Global:ErrorsFound += "$service not healthy"
            }
        }
        
        Write-Host "`n"
        
    } catch {
        Write-Log "Docker deployment failed: $_" "ERROR"
        $Global:ErrorsFound += "Docker deployment error"
        return $false
    }
    
    Write-Log "Docker infrastructure deployed successfully" "SUCCESS"
    return $true
}

function Install-Docker {
    Write-Log "Docker installation not automated - please install manually" "ERROR"
    Write-Log "Download from: https://www.docker.com/products/docker-desktop" "INFO"
    return $false
}

# ============================================================================
# PHASE 4: ENVIRONMENT FILES VALIDATION AND DEPLOYMENT (CRITICAL)
# ============================================================================

function Initialize-EnvironmentFiles {
    Write-Header "ENVIRONMENT FILES VALIDATION AND DEPLOYMENT"
    Write-Log "This is a CRITICAL phase - ensuring all .env files exist and are valid" "INFO"
    
    $envConfigurations = @(
        @{
            Name = "Baron Root Docker Environment"
            TemplatePath = Join-Path $Global:BaronRoot ".env.docker"
            TargetPath = Join-Path $Global:BaronRoot ".env.docker"
            Required = $true
            CreateIfMissing = $true
        },
        @{
            Name = "Platform Environment"
            TemplatePath = Join-Path $Global:BaronRoot "platform\.env.example"
            TargetPath = Join-Path $Global:BaronRoot "platform\.env"
            Required = $true
            CreateIfMissing = $true
        },
        @{
            Name = "Server Environment"
            TemplatePath = Join-Path $Global:BaronRoot "server\.env.example"
            TargetPath = Join-Path $Global:BaronRoot "server\.env"
            Required = $true
            CreateIfMissing = $true
        },
        @{
            Name = "Client Environment"
            TemplatePath = Join-Path $Global:BaronRoot "client\.env.example"
            TargetPath = Join-Path $Global:BaronRoot "client\.env"
            Required = $false
            CreateIfMissing = $true
        }
    )
    
    $envSuccess = $true
    $envCreated = 0
    $envValidated = 0
    
    foreach ($envConfig in $envConfigurations) {
        Write-SubHeader "Processing: $($envConfig.Name)"
        
        # Check if target .env exists
        if (Test-Path $envConfig.TargetPath) {
            Write-Log ".env file already exists: $($envConfig.TargetPath)" "SUCCESS"
            
            # Validate the file is not empty
            $content = Get-Content $envConfig.TargetPath -Raw -ErrorAction SilentlyContinue
            if ([string]::IsNullOrWhiteSpace($content)) {
                Write-Log ".env file exists but is empty - recreating from template" "WARNING"
                
                if (Test-Path $envConfig.TemplatePath) {
                    Copy-Item -Path $envConfig.TemplatePath -Destination $envConfig.TargetPath -Force
                    Write-Log "Recreated .env from template" "SUCCESS"
                    $envCreated++
                    $Global:PatchesApplied += "Recreated $($envConfig.Name)"
                }
            } else {
                Write-Log ".env file validated (not empty)" "SUCCESS"
                $envValidated++
            }
            
        } else {
            # .env doesn't exist
            Write-Log ".env file missing: $($envConfig.TargetPath)" "WARNING"
            
            if ($envConfig.CreateIfMissing) {
                # Check if template exists
                if (Test-Path $envConfig.TemplatePath) {
                    Write-Log "Creating .env from template: $($envConfig.TemplatePath)" "INFO"
                    
                    try {
                        Copy-Item -Path $envConfig.TemplatePath -Destination $envConfig.TargetPath -Force
                        Write-Log "Created .env successfully" "SUCCESS"
                        $envCreated++
                        $Global:PatchesApplied += "Created $($envConfig.Name)"
                        
                        # Verify the copy was successful
                        if (Test-Path $envConfig.TargetPath) {
                            $targetContent = Get-Content $envConfig.TargetPath -Raw
                            if (-not [string]::IsNullOrWhiteSpace($targetContent)) {
                                Write-Log "Verified .env file content" "SUCCESS"
                            } else {
                                Write-Log ".env file created but empty!" "ERROR"
                                $envSuccess = $false
                            }
                        } else {
                            Write-Log ".env file creation failed!" "ERROR"
                            $envSuccess = $false
                        }
                        
                    } catch {
                        Write-Log "Error creating .env: $_" "ERROR"
                        $Global:ErrorsFound += "Failed to create $($envConfig.Name)"
                        
                        if ($envConfig.Required) {
                            $envSuccess = $false
                        }
                    }
                    
                } else {
                    # Template doesn't exist
                    Write-Log "Template file missing: $($envConfig.TemplatePath)" "ERROR"
                    
                    if ($envConfig.Required) {
                        Write-Log "This is a REQUIRED environment file!" "ERROR"
                        $Global:ErrorsFound += "Missing template for $($envConfig.Name)"
                        $envSuccess = $false
                    }
                    
                    # Try to create a minimal .env file
                    if ($envConfig.Name -eq "Platform Environment") {
                        Write-Log "Creating minimal platform .env file..." "WARNING"
                        $minimalEnv = @"
# ASIF PLATFORM - Environment Configuration
# Created automatically by master-setup.ps1

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/baron_platform"
PLATFORM_PORT=6000
SSH_PORT=2222
WS_PORT=6001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!@#Platform
JWT_SECRET=asif-platform-jwt-secret-change-in-production
PLATFORM_SECRET=shared-secret-change-in-production
ENABLE_SSH_SERVER=true
ENABLE_WS_SERVER=true
ENABLE_AUTO_DISCOVERY=true
LOG_LEVEL=info
"@
                        Set-Content -Path $envConfig.TargetPath -Value $minimalEnv
                        Write-Log "Created minimal platform .env" "SUCCESS"
                        $envCreated++
                        $Global:PatchesApplied += "Created minimal $($envConfig.Name)"
                        
                    } elseif ($envConfig.Name -eq "Server Environment") {
                        Write-Log "Creating minimal server .env file..." "WARNING"
                        $minimalEnv = @"
# BARON SERVER - Environment Configuration
# Created automatically by master-setup.ps1

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/baron_db"
PORT=5000
JWT_SECRET=baron-jwt-secret-change-in-production
NODE_ENV=development
"@
                        Set-Content -Path $envConfig.TargetPath -Value $minimalEnv
                        Write-Log "Created minimal server .env" "SUCCESS"
                        $envCreated++
                        $Global:PatchesApplied += "Created minimal $($envConfig.Name)"
                    }
                }
            } else {
                Write-Log "Optional environment file - skipping" "INFO"
            }
        }
    }
    
    # Summary
    Write-Host "`n" -NoNewline
    Write-Log "Environment files summary:" "INFO"
    Write-Log "  - Files validated: $envValidated" "INFO"
    Write-Log "  - Files created: $envCreated" "INFO"
    Write-Log "  - Total processed: $($envConfigurations.Count)" "INFO"
    
    if ($envSuccess) {
        Write-Log "All required environment files are in place" "SUCCESS"
    } else {
        Write-Log "Some required environment files are missing or invalid" "ERROR"
        $Global:ErrorsFound += "Environment file validation failed"
    }
    
    return $envSuccess
}

# ============================================================================
# PHASE 5: DIRECTORY INTEGRITY CHECK
# ============================================================================

function Test-DirectoryIntegrity {
    if ($SkipIntegrityCheck) {
        Write-Log "Skipping integrity check (--SkipIntegrityCheck flag)" "WARNING"
        return $true
    }
    
    Write-Header "DIRECTORY STRUCTURE INTEGRITY CHECK"
    
    # Expected Baron architecture
    $expectedStructure = @{
        "client" = @{
            Required = $true
            Files = @("package.json", "index.html", "vite.config.ts")
            Dirs = @("src", "src/pages", "src/components")
        }
        "server" = @{
            Required = $true
            Files = @("package.json", "tsconfig.json")
            Dirs = @("src", "src/controllers", "src/routes", "prisma")
        }
        "platform" = @{
            Required = $true
            Files = @("package.json", "tsconfig.json", "Dockerfile")
            Dirs = @("src", "src/services", "prisma")
        }
    }
    
    $integrityPassed = $true
    
    foreach ($folder in $expectedStructure.Keys) {
        Write-SubHeader "Checking $folder folder"
        
        $folderPath = Join-Path $Global:BaronRoot $folder
        $config = $expectedStructure[$folder]
        
        if (-not (Test-Path $folderPath)) {
            if ($config.Required) {
                Write-Log "Required folder missing: $folder" "ERROR"
                $Global:ErrorsFound += "Missing $folder folder"
                $integrityPassed = $false
            } else {
                Write-Log "Optional folder missing: $folder" "WARNING"
            }
            continue
        }
        
        Write-Log "Folder exists: $folder" "SUCCESS"
        
        # Check required files
        foreach ($file in $config.Files) {
            $filePath = Join-Path $folderPath $file
            if (-not (Test-Path $filePath)) {
                Write-Log "Missing file: $folder/$file" "ERROR"
                $Global:ErrorsFound += "Missing $folder/$file"
                $integrityPassed = $false
            } else {
                Write-Log "Found: $file" "INFO"
            }
        }
        
        # Check required directories
        foreach ($dir in $config.Dirs) {
            $dirPath = Join-Path $folderPath $dir
            if (-not (Test-Path $dirPath)) {
                Write-Log "Missing directory: $folder/$dir" "ERROR"
                $Global:ErrorsFound += "Missing $folder/$dir"
                $integrityPassed = $false
            } else {
                Write-Log "Found: $dir" "INFO"
            }
        }
    }
    
    if ($integrityPassed) {
        Write-Log "Directory integrity check passed" "SUCCESS"
    } else {
        Write-Log "Directory integrity check failed - $($Global:ErrorsFound.Count) issues found" "ERROR"
    }
    
    return $integrityPassed
}

# ============================================================================
# PHASE 5: DEPENDENCY RESOLUTION AND AUTO-PATCHING
# ============================================================================

function Resolve-Dependencies {
    Write-Header "DEPENDENCY RESOLUTION AND AUTO-PATCHING"
    
    $modules = @("platform", "server", "client")
    
    foreach ($module in $modules) {
        Write-SubHeader "Checking $module dependencies"
        
        $modulePath = Join-Path $Global:BaronRoot $module
        $packageJson = Join-Path $modulePath "package.json"
        
        if (-not (Test-Path $packageJson)) {
            Write-Log "package.json not found in $module" "ERROR"
            $Global:ErrorsFound += "Missing $module/package.json"
            continue
        }
        
        $nodeModules = Join-Path $modulePath "node_modules"
        
        if (-not (Test-Path $nodeModules)) {
            Write-Log "node_modules not found - installing dependencies..." "WARNING"
            
            try {
                Push-Location $modulePath
                Write-Log "Running npm install in $module..." "INFO"
                
                $npmOutput = npm install 2>&1
                
                if ($LASTEXITCODE -ne 0) {
                    Write-Log "npm install failed in $module" "ERROR"
                    Write-Log $npmOutput "ERROR"
                    $Global:ErrorsFound += "npm install failed: $module"
                    Pop-Location
                    continue
                }
                
                Write-Log "Dependencies installed for $module" "SUCCESS"
                $Global:PatchesApplied += "Installed $module dependencies"
                Pop-Location
                
            } catch {
                Write-Log "Error installing dependencies: $_" "ERROR"
                $Global:ErrorsFound += "Dependency installation error: $module"
                Pop-Location
                continue
            }
        } else {
            Write-Log "Dependencies exist for $module" "SUCCESS"
        }
        
        # Check for Prisma schema
        $prismaSchema = Join-Path $modulePath "prisma/schema.prisma"
        if (Test-Path $prismaSchema) {
            Write-Log "Checking Prisma client..." "INFO"
            
            $prismaClient = Join-Path $modulePath "node_modules/.prisma/client"
            if (-not (Test-Path $prismaClient)) {
                Write-Log "Generating Prisma client for $module..." "WARNING"
                
                try {
                    Push-Location $modulePath
                    $prismaOutput = npx prisma generate 2>&1
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Log "Prisma client generated" "SUCCESS"
                        $Global:PatchesApplied += "Generated Prisma client: $module"
                    } else {
                        Write-Log "Prisma generation failed" "ERROR"
                        $Global:ErrorsFound += "Prisma generation failed: $module"
                    }
                    
                    Pop-Location
                } catch {
                    Write-Log "Error generating Prisma client: $_" "ERROR"
                    Pop-Location
                }
            } else {
                Write-Log "Prisma client exists" "SUCCESS"
            }
        }
    }
    
    # Apply known issue patches
    Apply-KnownIssuePatches
    
    Write-Log "Dependency resolution complete" "SUCCESS"
    return $true
}

function Apply-KnownIssuePatches {
    Write-SubHeader "Checking for known issues"
    
    # Patch 1: Ensure TypeScript is installed globally
    try {
        $tsVersion = tsc --version 2>&1
        Write-Log "TypeScript installed: $tsVersion" "SUCCESS"
    } catch {
        Write-Log "TypeScript not found globally - installing..." "WARNING"
        npm install -g typescript 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "TypeScript installed globally" "SUCCESS"
            $Global:PatchesApplied += "Installed TypeScript globally"
        }
    }
    
    # Patch 2: Ensure ts-node is available
    try {
        $tsNodeVersion = ts-node --version 2>&1
        Write-Log "ts-node installed: $tsNodeVersion" "SUCCESS"
    } catch {
        Write-Log "ts-node not found - installing..." "WARNING"
        npm install -g ts-node 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "ts-node installed globally" "SUCCESS"
            $Global:PatchesApplied += "Installed ts-node globally"
        }
    }
    
    # Note: Environment file creation is now handled in Phase 4 (Initialize-EnvironmentFiles)
    # This ensures all .env files are created before dependency resolution
}

# ============================================================================
# PHASE 6: DATABASE SETUP AND SEEDING
# ============================================================================

function Initialize-Database {
    Write-Header "DATABASE SETUP AND SEEDING"
    
    # Check if Docker PostgreSQL is ready
    if (-not $SkipDocker) {
        Write-SubHeader "Checking PostgreSQL connection"
        
        $maxAttempts = 10
        $attempt = 0
        $connected = $false
        
        while ($attempt -lt $maxAttempts -and -not $connected) {
            $attempt++
            try {
                $pgStatus = docker exec baron-postgres pg_isready -U postgres 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $connected = $true
                    Write-Log "PostgreSQL is ready" "SUCCESS"
                } else {
                    Write-Host "." -NoNewline
                    Start-Sleep -Seconds 2
                }
            } catch {
                Write-Host "." -NoNewline
                Start-Sleep -Seconds 2
            }
        }
        
        Write-Host "`n"
        
        if (-not $connected) {
            Write-Log "PostgreSQL not accessible" "ERROR"
            $Global:ErrorsFound += "PostgreSQL not ready"
            return $false
        }
    }
    
    # Run platform migrations
    Write-SubHeader "Running platform database migrations"
    
    $platformPath = Join-Path $Global:BaronRoot "platform"
    
    try {
        Push-Location $platformPath
        
        Write-Log "Running Prisma migrations for platform..." "INFO"
        $migrateOutput = npx prisma migrate deploy 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Platform migrations completed" "SUCCESS"
        } else {
            Write-Log "Platform migrations failed" "WARNING"
            Write-Log "Attempting to push schema..." "INFO"
            
            $pushOutput = npx prisma db push --skip-generate 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Platform schema pushed" "SUCCESS"
            }
        }
        
        Pop-Location
    } catch {
        Write-Log "Error running platform migrations: $_" "ERROR"
        Pop-Location
    }
    
    # Run server migrations
    Write-SubHeader "Running server database migrations"
    
    $serverPath = Join-Path $Global:BaronRoot "server"
    
    try {
        Push-Location $serverPath
        
        Write-Log "Running Prisma migrations for server..." "INFO"
        $migrateOutput = npx prisma migrate deploy 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Server migrations completed" "SUCCESS"
        } else {
            Write-Log "Server migrations failed" "WARNING"
            Write-Log "Attempting to push schema..." "INFO"
            
            $pushOutput = npx prisma db push --skip-generate 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Server schema pushed" "SUCCESS"
            }
        }
        
        Pop-Location
    } catch {
        Write-Log "Error running server migrations: $_" "ERROR"
        Pop-Location
    }
    
    # Seed database
    if (-not $SkipSeeding) {
        Write-SubHeader "Seeding Baron business data"
        
        $seedFile = Join-Path $serverPath "src/seed.ts"
        
        if (-not (Test-Path $seedFile)) {
            Write-Log "Seed file not found: $seedFile" "WARNING"
        } else {
            try {
                Push-Location $serverPath
                
                Write-Log "Running database seed..." "INFO"
                $seedOutput = npx ts-node src/seed.ts 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Database seeded successfully" "SUCCESS"
                    $Global:PatchesApplied += "Seeded database"
                } else {
                    Write-Log "Database seeding failed" "WARNING"
                    Write-Log $seedOutput "WARNING"
                }
                
                Pop-Location
            } catch {
                Write-Log "Error seeding database: $_" "ERROR"
                Pop-Location
            }
        }
    } else {
        Write-Log "Skipping database seeding (--SkipSeeding flag)" "WARNING"
    }
    
    Write-Log "Database setup complete" "SUCCESS"
    return $true
}

# ============================================================================
# PHASE 7: LOCAL SERVICE STARTUP WITH PLATFORM ORCHESTRATION
# ============================================================================

function Start-LocalServices {
    Write-Header "STARTING LOCAL SERVICES WITH PLATFORM ORCHESTRATION"
    
    if ($LocalOnly) {
        Write-Log "Local-only mode - skipping platform orchestration" "WARNING"
    }
    
    # Start services in correct order
    $services = @(
        @{
            Name = "Baron Backend"
            Path = "server"
            Port = 5000
            Command = "npm run dev"
            HealthCheck = "http://localhost:5000/api/health"
        },
        @{
            Name = "Baron Frontend"
            Path = "client"
            Port = 3000
            Command = "npm run dev"
            HealthCheck = "http://localhost:3000"
        }
    )
    
    foreach ($service in $services) {
        Write-SubHeader "Starting $($service.Name)"
        
        $servicePath = Join-Path $Global:BaronRoot $service.Path
        
        if (-not (Test-Path $servicePath)) {
            Write-Log "Service path not found: $servicePath" "ERROR"
            continue
        }
        
        # Check if port is available
        $portInUse = Get-NetTCPConnection -LocalPort $service.Port -ErrorAction SilentlyContinue
        if ($portInUse) {
            Write-Log "Port $($service.Port) already in use - service may already be running" "WARNING"
            continue
        }
        
        # Start service in new window
        Write-Log "Starting $($service.Name) on port $($service.Port)..." "INFO"
        
        $startScript = @"
Set-Location '$servicePath'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' $($service.Name)' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host 'Port: $($service.Port)' -ForegroundColor Yellow
Write-Host 'Path: $servicePath' -ForegroundColor Gray
Write-Host '========================================`n' -ForegroundColor Cyan
$($service.Command)
"@
        
        $scriptBlock = [scriptblock]::Create($startScript)
        
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {$startScript}" -WindowStyle Normal
        
        Write-Log "$($service.Name) startup initiated" "SUCCESS"
        
        # Wait a bit before starting next service
        Start-Sleep -Seconds 3
    }
    
    Write-Log "All local services started" "SUCCESS"
    Write-Log "Services are orchestrated by Asif Platform control plane" "INFO"
    
    return $true
}

# ============================================================================
# PHASE 8: FINAL VALIDATION AND REPORTING
# ============================================================================

function Test-Deployment {
    Write-Header "DEPLOYMENT VALIDATION"
    
    $endpoints = @(
        @{ Name = "Platform API"; URL = "http://localhost:6000/health"; Required = $true },
        @{ Name = "Platform Info"; URL = "http://localhost:6000/info"; Required = $true },
        @{ Name = "Baron Backend"; URL = "http://localhost:5000/api/health"; Required = $true },
        @{ Name = "Baron Frontend"; URL = "http://localhost:3000"; Required = $false }
    )
    
    $allHealthy = $true
    
    foreach ($endpoint in $endpoints) {
        Write-Log "Testing $($endpoint.Name)..." "INFO"
        
        try {
            $response = Invoke-WebRequest -Uri $endpoint.URL -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                Write-Log "$($endpoint.Name) is healthy" "SUCCESS"
            } else {
                Write-Log "$($endpoint.Name) returned status $($response.StatusCode)" "WARNING"
                if ($endpoint.Required) {
                    $allHealthy = $false
                }
            }
        } catch {
            Write-Log "$($endpoint.Name) is not accessible: $_" "WARNING"
            if ($endpoint.Required) {
                $allHealthy = $false
            }
        }
    }
    
    return $allHealthy
}

function Show-FinalReport {
    Write-Header "SETUP COMPLETE - FINAL REPORT"
    
    Write-Host "`n📊 SETUP SUMMARY" -ForegroundColor Cyan
    Write-Host "================`n" -ForegroundColor Cyan
    
    # Show errors
    if ($Global:ErrorsFound.Count -gt 0) {
        Write-Host "❌ ERRORS FOUND ($($Global:ErrorsFound.Count)):" -ForegroundColor Red
        foreach ($error in $Global:ErrorsFound) {
            Write-Host "   • $error" -ForegroundColor Red
        }
        Write-Host ""
    } else {
        Write-Host "✅ No errors found" -ForegroundColor Green
        Write-Host ""
    }
    
    # Show patches applied
    if ($Global:PatchesApplied.Count -gt 0) {
        Write-Host "🔧 PATCHES APPLIED ($($Global:PatchesApplied.Count)):" -ForegroundColor Yellow
        foreach ($patch in $Global:PatchesApplied) {
            Write-Host "   • $patch" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    # Show service URLs
    Write-Host "🌐 SERVICE URLS" -ForegroundColor Cyan
    Write-Host "===============`n" -ForegroundColor Cyan
    
    Write-Host "Platform (Control Plane):" -ForegroundColor Magenta
    Write-Host "  • HTTP API:   http://localhost:6000" -ForegroundColor White
    Write-Host "  • SSH Access: ssh admin@localhost -p 2222" -ForegroundColor White
    Write-Host "  • WebSocket:  ws://localhost:6001`n" -ForegroundColor White
    
    Write-Host "Baron Backend:" -ForegroundColor Green
    Write-Host "  • API:        http://localhost:5000/api" -ForegroundColor White
    Write-Host "  • Health:     http://localhost:5000/api/health`n" -ForegroundColor White
    
    Write-Host "Baron Frontend:" -ForegroundColor Yellow
    Write-Host "  • App:        http://localhost:3000`n" -ForegroundColor White
    
    Write-Host "Infrastructure:" -ForegroundColor Cyan
    Write-Host "  • PostgreSQL: localhost:5432" -ForegroundColor White
    Write-Host "  • Redis:      localhost:6379`n" -ForegroundColor White
    
    # Show next steps
    Write-Host "📝 NEXT STEPS" -ForegroundColor Cyan
    Write-Host "=============`n" -ForegroundColor Cyan
    
    if ($Global:ErrorsFound.Count -eq 0) {
        Write-Host "1. Open Baron Frontend: http://localhost:3000" -ForegroundColor White
        Write-Host "2. Login with default credentials (see README.md)" -ForegroundColor White
        Write-Host "3. Test platform SSH access: ssh admin@localhost -p 2222" -ForegroundColor White
        Write-Host "4. View platform info: http://localhost:6000/info" -ForegroundColor White
    } else {
        Write-Host "1. Review errors above" -ForegroundColor White
        Write-Host "2. Check setup log: $Global:SetupLog" -ForegroundColor White
        Write-Host "3. Fix issues and re-run: .\master-setup.ps1" -ForegroundColor White
    }
    
    Write-Host "`n"
    Write-Log "Setup log saved to: $Global:SetupLog" "INFO"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Main {
    try {
        # Phase 1: Initialization
        Initialize-Setup
        
        # Phase 2: Platform folder validation
        if (-not (Test-PlatformFolder)) {
            Write-Log "Platform folder validation failed - cannot continue" "ERROR"
            Show-FinalReport
            exit 1
        }
        
        # Phase 3: Docker deployment
        if (-not (Deploy-DockerInfrastructure)) {
            Write-Log "Docker deployment failed - some features may not work" "WARNING"
        }
        
        # Phase 4: Environment files validation (CRITICAL)
        if (-not (Initialize-EnvironmentFiles)) {
            Write-Log "Environment file validation failed - CRITICAL" "ERROR"
            
            if (-not $Force) {
                Write-Host "`nEnvironment files are missing or invalid." -ForegroundColor Red
                Write-Host "This is critical for proper operation." -ForegroundColor Red
                $continue = Read-Host "Continue anyway? (y/N)"
                
                if ($continue -ne 'y' -and $continue -ne 'Y') {
                    Write-Log "Setup aborted due to environment file issues" "ERROR"
                    Show-FinalReport
                    exit 1
                }
            }
            
            Write-Log "Continuing despite environment file issues (Force mode or user confirmation)" "WARNING"
        }
        
        # Phase 5: Integrity check
        if (-not (Test-DirectoryIntegrity)) {
            Write-Log "Integrity check failed - attempting to continue..." "WARNING"
        }
        
        # Phase 6: Dependency resolution
        Resolve-Dependencies
        
        # Phase 7: Database setup
        Initialize-Database
        
        # Phase 8: Start local services
        Start-LocalServices
        
        # Phase 9: Validation
        Write-Host "`nWaiting 15 seconds for services to initialize...`n" -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        
        Test-Deployment
        
        # Final report
        Show-FinalReport
        
        if ($Global:ErrorsFound.Count -eq 0) {
            Write-Host "`n✨ Baron Platform setup completed successfully! ✨`n" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "`n⚠️  Setup completed with errors - please review above ⚠️`n" -ForegroundColor Yellow
            exit 1
        }
        
    } catch {
        Write-Log "Fatal error during setup: $_" "ERROR"
        Write-Log $_.ScriptStackTrace "ERROR"
        Show-FinalReport
        exit 1
    }
}

# Start the setup
Main
