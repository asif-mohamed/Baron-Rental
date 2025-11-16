-- ============================================================================
-- ASIF PLATFORM - Database Initialization Script
-- Platform Owner: Asif | Business License: Baron Car Rental
-- ============================================================================
-- Creates separate databases for platform and Baron tenant

-- Platform database (for platform metadata)
CREATE DATABASE baron_platform;

-- Baron tenant database (for business data)
CREATE DATABASE baron_db;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE baron_platform TO postgres;
GRANT ALL PRIVILEGES ON DATABASE baron_db TO postgres;
