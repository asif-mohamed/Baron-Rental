import { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Layers, 
  Palette, 
  Database, 
  ToggleLeft,
  ToggleRight,
  Edit2,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Building2,
  Globe,
  Layout,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

interface BusinessConfig {
  displayName: string;
  displayNameArabic: string;
  domain?: string;
  timezone: string;
  currency: string;
  language: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
  };
  odometerSettings?: {
    kmPerDay: number;
    extraKmCharge: number;
  };
}

interface TabConfig {
  id: string;
  name: string;
  nameArabic: string;
  route: string;
  icon: string;
  enabled: boolean;
  order: number;
  requiredRoles: string[];
}

interface RoleConfig {
  id: string;
  name: string;
  displayName: string;
  displayNameArabic: string;
  description: string;
  enabled: boolean;
  permissions: string[];
}

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  enabledTabs: number;
  totalTabs: number;
  databaseSize: string;
  lastConfigChange: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'business' | 'tabs' | 'roles' | 'users'>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>({
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
    }
  });
  const [tabs, setTabs] = useState<TabConfig[]>([]);
  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editingRoles, setEditingRoles] = useState(false);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      const [statsRes, tabsRes, rolesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/tabs'),
        api.get('/admin/roles'),
      ]);

      setStats(statsRes.data.stats || getDefaultStats());
      setTabs(tabsRes.data.tabs || getDefaultTabs());
      setRoles(rolesRes.data.roles || getDefaultRoles());
    } catch (error) {
      console.error('Failed to fetch platform data:', error);
      // Use defaults for offline development
      setStats(getDefaultStats());
      setTabs(getDefaultTabs());
      setRoles(getDefaultRoles());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultStats = (): PlatformStats => ({
    totalUsers: 6,
    activeUsers: 6,
    totalRoles: 6,
    enabledTabs: 12,
    totalTabs: 14,
    databaseSize: '12.5 MB',
    lastConfigChange: new Date().toISOString(),
  });

  const getDefaultTabs = (): TabConfig[] => [
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

  const getDefaultRoles = (): RoleConfig[] => [
    { id: '1', name: 'Admin', displayName: 'Administrator', displayNameArabic: 'مدير النظام', description: 'Platform configurator with full access', enabled: true, permissions: ['*'] },
    { id: '2', name: 'Manager', displayName: 'Manager', displayNameArabic: 'مدير', description: 'Business oversight and approvals', enabled: true, permissions: ['bookings.*', 'customers.*', 'reports.*', 'users.read'] },
    { id: '3', name: 'Accountant', displayName: 'Accountant', displayNameArabic: 'محاسب', description: 'Financial management', enabled: true, permissions: ['transactions.*', 'reports.financial'] },
    { id: '4', name: 'Reception', displayName: 'Receptionist', displayNameArabic: 'موظف استقبال', description: 'Customer service and bookings', enabled: true, permissions: ['bookings.*', 'customers.*'] },
    { id: '5', name: 'Warehouse', displayName: 'Warehouse Manager', displayNameArabic: 'أمين مستودع', description: 'Fleet logistics', enabled: true, permissions: ['cars.*', 'bookings.read'] },
    { id: '6', name: 'Mechanic', displayName: 'Mechanic', displayNameArabic: 'ميكانيكي', description: 'Vehicle maintenance', enabled: true, permissions: ['maintenance.*'] },
  ];

  const handleSaveBusinessConfig = async () => {
    try {
      await api.put('/admin/business-config', businessConfig);
      toast.success('تم حفظ إعدادات العمل بنجاح');
      setEditingBusiness(false);
    } catch (error) {
      toast.error('فشل حفظ إعدادات العمل');
    }
  };

  const toggleTab = async (tabId: string) => {
    try {
      const tab = tabs.find(t => t.id === tabId);
      if (!tab) return;

      await api.patch(`/admin/tabs/${tabId}`, { enabled: !tab.enabled });
      setTabs(tabs.map(t => t.id === tabId ? { ...t, enabled: !t.enabled } : t));
      toast.success(`تم ${!tab.enabled ? 'تفعيل' : 'تعطيل'} التبويب ${tab.nameArabic}`);
    } catch (error) {
      toast.error('فشل تحديث التبويب');
    }
  };

  const toggleRole = async (roleId: string) => {
    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) return;

      if (role.name === 'Admin') {
        toast.warning('لا يمكن تعطيل دور المدير');
        return;
      }

      await api.patch(`/admin/roles/${roleId}`, { enabled: !role.enabled });
      setRoles(roles.map(r => r.id === roleId ? { ...r, enabled: !r.enabled } : r));
      toast.success(`تم ${!role.enabled ? 'تفعيل' : 'تعطيل'} دور ${role.displayNameArabic}`);
    } catch (error) {
      toast.error('فشل تحديث الدور');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              مرحباً {user?.fullName}
            </h1>
            <p className="text-primary-100 text-lg">
              🔧 مدير المنصة - إعدادات النظام والتخصيص
            </p>
            <p className="text-primary-200 text-sm mt-1">
              Platform Configurator - Business Logic & Multi-Tenant Management
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 text-center">
            <Shield className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm font-medium">Admin Access</p>
            <p className="text-xs text-primary-200">Full Configuration</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md p-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeSection === 'overview'
              ? 'bg-primary-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Database className="w-4 h-4 inline ml-2" />
          نظرة عامة
        </button>
        <button
          onClick={() => setActiveSection('business')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeSection === 'business'
              ? 'bg-primary-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Building2 className="w-4 h-4 inline ml-2" />
          إعدادات العمل
        </button>
        <button
          onClick={() => setActiveSection('tabs')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeSection === 'tabs'
              ? 'bg-primary-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Layout className="w-4 h-4 inline ml-2" />
          إدارة التبويبات
        </button>
        <button
          onClick={() => setActiveSection('roles')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeSection === 'roles'
              ? 'bg-primary-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Shield className="w-4 h-4 inline ml-2" />
          إدارة الأدوار
        </button>
        <button
          onClick={() => setActiveSection('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeSection === 'users'
              ? 'bg-primary-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="w-4 h-4 inline ml-2" />
          إدارة المستخدمين
        </button>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
                  <p className="text-sm text-blue-700 mt-1">{stats.activeUsers} نشط</p>
                </div>
                <Users className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">الأدوار المفعلة</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.totalRoles}</p>
                  <p className="text-sm text-purple-700 mt-1">من {stats.totalRoles} دور</p>
                </div>
                <Shield className="w-12 h-12 text-purple-600" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">التبويبات المفعلة</p>
                  <p className="text-3xl font-bold text-green-900">{stats.enabledTabs}</p>
                  <p className="text-sm text-green-700 mt-1">من {stats.totalTabs} تبويب</p>
                </div>
                <Layout className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">حجم قاعدة البيانات</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.databaseSize}</p>
                  <p className="text-sm text-orange-700 mt-1">SQLite/PostgreSQL</p>
                </div>
                <Database className="w-12 h-12 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-4" dir="rtl">نظرة عامة على إعدادات المنصة</h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" dir="rtl">
                <span className="font-medium">اسم الشركة (عربي):</span>
                <span className="text-primary-700 font-semibold">{businessConfig.displayNameArabic}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" dir="rtl">
                <span className="font-medium">اسم الشركة (إنجليزي):</span>
                <span className="text-primary-700">{businessConfig.displayName}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" dir="rtl">
                <span className="font-medium">العملة:</span>
                <span className="text-primary-700 font-semibold">دينار ليبي ({businessConfig.currency})</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" dir="rtl">
                <span className="font-medium">المنطقة الزمنية:</span>
                <span className="text-primary-700">طرابلس ({businessConfig.timezone})</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" dir="rtl">
                <span className="font-medium">آخر تحديث للإعدادات:</span>
                <span className="text-gray-600">{new Date(stats.lastConfigChange).toLocaleString('ar-LY')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Configuration Section */}
      {activeSection === 'business' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Business Configuration (Flavor Settings)</h3>
            {editingBusiness ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveBusinessConfig}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ
                </button>
                <button
                  onClick={() => setEditingBusiness(false)}
                  className="btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingBusiness(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                تعديل
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Display Name (English)</label>
              <input
                type="text"
                value={businessConfig.displayName}
                onChange={(e) => setBusinessConfig({ ...businessConfig, displayName: e.target.value })}
                disabled={!editingBusiness}
                className="input"
                placeholder="Baron Car Rental"
              />
            </div>

            <div>
              <label className="label">Display Name (Arabic)</label>
              <input
                type="text"
                value={businessConfig.displayNameArabic}
                onChange={(e) => setBusinessConfig({ ...businessConfig, displayNameArabic: e.target.value })}
                disabled={!editingBusiness}
                className="input"
                placeholder="سلسلة البارون"
              />
            </div>

            <div>
              <label className="label">Domain (Optional)</label>
              <input
                type="text"
                value={businessConfig.domain || ''}
                onChange={(e) => setBusinessConfig({ ...businessConfig, domain: e.target.value })}
                disabled={!editingBusiness}
                className="input"
                placeholder="baron.example.com"
              />
            </div>

            <div>
              <label className="label">Timezone</label>
              <select
                value={businessConfig.timezone}
                onChange={(e) => setBusinessConfig({ ...businessConfig, timezone: e.target.value })}
                disabled={!editingBusiness}
                className="input"
              >
                <option value="Africa/Tripoli">Africa/Tripoli (GMT+2)</option>
                <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
              </select>
            </div>

            <div>
              <label className="label">Currency</label>
              <select
                value={businessConfig.currency}
                onChange={(e) => setBusinessConfig({ ...businessConfig, currency: e.target.value })}
                disabled={!editingBusiness}
                className="input"
              >
                <option value="LYD">LYD - Libyan Dinar</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="EGP">EGP - Egyptian Pound</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div>
              <label className="label">Language</label>
              <select
                value={businessConfig.language}
                onChange={(e) => setBusinessConfig({ ...businessConfig, language: e.target.value })}
                disabled={!editingBusiness}
                className="input"
              >
                <option value="ar">Arabic (العربية)</option>
                <option value="en">English</option>
                <option value="ar-en">Bilingual (Arabic/English)</option>
              </select>
            </div>

            <div>
              <label className="label">Primary Color (Theme)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={businessConfig.theme.primaryColor}
                  onChange={(e) => setBusinessConfig({ 
                    ...businessConfig, 
                    theme: { ...businessConfig.theme, primaryColor: e.target.value }
                  })}
                  disabled={!editingBusiness}
                  className="w-16 h-10 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={businessConfig.theme.primaryColor}
                  onChange={(e) => setBusinessConfig({ 
                    ...businessConfig, 
                    theme: { ...businessConfig.theme, primaryColor: e.target.value }
                  })}
                  disabled={!editingBusiness}
                  className="input flex-1"
                  placeholder="#1e3a8a"
                />
              </div>
            </div>

            <div>
              <label className="label">Secondary Color (Accent)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={businessConfig.theme.secondaryColor}
                  onChange={(e) => setBusinessConfig({ 
                    ...businessConfig, 
                    theme: { ...businessConfig.theme, secondaryColor: e.target.value }
                  })}
                  disabled={!editingBusiness}
                  className="w-16 h-10 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={businessConfig.theme.secondaryColor}
                  onChange={(e) => setBusinessConfig({ 
                    ...businessConfig, 
                    theme: { ...businessConfig.theme, secondaryColor: e.target.value }
                  })}
                  disabled={!editingBusiness}
                  className="input flex-1"
                  placeholder="#d97706"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-900">
              <strong>💡 Platform Flavor Configuration:</strong> These settings allow you to customize Baron for different tenants. 
              Change the business name, branding, timezone, and currency to create unique "flavors" for each deployment.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Management Section */}
      {activeSection === 'tabs' && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Tab Management (Enable/Disable Features)</h3>
          <p className="text-gray-600 mb-6">
            Control which tabs are visible in the navigation. Disabled tabs will be hidden for all users.
          </p>

          <div className="space-y-3">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  tab.enabled
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleTab(tab.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      tab.enabled
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                    }`}
                  >
                    {tab.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{tab.nameArabic}</h4>
                      <span className="text-sm text-gray-500">({tab.name})</span>
                      {tab.enabled ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Route: <code className="bg-gray-200 px-2 py-0.5 rounded">{tab.route}</code>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Roles: {tab.requiredRoles.join(', ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tab.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.enabled ? 'مفعّل' : 'معطّل'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
            <p className="text-sm text-orange-900">
              <strong>⚠️ Note:</strong> Disabling tabs will hide them from all users immediately. Make sure business workflows don't depend on disabled features.
            </p>
          </div>
        </div>
      )}

      {/* Roles Management Section */}
      {activeSection === 'roles' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Role Management (Configure User Types)</h3>
            <button
              onClick={() => setEditingRoles(!editingRoles)}
              className={`btn-${editingRoles ? 'secondary' : 'primary'} flex items-center gap-2`}
            >
              <Edit2 className="w-4 h-4" />
              {editingRoles ? 'إلغاء التعديل' : 'تعديل الأدوار'}
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Enable or disable user roles for this Baron flavor. Disabled roles cannot be assigned to users.
          </p>

          {!editingRoles && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">
                🔒 <strong>View Mode:</strong> Click "تعديل الأدوار" to enable or disable roles.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  role.enabled
                    ? 'border-purple-200 bg-purple-50'
                    : 'border-gray-200 bg-gray-50'
                } ${role.name === 'Admin' ? 'border-primary-300 bg-primary-50' : ''}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleRole(role.id)}
                    disabled={role.name === 'Admin' || !editingRoles}
                    className={`p-2 rounded-lg transition-colors ${
                      role.name === 'Admin'
                        ? 'bg-primary-500 text-white cursor-not-allowed'
                        : !editingRoles
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : role.enabled
                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                        : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{role.displayNameArabic}</h4>
                      <span className="text-sm text-gray-500">({role.displayName})</span>
                      {role.name === 'Admin' && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded-full">
                          Platform Configurator
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Permissions: {role.permissions.join(', ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      role.name === 'Admin'
                        ? 'bg-primary-100 text-primary-800'
                        : role.enabled
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {role.name === 'Admin' ? 'دائم' : role.enabled ? 'مفعّل' : 'معطّل'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-900">
              <strong>💡 Multi-Tenant Configuration:</strong> Different Baron flavors can have different role configurations. 
              For example, a small branch might only need Reception and Mechanic roles, while a large headquarters needs all roles.
            </p>
          </div>
        </div>
      )}

      {/* Users Management Section */}
      {activeSection === 'users' && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">User Account Management</h3>
          <p className="text-gray-600 mb-6">
            Create, edit, and manage user accounts for this Baron deployment. Navigate to the Employees page for full user management.
          </p>

          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Full User Management</h4>
              <p className="text-gray-600 mb-4">
                Use the Employees page for complete user account management
              </p>
              <button
                onClick={() => window.location.href = '/employees'}
                className="btn-primary"
              >
                Go to Employee Management →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
