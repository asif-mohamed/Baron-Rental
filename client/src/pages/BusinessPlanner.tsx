import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Car,
  Calendar,
  FileText,
  Save,
  X,
  ArrowLeft,
} from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface Plan {
  id: string;
  title: string;
  type: 'improvement' | 'expansion' | 'financial' | 'marketing' | 'operational' | 'strategic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  description: string;
  startDate: string;
  endDate: string;
  budget?: number;
  assignedTo?: string;
  employeeId?: string;
  employeeName?: string;
  goals: PlanGoal[];
  tasks: PlanTask[];
  createdAt: string;
}

interface PlanGoal {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

interface PlanTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
}

const BusinessPlanner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    type: 'improvement' as Plan['type'],
    priority: 'medium' as Plan['priority'],
    status: 'draft' as Plan['status'],
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: 0,
    assignedTo: '',
    employeeId: '',
    employeeName: '',
  });

  const [goals, setGoals] = useState<Omit<PlanGoal, 'id'>[]>([]);
  const [tasks, setTasks] = useState<Omit<PlanTask, 'id'>[]>([]);

  useEffect(() => {
    fetchPlans();
    
    // Check if coming from performance page with employee context
    if (location.state) {
      const { employeeId, employeeName, planType, performance } = location.state as any;
      if (employeeId) {
        setFormData(prev => ({
          ...prev,
          employeeId,
          employeeName,
          type: planType || 'improvement',
          title: `خطة تحسين الأداء - ${employeeName}`,
          description: `خطة تحسين شاملة للموظف ${employeeName}\n\nالأداء الحالي:\n- الإيرادات: ${performance?.totalRevenue?.toLocaleString() || 0} د.ل\n- الحجوزات: ${performance?.totalBookings || 0}\n- معدل الإنجاز: ${performance?.totalTasks > 0 ? ((performance.tasksCompletedOnTime / performance.totalTasks) * 100).toFixed(0) : 0}%\n- التقييم: ${performance?.averageRating?.toFixed(1) || 0}/5`,
        }));
        
        // Pre-populate goals based on performance
        if (performance) {
          setGoals([
            {
              description: 'زيادة الإيرادات الشهرية',
              targetValue: Math.round(performance.totalRevenue * 1.3),
              currentValue: performance.totalRevenue,
              unit: 'د.ل',
            },
            {
              description: 'تحسين معدل الإنجاز',
              targetValue: 95,
              currentValue: performance.totalTasks > 0 ? Math.round((performance.tasksCompletedOnTime / performance.totalTasks) * 100) : 0,
              unit: '%',
            },
            {
              description: 'رفع التقييم العام',
              targetValue: 4.5,
              currentValue: performance.averageRating,
              unit: 'نجمة',
            },
          ]);

          setTasks([
            {
              title: 'جلسة تقييم الأداء',
              description: 'مراجعة شاملة للأداء الحالي وتحديد نقاط القوة والضعف',
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pending',
              assignedTo: employeeName,
            },
            {
              title: 'تحديد مجالات التطوير',
              description: 'وضع قائمة بالمهارات والمجالات التي تحتاج إلى تحسين',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pending',
              assignedTo: employeeName,
            },
            {
              title: 'برنامج تدريبي',
              description: 'إعداد برنامج تدريبي مخصص لتطوير المهارات المطلوبة',
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pending',
            },
            {
              title: 'متابعة أسبوعية',
              description: 'جلسات متابعة أسبوعية لتقييم التقدم',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pending',
            },
          ]);
        }
        
        setShowModal(true);
      }
    }
  }, [location.state]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/plans');
      console.log('Plans response:', response.data);
      
      // Parse goals and tasks if they're strings
      const parsedPlans = (response.data.plans || []).map((plan: any) => ({
        ...plan,
        goals: typeof plan.goals === 'string' ? JSON.parse(plan.goals) : (plan.goals || []),
        tasks: typeof plan.tasks === 'string' ? JSON.parse(plan.tasks) : (plan.tasks || []),
      }));
      
      console.log('Parsed plans:', parsedPlans);
      console.log('Plan IDs:', parsedPlans.map((p: any) => ({ id: p.id, title: p.title })));
      setPlans(parsedPlans);
    } catch (error: any) {
      console.error('Failed to fetch plans:', error);
      console.error('Error response:', error.response?.data);
      toast.error('فشل تحميل الخطط: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (editMode && !formData.id) {
      console.error('Cannot update plan without ID. FormData:', formData);
      toast.error('معرف الخطة مفقود. لا يمكن التحديث.');
      return;
    }

    try {
      const payload = {
        ...formData,
        budget: Number(formData.budget) || undefined,
        goals: goals.map((g, i) => ({ ...g, id: `goal-${i}` })),
        tasks: tasks.map((t, i) => ({ ...t, id: `task-${i}` })),
      };

      if (editMode) {
        console.log('Updating plan with ID:', formData.id);
        await api.put(`/plans/${formData.id}`, payload);
        toast.success('تم تحديث الخطة بنجاح');
      } else {
        console.log('Creating new plan');
        await api.post('/plans', payload);
        toast.success('تم إضافة الخطة بنجاح');
      }

      fetchPlans();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.error || 'فشل حفظ الخطة');
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      console.error('No plan ID provided');
      toast.error('معرف الخطة غير موجود');
      return;
    }

    if (!window.confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;

    try {
      console.log('Deleting plan with ID:', id);
      await api.delete(`/plans/${id}`);
      toast.success('تم حذف الخطة بنجاح');
      fetchPlans();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'فشل حذف الخطة');
    }
  };

  const handleEdit = (plan: Plan) => {
    console.log('Editing plan:', plan);
    console.log('Plan ID to edit:', plan.id);
    
    setFormData({
      id: plan.id,
      title: plan.title,
      type: plan.type,
      priority: plan.priority,
      status: plan.status,
      description: plan.description,
      startDate: plan.startDate,
      endDate: plan.endDate,
      budget: plan.budget || 0,
      assignedTo: plan.assignedTo || '',
      employeeId: plan.employeeId || '',
      employeeName: plan.employeeName || '',
    });
    
    console.log('FormData after setting:', {
      id: plan.id,
      title: plan.title,
    });
    
    setGoals(plan.goals.map(({ id, ...rest }) => rest));
    setTasks(plan.tasks.map(({ id, ...rest }) => rest));
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      type: 'improvement',
      priority: 'medium',
      status: 'draft',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 0,
      assignedTo: '',
      employeeId: '',
      employeeName: '',
    });
    setGoals([]);
    setTasks([]);
    setEditMode(false);
  };

  const addGoal = () => {
    setGoals([...goals, { description: '', targetValue: 0, currentValue: 0, unit: '' }]);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: keyof Omit<PlanGoal, 'id'>, value: any) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], [field]: value };
    setGoals(updated);
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        assignedTo: '',
      },
    ]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof Omit<PlanTask, 'id'>, value: any) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesType = filterType === 'all' || plan.type === filterType;
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getPlanTypeIcon = (type: Plan['type']) => {
    const icons = {
      improvement: Users,
      expansion: TrendingUp,
      financial: DollarSign,
      marketing: Target,
      operational: Car,
      strategic: FileText,
    };
    return icons[type] || Target;
  };

  const getPlanTypeName = (type: Plan['type']) => {
    const names = {
      improvement: 'تحسين الأداء',
      expansion: 'التوسع',
      financial: 'مالية',
      marketing: 'تسويق',
      operational: 'تشغيلية',
      strategic: 'استراتيجية',
    };
    return names[type];
  };

  const getPriorityColor = (priority: Plan['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getStatusColor = (status: Plan['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getStatusIcon = (status: Plan['status']) => {
    const icons = {
      draft: FileText,
      active: Clock,
      completed: CheckCircle,
      cancelled: X,
    };
    return icons[status];
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="رجوع"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-600" />
              مخطط الأعمال
            </h1>
            <p className="text-gray-600 mt-1">إدارة وتخطيط استراتيجيات العمل والتطوير</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          خطة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <p className="text-sm text-purple-700 font-semibold">إجمالي الخطط</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">{plans.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700 font-semibold">نشطة</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            {plans.filter((p) => p.status === 'active').length}
          </p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700 font-semibold">مكتملة</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">
            {plans.filter((p) => p.status === 'completed').length}
          </p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <p className="text-sm text-orange-700 font-semibold">مسودات</p>
          <p className="text-3xl font-bold text-orange-900 mt-1">
            {plans.filter((p) => p.status === 'draft').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">نوع الخطة</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input">
              <option value="all">جميع الأنواع</option>
              <option value="improvement">تحسين الأداء</option>
              <option value="expansion">التوسع</option>
              <option value="financial">مالية</option>
              <option value="marketing">تسويق</option>
              <option value="operational">تشغيلية</option>
              <option value="strategic">استراتيجية</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">الحالة</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input">
              <option value="all">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="active">نشطة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPlans.map((plan) => {
          const TypeIcon = getPlanTypeIcon(plan.type);
          const StatusIcon = getStatusIcon(plan.status);
          const completedGoals = plan.goals.filter((g) => g.currentValue >= g.targetValue).length;
          const completedTasks = plan.tasks.filter((t) => t.status === 'completed').length;
          const progress = plan.tasks.length > 0 ? (completedTasks / plan.tasks.length) * 100 : 0;

          return (
            <div key={plan.id} className="card hover:shadow-lg transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TypeIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{getPlanTypeName(plan.type)}</p>
                    {plan.employeeName && (
                      <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {plan.employeeName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      console.log('Delete clicked for plan:', plan);
                      console.log('Plan ID:', plan.id);
                      handleDelete(plan.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(plan.priority)}`}>
                  {plan.priority === 'low' && 'منخفضة'}
                  {plan.priority === 'medium' && 'متوسطة'}
                  {plan.priority === 'high' && 'عالية'}
                  {plan.priority === 'critical' && 'حرجة'}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(plan.status)}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {plan.status === 'draft' && 'مسودة'}
                  {plan.status === 'active' && 'نشطة'}
                  {plan.status === 'completed' && 'مكتملة'}
                  {plan.status === 'cancelled' && 'ملغاة'}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">{plan.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 font-semibold">الأهداف المحققة</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">
                    {completedGoals} / {plan.goals.length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700 font-semibold">المهام المكتملة</p>
                  <p className="text-lg font-bold text-green-900 mt-1">
                    {completedTasks} / {plan.tasks.length}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">التقدم</span>
                  <span className="text-sm font-bold text-purple-600">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(plan.startDate).toLocaleDateString('en-GB')}
                </span>
                <span>-</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(plan.endDate).toLocaleDateString('en-GB')}
                </span>
                {plan.budget && (
                  <>
                    <span>|</span>
                    <span className="flex items-center gap-1 font-semibold text-green-600">
                      <DollarSign className="w-3 h-3" />
                      {plan.budget.toLocaleString()} د.ل
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlans.length === 0 && (
        <div className="card text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد خطط</p>
          <p className="text-gray-400 text-sm mt-2">ابدأ بإنشاء خطة جديدة</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-900">
                {editMode ? 'تعديل خطة' : 'خطة جديدة'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  معلومات أساسية
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">عنوان الخطة *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">نوع الخطة *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Plan['type'] })}
                      className="input"
                    >
                      <option value="improvement">تحسين الأداء</option>
                      <option value="expansion">التوسع</option>
                      <option value="financial">مالية</option>
                      <option value="marketing">تسويق</option>
                      <option value="operational">تشغيلية</option>
                      <option value="strategic">استراتيجية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الأولوية *</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Plan['priority'] })}
                      className="input"
                    >
                      <option value="low">منخفضة</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">عالية</option>
                      <option value="critical">حرجة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الحالة</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Plan['status'] })}
                      className="input"
                    >
                      <option value="draft">مسودة</option>
                      <option value="active">نشطة</option>
                      <option value="completed">مكتملة</option>
                      <option value="cancelled">ملغاة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الميزانية (د.ل)</label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      className="input"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">تاريخ البدء</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">تاريخ الانتهاء</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="input resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    الأهداف
                  </h3>
                  <button type="button" onClick={addGoal} className="text-sm text-green-600 hover:text-green-700 font-semibold">
                    + إضافة هدف
                  </button>
                </div>

                {goals.map((goal, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          placeholder="وصف الهدف"
                          value={goal.description}
                          onChange={(e) => updateGoal(index, 'description', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="القيمة المستهدفة"
                          value={goal.targetValue}
                          onChange={(e) => updateGoal(index, 'targetValue', Number(e.target.value))}
                          className="input"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="الوحدة"
                          value={goal.unit}
                          onChange={(e) => updateGoal(index, 'unit', e.target.value)}
                          className="input flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeGoal(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tasks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    المهام
                  </h3>
                  <button type="button" onClick={addTask} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                    + إضافة مهمة
                  </button>
                </div>

                {tasks.map((task, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          placeholder="عنوان المهمة"
                          value={task.title}
                          onChange={(e) => updateTask(index, 'title', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <textarea
                          placeholder="وصف المهمة"
                          value={task.description}
                          onChange={(e) => updateTask(index, 'description', e.target.value)}
                          rows={2}
                          className="input resize-none"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={task.status}
                          onChange={(e) => updateTask(index, 'status', e.target.value)}
                          className="input flex-1"
                        >
                          <option value="pending">معلق</option>
                          <option value="in_progress">جاري التنفيذ</option>
                          <option value="completed">مكتمل</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 flex gap-3 bg-gray-50 rounded-b-xl">
              <button type="submit" onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 btn-primary">
                <Save className="w-5 h-5" />
                {editMode ? 'تحديث الخطة' : 'حفظ الخطة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPlanner;
