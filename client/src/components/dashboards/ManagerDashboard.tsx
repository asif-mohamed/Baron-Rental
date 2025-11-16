import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, Users, Car, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface ManagerStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  activeBookings: number;
  totalCustomers: number;
  totalCars: number;
  pendingApprovals: number;
  maintenanceDue: number;
}

interface PendingApproval {
  id: string;
  type: 'booking_extension' | 'maintenance_request' | 'purchase_request';
  title: string;
  requester: string;
  date: string;
  amount?: number;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ManagerStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalCustomers: 0,
    totalCars: 0,
    pendingApprovals: 0,
    maintenanceDue: 0,
  });

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      const { data } = await api.get('/reports/manager-overview');
      console.log('Manager data:', data); // Debug log
      setStats({
        totalRevenue: data.stats?.totalRevenue || 0,
        monthlyRevenue: data.stats?.monthlyRevenue || 0,
        totalBookings: data.stats?.totalBookings || 0,
        activeBookings: data.stats?.activeBookings || 0,
        totalCustomers: data.stats?.totalCustomers || 0,
        totalCars: data.stats?.totalCars || 0,
        pendingApprovals: data.stats?.pendingApprovals || 0,
        maintenanceDue: data.stats?.maintenanceDue || 0,
      });
      setPendingApprovals(data.approvals || []);
    } catch (error) {
      console.error('Failed to fetch manager data:', error);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      await api.patch(`/approvals/${approvalId}/approve`);
      fetchManagerData();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await api.patch(`/approvals/${approvalId}/reject`);
      fetchManagerData();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة المدير</h1>
        <p className="text-gray-600">مرحباً {user?.fullName} - نظرة شاملة على الأداء والعمليات</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-10 h-10 text-green-600" />
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-green-700 font-semibold">إجمالي الإيرادات</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">هذا الشهر: {stats.monthlyRevenue.toLocaleString()} د.ل</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700 font-semibold">الحجوزات</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalBookings}</p>
          <p className="text-xs text-blue-600 mt-1">نشط: {stats.activeBookings}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-10 h-10 text-purple-600" />
          </div>
          <p className="text-sm text-purple-700 font-semibold">العملاء</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">{stats.totalCustomers}</p>
          <p className="text-xs text-purple-600 mt-1">إجمالي قاعدة العملاء</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <Car className="w-10 h-10 text-orange-600" />
          </div>
          <p className="text-sm text-orange-700 font-semibold">الأسطول</p>
          <p className="text-3xl font-bold text-orange-900 mt-1">{stats.totalCars}</p>
          <p className="text-xs text-orange-600 mt-1">جميع السيارات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              الموافقات المعلقة
            </h3>
            {stats.pendingApprovals > 0 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                {stats.pendingApprovals} معلق
              </span>
            )}
          </div>

          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">لا توجد موافقات معلقة</p>
              </div>
            ) : (
              pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{approval.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">من: {approval.requester}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(approval.date).toLocaleDateString('en-GB')}
                        </span>
                        {approval.amount && (
                          <span className="font-semibold text-green-600">
                            {approval.amount.toLocaleString()} د.ل
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(approval.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        قبول
                      </button>
                      <button
                        onClick={() => handleReject(approval.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">تنبيهات سريعة</h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-900 text-sm">صيانة مستحقة</span>
                </div>
                <p className="text-2xl font-bold text-yellow-800">{stats.maintenanceDue}</p>
                <p className="text-xs text-yellow-700">سيارات تحتاج صيانة</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900 text-sm">حجوزات نشطة</span>
                </div>
                <p className="text-2xl font-bold text-blue-800">{stats.activeBookings}</p>
                <p className="text-xs text-blue-700">جاري التنفيذ حالياً</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-3">إجراءات سريعة</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/reports')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                عرض التقارير المالية
              </button>
              <button
                onClick={() => navigate('/employees')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                إدارة الموظفين
              </button>
              <button
                onClick={() => navigate('/performance')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                تقرير الأداء
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
