import { useState, useEffect } from 'react';
import { Wrench, Plus, Search, AlertCircle, CheckCircle, Calendar, Eye } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface MaintenanceRecord {
  id: string;
  carId: string;
  type: string; // Changed from maintenanceType
  description: string;
  cost: number;
  mileageAtService?: number; // Changed from mileage
  status: string; // Changed from enum to string
  serviceDate: string; // Changed from scheduledDate
  nextServiceDate?: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  car: {
    brand: string;
    model: string;
    year: number;
    plateNumber: string;
    mileage: number;
  };
  user?: {
    fullName: string;
  };
}

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  mileage: number;
  status: string;
}

const maintenanceTypes = [
  'تغيير الزيت',
  'تغيير الفلاتر',
  'فحص الفرامل',
  'تبديل الإطارات',
  'صيانة المحرك',
  'فحص التكييف',
  'صيانة كهربائية',
  'صيانة دورية',
  'أخرى',
];

const Maintenance = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    carId: '',
    maintenanceType: '',
    description: '',
    cost: 0,
    mileage: 0,
    scheduledDate: '',
    status: 'scheduled',
    notes: '',
  });

  useEffect(() => {
    fetchRecords();
    fetchCars();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/maintenance');
      setRecords(response.data.records || []);
    } catch (error) {
      toast.error('فشل تحميل سجلات الصيانة');
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const response = await api.get('/cars');
      setCars(response.data.cars || []);
    } catch (error) {
      console.error('فشل تحميل السيارات');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.carId || !formData.maintenanceType || !formData.scheduledDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      // Map frontend fields to backend schema
      const payload = {
        carId: formData.carId,
        type: formData.maintenanceType,
        description: formData.description,
        cost: formData.cost || 0,
        serviceDate: formData.scheduledDate, // Map scheduledDate to serviceDate
        status: formData.status,
        notes: formData.notes || '',
      };

      if (editMode && selectedRecord) {
        await api.put(`/maintenance/${selectedRecord.id}`, payload);
        toast.success('تم تحديث سجل الصيانة بنجاح');
      } else {
        await api.post('/maintenance', payload);
        toast.success('تم إضافة سجل الصيانة بنجاح');
      }
      
      fetchRecords();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل حفظ سجل الصيانة');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;

    try {
      await api.delete(`/maintenance/${id}`);
      toast.success('تم حذف السجل بنجاح');
      fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل حذف السجل');
    }
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setFormData({
      carId: record.carId,
      maintenanceType: record.type,
      description: record.description,
      cost: record.cost,
      mileage: record.mileageAtService || 0,
      scheduledDate: record.serviceDate.split('T')[0], // Format for input date
      status: record.status,
      notes: record.notes || '',
    });
    setSelectedRecord(record);
    setEditMode(true);
    setShowModal(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/maintenance/${id}`, { status: newStatus });
      toast.success('تم تحديث حالة الصيانة');
      fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل تحديث الحالة');
    }
  };

  const resetForm = () => {
    setFormData({
      carId: '',
      maintenanceType: '',
      description: '',
      cost: 0,
      mileage: 0,
      scheduledDate: '',
      status: 'scheduled',
      notes: '',
    });
    setEditMode(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتملة';
      case 'cancelled':
        return 'ملغية';
      default:
        return status;
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.car.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getMaintenanceTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'oil_change':
        return 'تغيير الزيت';
      case 'filter_change':
        return 'تغيير الفلاتر';
      case 'brake_service':
        return 'فحص الفرامل';
      case 'tire_rotation':
      case 'tire_change':
        return 'تبديل الإطارات';
      case 'engine_service':
        return 'صيانة المحرك';
      case 'ac_service':
        return 'فحص التكييف';
      case 'electrical':
        return 'صيانة كهربائية';
      case 'routine':
      case 'routine_maintenance':
        return 'صيانة دورية';
      case 'other':
        return 'أخرى';
      default:
        return type;
    }
  };

  const totalCost = records
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.cost, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">إجمالي السجلات</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{records.length}</p>
            </div>
            <Wrench className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-semibold">قيد الانتظار</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">
                {records.filter((r) => r.status === 'pending').length}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">مكتملة</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {records.filter((r) => r.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">إجمالي التكلفة</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{totalCost.toFixed(2)} د.ل</p>
            </div>
            <Calendar className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث بالسيارة أو نوع الصيانة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغية</option>
          </select>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          سجل صيانة جديد
        </button>
      </div>

      {/* جدول سجلات الصيانة */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السيارة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نوع الصيانة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التكلفة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  قراءة العداد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ المجدول
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    لا توجد سجلات صيانة
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.car.brand} {record.car.model} {record.car.year}
                      </div>
                      <div className="text-sm text-gray-500">{record.car.plateNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{getMaintenanceTypeLabel(record.type)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {record.cost.toFixed(2)} د.ل
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.mileageAtService ? record.mileageAtService.toLocaleString() : 'N/A'} كم
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.serviceDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setViewModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleEdit(record)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          title="تعديل"
                        >
                          تعديل
                        </button>

                        <select
                          value={record.status}
                          onChange={(e) => handleUpdateStatus(record.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          title="تغيير الحالة"
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="in_progress">قيد التنفيذ</option>
                          <option value="completed">مكتملة</option>
                          <option value="cancelled">ملغية</option>
                        </select>

                        <button
                          onClick={() => handleDelete(record.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          title="حذف"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal إضافة/تعديل سجل صيانة */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editMode ? 'تعديل سجل الصيانة' : 'سجل صيانة جديد'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* اختيار السيارة */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر السيارة <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.carId}
                    onChange={(e) => {
                      const car = cars.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        carId: e.target.value,
                        mileage: car?.mileage || 0,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- اختر السيارة --</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model} {car.year} - {car.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* نوع الصيانة */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الصيانة <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.maintenanceType}
                    onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- اختر نوع الصيانة --</option>
                    {maintenanceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* الوصف */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="تفاصيل إضافية عن الصيانة..."
                  />
                </div>

                {/* التكلفة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التكلفة (د.ل)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* قراءة العداد */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">قراءة العداد (كم)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* التاريخ المجدول */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التاريخ المجدول <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* الحالة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحالة
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="scheduled">مجدولة</option>
                    <option value="in-progress">قيد التنفيذ</option>
                    <option value="completed">مكتملة</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </div>

                {/* ملاحظات */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {editMode ? 'تحديث السجل' : 'حفظ السجل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal عرض تفاصيل السجل */}
      {viewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">تفاصيل سجل الصيانة</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">الحالة:</span>
                  <p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        selectedRecord.status
                      )}`}
                    >
                      {getStatusLabel(selectedRecord.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">التكلفة:</span>
                  <p className="font-bold text-lg text-orange-600">{selectedRecord.cost.toFixed(2)} د.ل</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">معلومات السيارة</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">السيارة:</span>
                    <p className="font-semibold">
                      {selectedRecord.car.brand} {selectedRecord.car.model} {selectedRecord.car.year}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">رقم اللوحة:</span>
                    <p className="font-semibold">{selectedRecord.car.plateNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">قراءة العداد:</span>
                    <p className="font-semibold">{selectedRecord.mileageAtService ? selectedRecord.mileageAtService.toLocaleString() : 'N/A'} كم</p>
                  </div>
                  <div>
                    <span className="text-gray-600">عداد السيارة الحالي:</span>
                    <p className="font-semibold">{selectedRecord.car.mileage.toLocaleString()} كم</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">تفاصيل الصيانة</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">نوع الصيانة:</span>
                    <p className="font-semibold">{getMaintenanceTypeLabel(selectedRecord.type)}</p>
                  </div>
                  {selectedRecord.description && (
                    <div>
                      <span className="text-gray-600">الوصف:</span>
                      <p className="font-semibold">{selectedRecord.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">التاريخ المجدول:</span>
                    <p className="font-semibold">
                      {new Date(selectedRecord.serviceDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  {selectedRecord.completedDate && (
                    <div>
                      <span className="text-gray-600">تاريخ الإكمال:</span>
                      <p className="font-semibold">
                        {new Date(selectedRecord.completedDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  )}
                  {selectedRecord.notes && (
                    <div>
                      <span className="text-gray-600">ملاحظات:</span>
                      <p className="font-semibold">{selectedRecord.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t mt-6">
              <button
                onClick={() => setViewModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
