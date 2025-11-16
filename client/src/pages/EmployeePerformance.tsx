import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Award,
  Target,
  BarChart3,
  Send,
  FileEdit,
  Bell,
} from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface EmployeePerformance {
  id: string;
  fullName: string;
  role: string;
  email: string;
  stats: {
    totalBookings: number;
    totalRevenue: number;
    completedTasks: number;
    pendingTasks: number;
    averageRating: number;
    tasksCompletedOnTime: number;
    totalTasks: number;
  };
}

interface TeamStats {
  totalEmployees: number;
  totalRevenue: number;
  completedBookings: number;
  averagePerformance: number;
}

const EmployeePerformance = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalEmployees: 0,
    totalRevenue: 0,
    completedBookings: 0,
    averagePerformance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [sortBy, setSortBy] = useState<'revenue' | 'bookings' | 'rating'>('revenue');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformance | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    fetchPerformanceData();
  }, [dateRange]);

  const fetchPerformanceData = async () => {
    try {
      const response = await api.get('/reports/employee-performance', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      setEmployees(response.data.employees || []);
      setTeamStats(response.data.teamStats || teamStats);
    } catch (error) {
      toast.error('فشل تحميل بيانات الأداء');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-50 border-green-200';
    if (rating >= 3.5) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (rating >= 2.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return { text: 'ممتاز', icon: Award, color: 'text-green-600' };
    if (rating >= 3.5) return { text: 'جيد جداً', icon: TrendingUp, color: 'text-blue-600' };
    if (rating >= 2.5) return { text: 'جيد', icon: Target, color: 'text-yellow-600' };
    return { text: 'يحتاج تحسين', icon: Clock, color: 'text-red-600' };
  };

  const handleSendNotification = async (employee: EmployeePerformance) => {
    setSelectedEmployee(employee);
    // Pre-fill message based on performance
    if (employee.stats.averageRating >= 4.5) {
      setNotificationMessage(`عزيزي/عزيزتي ${employee.fullName},\n\nنود أن نشكرك على أدائك المتميز! لقد حققت إنجازات رائعة هذا الشهر.\n\nالإيرادات: ${employee.stats.totalRevenue.toLocaleString()} د.ل\nالحجوزات: ${employee.stats.totalBookings}\nالتقييم: ${employee.stats.averageRating.toFixed(1)}/5\n\nاستمر في العمل الممتاز!`);
    } else if (employee.stats.averageRating < 3) {
      setNotificationMessage(`عزيزي/عزيزتي ${employee.fullName},\n\nنود مناقشة فرص التحسين في الأداء.\n\nالأداء الحالي:\n- الإيرادات: ${employee.stats.totalRevenue.toLocaleString()} د.ل\n- معدل الإنجاز: ${employee.stats.totalTasks > 0 ? ((employee.stats.tasksCompletedOnTime / employee.stats.totalTasks) * 100).toFixed(0) : 0}%\n\nيرجى التواصل معي لوضع خطة تحسين.`);
    } else {
      setNotificationMessage(`عزيزي/عزيزتي ${employee.fullName},\n\nأداءك جيد، وهناك فرص للتطوير.\n\nالإنجازات:\n- الإيرادات: ${employee.stats.totalRevenue.toLocaleString()} د.ل\n- الحجوزات المكتملة: ${employee.stats.completedTasks}\n\nدعنا نعمل معاً لتحسين النتائج.`);
    }
    setShowNotificationModal(true);
  };

  const handleSubmitNotification = async () => {
    if (!selectedEmployee || !notificationMessage.trim()) {
      toast.error('يرجى كتابة رسالة');
      return;
    }

    try {
      await api.post('/notifications/send', {
        recipientIds: [selectedEmployee.id],
        type: selectedEmployee.stats.averageRating >= 4 ? 'info' : 'alert',
        title: selectedEmployee.stats.averageRating >= 4 ? 'تقدير الأداء' : 'تحسين الأداء',
        message: notificationMessage,
        requiresAction: selectedEmployee.stats.averageRating < 3,
        actionType: selectedEmployee.stats.averageRating < 3 ? 'acknowledge' : undefined,
      });
      toast.success('تم إرسال الإشعار بنجاح');
      setShowNotificationModal(false);
      setNotificationMessage('');
      setSelectedEmployee(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل إرسال الإشعار');
    }
  };

  const handleCreatePlan = (employee: EmployeePerformance) => {
    navigate('/planner', { 
      state: { 
        employeeId: employee.id,
        employeeName: employee.fullName,
        planType: 'improvement',
        performance: employee.stats
      } 
    });
  };

  const getRecommendedActions = (rating: number) => {
    if (rating >= 4.5) return 'إرسال تقدير';
    if (rating >= 3.5) return 'متابعة الأداء';
    return 'خطة تحسين';
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.stats.totalRevenue - a.stats.totalRevenue;
      case 'bookings':
        return b.stats.totalBookings - a.stats.totalBookings;
      case 'rating':
        return b.stats.averageRating - a.stats.averageRating;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          تقرير أداء الموظفين
        </h1>
        <p className="text-gray-600 mt-1">تتبع وتحليل أداء فريق العمل</p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-10 h-10 text-purple-600" />
          </div>
          <p className="text-sm text-purple-700 font-semibold">إجمالي الموظفين</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">{teamStats.totalEmployees}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-sm text-green-700 font-semibold">إجمالي الإيرادات</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            {teamStats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1">د.ل</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700 font-semibold">الحجوزات المكتملة</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{teamStats.completedBookings}</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-10 h-10 text-orange-600" />
          </div>
          <p className="text-sm text-orange-700 font-semibold">متوسط الأداء</p>
          <p className="text-3xl font-bold text-orange-900 mt-1">
            {teamStats.averagePerformance.toFixed(1)}
          </p>
          <p className="text-xs text-orange-600 mt-1">من 5</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ترتيب حسب</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="input">
              <option value="revenue">الإيرادات</option>
              <option value="bookings">عدد الحجوزات</option>
              <option value="rating">التقييم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedEmployees.map((employee, index) => {
          const badge = getPerformanceBadge(employee.stats.averageRating);
          const completionRate =
            employee.stats.totalTasks > 0
              ? ((employee.stats.tasksCompletedOnTime / employee.stats.totalTasks) * 100).toFixed(0)
              : 0;

          return (
            <div
              key={employee.id}
              className={`card hover:shadow-lg transition-all ${
                index < 3 ? 'border-2 border-yellow-300' : ''
              }`}
            >
              {/* Top Performer Badge */}
              {index < 3 && (
                <div className="absolute -top-3 -right-3">
                  <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Award className="w-4 h-4" />
                    #{index + 1}
                  </div>
                </div>
              )}

              {/* Employee Info */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{employee.fullName}</h3>
                  <p className="text-sm text-gray-600">{employee.role}</p>
                  <p className="text-xs text-gray-500 mt-1">{employee.email}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getPerformanceColor(employee.stats.averageRating)}`}>
                  <badge.icon className={`w-5 h-5 ${badge.color}`} />
                  <span className="font-bold">{badge.text}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-blue-700 font-semibold">الحجوزات</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{employee.stats.totalBookings}</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 font-semibold">الإيرادات</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {employee.stats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">د.ل</p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-semibold">معدل الإنجاز</span>
                    <span className="text-sm font-bold text-blue-600">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-semibold">التقييم العام</span>
                    <span className="text-sm font-bold text-orange-600">
                      {employee.stats.averageRating.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${(employee.stats.averageRating / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Task Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">مكتملة:</span>
                    <span className="font-bold text-green-600">{employee.stats.completedTasks}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-600">معلقة:</span>
                    <span className="font-bold text-orange-600">{employee.stats.pendingTasks}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendNotification(employee)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    <Bell className="w-4 h-4" />
                    {getRecommendedActions(employee.stats.averageRating)}
                  </button>
                  <button
                    onClick={() => handleCreatePlan(employee)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                  >
                    <FileEdit className="w-4 h-4" />
                    خطة عمل
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notification Modal */}
      {showNotificationModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                إرسال إشعار إلى {selectedEmployee.fullName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                التقييم الحالي: {selectedEmployee.stats.averageRating.toFixed(1)}/5.0
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">الرسالة</label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={10}
                className="input resize-none"
                placeholder="اكتب رسالتك هنا..."
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSubmitNotification}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-5 h-5" />
                إرسال الإشعار
              </button>
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationMessage('');
                  setSelectedEmployee(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {employees.length === 0 && (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد بيانات أداء متاحة</p>
          <p className="text-gray-400 text-sm mt-2">حاول تغيير نطاق التاريخ</p>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformance;
