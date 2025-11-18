import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Get platform statistics for Admin dashboard
export const getAdminStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Verify user is Admin
    if (req.user?.roleName !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    const [totalUsers, activeUsers, totalRoles] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.role.count(),
    ]);

    // Mock data for tabs (would be stored in DB in production)
    const stats = {
      totalUsers,
      activeUsers,
      totalRoles,
      enabledTabs: 12,
      totalTabs: 14,
      databaseSize: '12.5 MB', // Would calculate actual size in production
      lastConfigChange: new Date().toISOString(),
    };

    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

// Get business configuration (flavor settings)
export const getBusinessConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.roleName !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // In production, this would be stored in a business_config table
    // For now, return default configuration
    const config = {
      displayName: 'Baron Car Rental',
      displayNameArabic: 'سلسلة البارون',
      timezone: 'Africa/Tripoli',
      currency: 'LYD',
      language: 'ar',
      theme: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#d97706',
      },
      odometerSettings: {
        kmPerDay: 100,
        extraKmCharge: 0.5,
      },
    };

    res.json({ config });
  } catch (error) {
    next(error);
  }
};

// Update business configuration
export const updateBusinessConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.roleName !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // In production, save to database
    // For now, just acknowledge the update
    const config = req.body;

    res.json({ 
      message: 'Business configuration updated successfully',
      config 
    });
  } catch (error) {
    next(error);
  }
};

// Get all tabs configuration
export const getTabs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.roleName !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // In production, this would be stored in a tabs table
    // For now, return default tabs configuration
    const tabs = [
      { id: '1', name: 'Dashboard', nameArabic: 'لوحة التحكم', route: '/', icon: 'LayoutDashboard', enabled: true, order: 1, requiredRoles: ['Admin', 'Manager'] },
      { id: '2', name: 'Fleet', nameArabic: 'الأسطول', route: '/fleet', icon: 'Car', enabled: true, order: 2, requiredRoles: ['Admin', 'Manager', 'Warehouse'] },
      { id: '3', name: 'Customers', nameArabic: 'العملاء', route: '/customers', icon: 'Users', enabled: true, order: 3, requiredRoles: ['Admin', 'Manager', 'Reception'] },
      { id: '4', name: 'Bookings', nameArabic: 'الحجوزات', route: '/bookings', icon: 'Calendar', enabled: true, order: 4, requiredRoles: ['Admin', 'Manager', 'Reception', 'Warehouse'] },
      { id: '5', name: 'Transactions', nameArabic: 'المعاملات', route: '/transactions', icon: 'DollarSign', enabled: true, order: 5, requiredRoles: ['Admin', 'Manager', 'Accountant'] },
      { id: '6', name: 'Maintenance', nameArabic: 'الصيانة', route: '/maintenance', icon: 'Wrench', enabled: true, order: 6, requiredRoles: ['Admin', 'Manager', 'Mechanic', 'Warehouse'] },
      { id: '7', name: 'Reports', nameArabic: 'التقارير', route: '/reports', icon: 'BarChart', enabled: true, order: 7, requiredRoles: ['Admin', 'Manager', 'Accountant'] },
      { id: '8', name: 'Employees', nameArabic: 'الموظفين', route: '/employees', icon: 'UserCheck', enabled: true, order: 8, requiredRoles: ['Admin', 'Manager'] },
      { id: '9', name: 'Performance', nameArabic: 'الأداء', route: '/performance', icon: 'TrendingUp', enabled: true, order: 9, requiredRoles: ['Admin', 'Manager'] },
      { id: '10', name: 'Business Planner', nameArabic: 'مخطط الأعمال', route: '/planner', icon: 'Briefcase', enabled: true, order: 10, requiredRoles: ['Admin', 'Manager'] },
      { id: '11', name: 'Notifications', nameArabic: 'الإشعارات', route: '/notifications', icon: 'Bell', enabled: true, order: 11, requiredRoles: ['Admin', 'Manager', 'Reception', 'Warehouse', 'Mechanic', 'Accountant'] },
      { id: '12', name: 'Settings', nameArabic: 'الإعدادات', route: '/settings', icon: 'Settings', enabled: true, order: 12, requiredRoles: ['Admin', 'Manager'] },
    ];

    res.json({ tabs });
  } catch (error) {
    next(error);
  }
};

// Update tab configuration
export const updateTab = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.roleName !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    const { id } = req.params;
    const updates = req.body;

    // In production, update in database
    res.json({ 
      message: 'Tab updated successfully',
      tabId: id,
      updates 
    });
  } catch (error) {
    next(error);
  }
};

// Get all roles
export const getRoles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.roleName !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // Enhance with configuration metadata
    const rolesConfig = roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.name,
      displayNameArabic: getRoleArabicName(role.name),
      description: role.description || getDefaultRoleDescription(role.name),
      enabled: true,
      permissions: getDefaultPermissions(role.name),
    }));

    res.json({ roles: rolesConfig });
  } catch (error) {
    next(error);
  }
};

// Update role configuration
export const updateRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.roleName !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Prevent disabling Admin role
    const role = await prisma.role.findUnique({ where: { id } });
    if (role?.name === 'Admin' && updates.enabled === false) {
      return res.status(400).json({ error: 'Cannot disable Admin role' });
    }

    // In production, update role configuration in database
    res.json({ 
      message: 'Role updated successfully',
      roleId: id,
      updates 
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function getRoleArabicName(roleName: string): string {
  const names: Record<string, string> = {
    'Admin': 'مدير النظام',
    'Manager': 'مدير',
    'Reception': 'موظف استقبال',
    'Warehouse': 'أمين مستودع',
    'Accountant': 'محاسب',
    'Mechanic': 'ميكانيكي',
  };
  return names[roleName] || roleName;
}

function getDefaultRoleDescription(roleName: string): string {
  const descriptions: Record<string, string> = {
    'Admin': 'Platform configurator with full access to all features and settings',
    'Manager': 'Business oversight, approvals, and performance tracking',
    'Reception': 'Customer service, bookings, and customer search',
    'Warehouse': 'Fleet logistics, pickup and return management',
    'Accountant': 'Financial management, revenue and expense tracking',
    'Mechanic': 'Vehicle maintenance and repair tasks',
  };
  return descriptions[roleName] || 'User role';
}

function getDefaultPermissions(roleName: string): string[] {
  const permissions: Record<string, string[]> = {
    'Admin': ['*'],
    'Manager': ['bookings.*', 'customers.*', 'reports.*', 'users.read'],
    'Reception': ['bookings.*', 'customers.*'],
    'Warehouse': ['cars.*', 'bookings.read'],
    'Accountant': ['transactions.*', 'reports.financial'],
    'Mechanic': ['maintenance.*'],
  };
  return permissions[roleName] || [];
}
