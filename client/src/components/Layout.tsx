import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  DollarSign,
  Wrench,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Target,
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allMenuItems = [
    { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Reception', 'Warehouse', 'Accountant', 'Mechanic'] },
    { path: '/fleet', label: 'الأسطول', icon: Car, roles: ['Admin', 'Manager', 'Warehouse'] },
    { path: '/customers', label: 'العملاء', icon: Users, roles: ['Admin', 'Manager', 'Reception', 'Accountant'] },
    { path: '/bookings', label: 'الحجوزات', icon: Calendar, roles: ['Admin', 'Manager', 'Reception', 'Warehouse', 'Accountant'] },
    { path: '/transactions', label: 'المعاملات المالية', icon: DollarSign, roles: ['Admin', 'Manager', 'Accountant'] },
    { path: '/maintenance', label: 'الصيانة', icon: Wrench, roles: ['Admin', 'Manager', 'Mechanic', 'Warehouse'] },
    { path: '/employees', label: 'إدارة الموظفين', icon: Users, roles: ['Admin', 'Manager'] },
    { path: '/performance', label: 'تقرير الأداء', icon: FileText, roles: ['Admin', 'Manager'] },
    { path: '/planner', label: 'التخطيط الاستراتيجي', icon: Target, roles: ['Admin', 'Manager'] },
    { path: '/reports', label: 'التقارير', icon: FileText, roles: ['Admin', 'Manager', 'Accountant'] },
    { path: '/notifications', label: 'الإشعارات', icon: Bell, roles: ['Admin', 'Manager', 'Reception', 'Warehouse', 'Accountant', 'Mechanic'] },
    { path: '/settings', label: 'الإعدادات', icon: Settings, roles: ['Admin'] },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(user?.role?.name || '')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-800 text-white shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-primary-700 rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h1 className="text-2xl font-bold">سلسلة البارون</h1>
              <p className="text-sm text-primary-200">نظام إدارة تأجير السيارات</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="font-medium">{user?.fullName}</p>
              <p className="text-sm text-primary-200">{user?.role.name}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 right-0 z-40 w-64 bg-white border-l border-gray-200 shadow-xl lg:shadow-none transition-transform duration-300`}
        >
          <nav className="p-4 space-y-2 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
