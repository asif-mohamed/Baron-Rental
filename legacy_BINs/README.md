# Legacy Setup Scripts Archive

These scripts have been replaced by the new **`master-setup.ps1`** automated orchestration system.

## Archived Scripts

### Setup Scripts
- **`setup.ps1`** - Original manual setup script
  - **Replaced by:** `master-setup.ps1` Phase 5 (Dependency Resolution)
  
- **`setup-database.ps1`** - Manual database setup
  - **Replaced by:** `master-setup.ps1` Phase 6 (Database Setup and Seeding)

### Service Startup Scripts
- **`start-all.ps1`** - Start all services manually
  - **Replaced by:** `master-setup.ps1` Phase 7 (Local Service Startup)
  
- **`start-backend.ps1`** - Start Baron backend only
  - **Replaced by:** `master-setup.ps1` Phase 7 (automatic backend startup)
  
- **`start-frontend.ps1`** - Start Baron frontend only
  - **Replaced by:** `master-setup.ps1` Phase 7 (automatic frontend startup)
  
- **`start-platform.bat`** - Start platform service
  - **Replaced by:** `setup-docker.ps1` or `master-setup.ps1` Phase 3 (Docker deployment)

### Testing Scripts
- **`test-all-dashboards.ps1`** - Dashboard testing script
  - **Replaced by:** `master-setup.ps1` Phase 8 (Deployment Validation)
  
- **`verify-deployment.ps1`** - Manual deployment verification
  - **Replaced by:** `master-setup.ps1` Phase 8 (Deployment Validation)

## Why These Were Replaced

### Problems with Old Approach
1. **Manual execution** - Required running multiple scripts in sequence
2. **No error handling** - Scripts would fail silently
3. **No validation** - Didn't check if dependencies existed
4. **No auto-patching** - Manual fixes required for common issues
5. **No orchestration** - Services started independently, not coordinated

### New Master Setup Advantages
1. **Single command** - `.\master-setup.ps1` does everything
2. **Comprehensive logging** - All actions logged to `master-setup.log`
3. **Auto-validation** - Checks directory structure and dependencies
4. **Auto-patching** - Fixes known issues automatically
5. **Platform orchestration** - Services coordinate through platform control plane
6. **Health checks** - Validates all services are running correctly
7. **Detailed reporting** - Shows what was done and any issues found

## Migration Guide

### Old Workflow
```powershell
# Step 1: Install dependencies
.\setup.ps1

# Step 2: Setup database
.\setup-database.ps1

# Step 3: Start services manually
.\start-backend.ps1
.\start-frontend.ps1

# Step 4: Verify everything works
.\verify-deployment.ps1
```

### New Workflow
```powershell
# Single command does everything
.\master-setup.ps1
```

## When to Use Legacy Scripts

These scripts are kept for reference only. **DO NOT USE** them for new deployments.

However, they may be useful for:
- **Understanding old architecture** - See how things were done before
- **Debugging specific issues** - Isolate single components
- **Reference implementation** - Study specific functionality

## Recommended Actions

1. **Use `master-setup.ps1`** for all new deployments
2. **Use `setup-docker.ps1`** for Docker-only deployments
3. **Refer to `MASTER_SETUP_GUIDE.md`** for comprehensive documentation

## Script Comparison

| Task | Old Scripts | New Script |
|------|-------------|------------|
| Dependency Installation | `setup.ps1` | `master-setup.ps1` (auto) |
| Database Setup | `setup-database.ps1` | `master-setup.ps1` (auto) |
| Database Seeding | Manual `npx ts-node src/seed.ts` | `master-setup.ps1` (auto) |
| Start Backend | `start-backend.ps1` | `master-setup.ps1` (auto) |
| Start Frontend | `start-frontend.ps1` | `master-setup.ps1` (auto) |
| Deployment Check | `verify-deployment.ps1` | `master-setup.ps1` (auto) |
| Dashboard Testing | `test-all-dashboards.ps1` | Integrated validation |
| Error Handling | None | Comprehensive logging |
| Auto-Patching | None | Built-in fixes |
| Platform Integration | None | Full orchestration |

## Deletion Policy

**Keep these files** for the following period:
- **6 months** - For reference and rollback if needed
- After that, they can be safely deleted

## Support

If you need to understand what these old scripts did:
1. Read the script comments
2. Compare with new `master-setup.ps1` implementation
3. Refer to `MASTER_SETUP_GUIDE.md` for new architecture

## Questions?

- **Q: Can I still use these scripts?**
  - A: Not recommended. Use `master-setup.ps1` instead.

- **Q: What if master-setup fails?**
  - A: Check `master-setup.log` for details. Don't fall back to old scripts.

- **Q: Are these scripts maintained?**
  - A: No. They are archived for reference only.

---

**Last Updated:** November 16, 2025  
**Status:** Archived - DO NOT USE  
**Replacement:** `master-setup.ps1` and `setup-docker.ps1`
