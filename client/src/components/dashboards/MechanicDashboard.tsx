import { useState, useEffect } from 'react';
import { Wrench, Clock, CheckCircle, AlertTriangle, Car, Calendar } from 'lucide-react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MaintenanceTask {
  id: string;
  car: {
    brand: string;
    model: string;
    plateNumber: string;
    mileage: number;
  };
  type: string;
  description: string;
  status: string;
  priority: string;
  scheduledDate: string;
  cost?: number;
}

const MechanicDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completedToday: 0,
    urgent: 0,
  });

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      const { data } = await api.get('/maintenance/mechanic-view');
      setTasks(data.tasks || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Failed to fetch maintenance data:', error);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await api.patch(`/maintenance/${taskId}`, { status: 'in_progress' });
      fetchMaintenanceData();
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const handleCompleteTask = (taskId: string) => {
    navigate('/maintenance', { state: { completeTask: taskId } });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'normal': return 'عادي';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in_progress': return 'جاري العمل';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة الميكانيكي</h1>
        <p className="text-gray-600">مرحباً {user?.fullName} - مهام الصيانة والإصلاح</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-semibold">قيد الانتظار</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-semibold">جاري العمل</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.inProgress}</p>
            </div>
            <Wrench className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-semibold">مكتمل اليوم</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.completedToday}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-semibold">عاجل</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.urgent}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Maintenance Tasks */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">مهام الصيانة</h3>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد مهام صيانة</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Car Icon */}
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>

                  {/* Task Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {task.car.brand} {task.car.model} - {task.car.plateNumber}
                        </h4>
                        <p className="text-sm text-gray-600">{task.type}</p>
                      </div>

                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{task.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.scheduledDate).toLocaleDateString('en-GB')}
                        </span>
                        <span>المسافة: {task.car.mileage.toLocaleString()} كم</span>
                        {task.cost && (
                          <span className="font-semibold text-green-600">
                            {task.cost.toLocaleString()} د.ل
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleStartTask(task.id)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            بدء العمل
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            إكمال
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;
