import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../lib/api';
import { Car, Users, Calendar, DollarSign, TrendingUp, AlertCircle, Bell, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

// Role-specific dashboards
import ReceptionistDashboard from '../components/dashboards/ReceptionistDashboard';
import ManagerDashboard from '../components/dashboards/ManagerDashboard';
import MechanicDashboard from '../components/dashboards/MechanicDashboard';
import WarehouseDashboard from '../components/dashboards/WarehouseDashboard';
import AccountantDashboard from '../components/dashboards/AccountantDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';

interface Stats {
  fleet: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
  };
  customers: number;
  bookings: {
    active: number;
    today: number;
  };
  revenue: {
    month: number;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  
  // ====================================================================
  // PRODUCTION ROLE-BASED DASHBOARD ROUTING (Baron Car Rental Business)
  // ====================================================================
  
  // Reception: Customer service, bookings, customer search
  if (user?.role?.name === 'Reception') {
    return <ReceptionistDashboard />;
  }
  
  // Manager: Business oversight, approvals, performance tracking
  if (user?.role?.name === 'Manager') {
    return <ManagerDashboard />;
  }
  
  // Mechanic: Vehicle maintenance, repair tasks
  if (user?.role?.name === 'Mechanic') {
    return <MechanicDashboard />;
  }
  
  // Warehouse: Fleet logistics, pickup/return management
  if (user?.role?.name === 'Warehouse' || user?.role?.name === 'Inventory') {
    return <WarehouseDashboard />;
  }
  
  // Accountant: Financial management, revenue/expense tracking
  if (user?.role?.name === 'Accountant') {
    return <AccountantDashboard />;
  }
  
  // ====================================================================
  // ADMIN DASHBOARD (PLATFORM CONFIGURATOR - NOT PRODUCTION ROLE)
  // ====================================================================
  // Admin is the PLATFORM CONFIGURATOR for creating Baron "flavors":
  // - Configure business display name (multi-tenant support)
  // - Enable/disable entire tabs (feature management)
  // - Add/remove user roles (role customization)
  // - Rename accounts and configure business logic
  // - Full platform customization through recursive pipeline coding
  // This is NOT a business operation role - it's for SaaS configuration
  // ====================================================================
  
  // Admin users see the platform configuration dashboard
  if (user?.role?.name === 'Admin') {
    return <AdminDashboard />;
  }
  
  // Fallback: Default Dashboard (should not reach here if roles are configured correctly)
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use ref to persist AudioContext across renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const notificationIntervalRef = useRef<number | null>(null);
  const prevNotificationCountRef = useRef(0);

  // Initialize AudioContext once
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    notificationIntervalRef.current = window.setInterval(fetchNotifications, 10000);
    
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const { data } = await api.get('/reports/dashboard');
      setStats(data.stats);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      setError('فشل تحميل الإحصائيات');
      toast.error('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      const newNotifications = data.notifications || [];
      
      // Track unread count
      const unreadCount = newNotifications.filter((n: Notification) => !n.isRead).length;
      
      // Check for NEW notifications (not just unread)
      const hasNewNotifications = unreadCount > prevNotificationCountRef.current;
      
      // Play sound and show browser notification ONLY for genuinely new items
      if (hasNewNotifications && prevNotificationCountRef.current > 0) {
        playNotificationSound();
        const latestUnread = newNotifications.find((n: Notification) => !n.isRead);
        if (latestUnread) {
          showBrowserNotification(latestUnread);
        }
      }
      
      prevNotificationCountRef.current = unreadCount;
      setNotifications(newNotifications);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      // Don't show error toast for notifications - it's not critical
    }
  }, []);

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) return;
      
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
          });
        }
      });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      toast.success('تم وضع علامة كمقروء');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('فشل تحديث الإشعار');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchNotifications()]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'إجمالي الأسطول',
      value: stats?.fleet.total || 0,
      icon: Car,
      color: 'bg-blue-500',
      details: `${stats?.fleet.available || 0} متاحة`,
    },
    {
      title: 'السيارات المؤجرة',
      value: stats?.fleet.rented || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      details: `من ${stats?.fleet.total || 0} سيارة`,
    },
    {
      title: 'الحجوزات النشطة',
      value: stats?.bookings.active || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      details: `${stats?.bookings.today || 0} اليوم`,
    },
    {
      title: 'إيرادات الشهر',
      value: `${(stats?.revenue.month || 0).toLocaleString()} ر.س`,
      icon: DollarSign,
      color: 'bg-gold-500',
      details: 'الشهر الحالي',
    },
    {
      title: 'إجمالي العملاء',
      value: stats?.customers || 0,
      icon: Users,
      color: 'bg-indigo-500',
      details: 'عميل نشط',
    },
    {
      title: 'في الصيانة',
      value: stats?.fleet.maintenance || 0,
      icon: AlertCircle,
      color: 'bg-orange-500',
      details: 'سيارة',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
          <p className="text-gray-600">نظرة عامة على أداء الشركة</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'جاري التحديث...' : 'تحديث'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="card hover:shadow-lg transition-shadow animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm font-medium mb-1">{kpi.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                  <p className="text-sm text-gray-500">{kpi.details}</p>
                </div>
                <div className={`${kpi.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">حالة الأسطول</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>متاحة</span>
                <span className="font-medium">{stats?.fleet.available || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${((stats?.fleet.available || 0) / (stats?.fleet.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>مؤجرة</span>
                <span className="font-medium">{stats?.fleet.rented || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${((stats?.fleet.rented || 0) / (stats?.fleet.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>في الصيانة</span>
                <span className="font-medium">{stats?.fleet.maintenance || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{
                    width: `${((stats?.fleet.maintenance || 0) / (stats?.fleet.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">نشاط اليوم</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Calendar className="text-blue-600" size={20} />
              <div>
                <p className="font-medium text-gray-900">{stats?.bookings.today || 0} حجوزات جديدة</p>
                <p className="text-sm text-gray-600">اليوم</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={20} />
              <div>
                <p className="font-medium text-gray-900">{stats?.bookings.active || 0} حجوزات نشطة</p>
                <p className="text-sm text-gray-600">قيد التنفيذ</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="card" role="region" aria-label="قسم الإشعارات">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bell size={20} className="text-blue-600" aria-hidden="true" />
              الإشعارات
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span 
                  className="animate-pulse bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                  aria-label={`${notifications.filter(n => !n.isRead).length} إشعار جديد`}
                >
                  {notifications.filter(n => !n.isRead).length} جديد
                </span>
              )}
            </h3>
            <span className="text-sm text-gray-500" aria-live="polite">
              {notifications.filter(n => !n.isRead).length} غير مقروء
            </span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto" role="list">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                role="listitem"
                className={`p-4 rounded-lg border transition-all ${
                  notification.isRead 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md animate-pulse-slow'
                }`}
                aria-label={notification.isRead ? 'إشعار مقروء' : 'إشعار جديد غير مقروء'}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping" aria-hidden="true"></span>
                      )}
                      <p className="font-bold text-gray-900">
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      <time dateTime={notification.createdAt}>
                        ⏰ {new Date(notification.createdAt).toLocaleString('ar-LY')}
                      </time>
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow-md flex items-center gap-1"
                        aria-label={`وضع علامة كمقروء على ${notification.title}`}
                      >
                        <Check size={14} aria-hidden="true" />
                        <span>تم</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
