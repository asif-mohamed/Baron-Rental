import { useState, useEffect } from 'react';
import { Car, Plus, Search, Edit2, Trash2, Wrench, DollarSign, X } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
  vin: string;
  dailyRate: number;
  mileage: number;
  status: 'available' | 'rented' | 'maintenance' | 'sold';
  condition: string;
  fuelType: string;
  transmission: string;
  seats: number;
  category: string;
  purchasePrice?: number;
}

const Fleet = () => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState<CarData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    plateNumber: '',
    color: '',
    vin: '',
    dailyRate: 0,
    mileage: 0,
    status: 'available' as 'available' | 'rented' | 'maintenance' | 'sold',
    condition: 'excellent',
    fuelType: 'petrol',
    transmission: 'automatic',
    seats: 5,
    category: 'sedan',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await api.get('/cars');
      setCars(response.data.cars || []);
    } catch (error: any) {
      toast.error('فشل تحميل السيارات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCar) {
        await api.patch(`/cars/${editingCar.id}`, formData);
        toast.success('تم تحديث السيارة بنجاح');
      } else {
        await api.post('/cars', formData);
        toast.success('تم إضافة السيارة بنجاح');
      }
      fetchCars();
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشلت العملية');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه السيارة؟')) return;
    try {
      await api.delete(`/cars/${id}`);
      toast.success('تم حذف السيارة بنجاح');
      fetchCars();
    } catch (error: any) {
      toast.error('فشل حذف السيارة');
    }
  };

  const handleSellCar = async (car: CarData) => {
    const salePrice = prompt(`أدخل سعر البيع للسيارة ${car.brand} ${car.model}:`, car.purchasePrice?.toString() || '0');
    
    if (!salePrice || isNaN(parseFloat(salePrice))) {
      return;
    }

    try {
      // Update car status to sold
      await api.patch(`/cars/${car.id}/status`, { status: 'sold' });
      
      // Create sale transaction
      await api.post('/transactions', {
        type: 'income',
        category: 'car_sale',
        amount: parseFloat(salePrice),
        description: `بيع سيارة ${car.brand} ${car.model} - ${car.plateNumber}`,
        paymentMethod: 'cash',
        transactionDate: new Date().toISOString(),
      });

      toast.success(`تم بيع السيارة بنجاح بمبلغ ${salePrice} د.ل ✅`);
      fetchCars();
    } catch (error: any) {
      toast.error('فشل تسجيل عملية البيع');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/cars/${id}/status`, { status: newStatus });
      
      // If changing to maintenance, create a pending maintenance record
      if (newStatus === 'maintenance') {
        const car = cars.find(c => c.id === id);
        if (car) {
          await api.post('/maintenance', {
            carId: id,
            type: 'routine',
            description: `صيانة دورية للسيارة ${car.brand} ${car.model}`,
            cost: 0,
            serviceDate: new Date().toISOString(),
            status: 'pending',
            notes: 'تم إنشاء هذا السجل تلقائياً من صفحة الأسطول',
          });
        }
      }
      
      toast.success('تم تحديث حالة السيارة');
      fetchCars();
    } catch (error: any) {
      toast.error('فشل تحديث الحالة');
    }
  };

  const openModal = (car?: CarData) => {
    if (car) {
      setEditingCar(car);
      setFormData({
        brand: car.brand,
        model: car.model,
        year: car.year,
        plateNumber: car.plateNumber,
        color: car.color,
        vin: car.vin,
        dailyRate: car.dailyRate,
        mileage: car.mileage,
        status: car.status,
        condition: car.condition,
        fuelType: car.fuelType,
        transmission: car.transmission,
        seats: car.seats,
        category: car.category,
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
      });
    } else {
      setEditingCar(null);
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        plateNumber: '',
        color: '',
        vin: '',
        dailyRate: 0,
        mileage: 0,
        status: 'available',
        condition: 'excellent',
        fuelType: 'petrol',
        transmission: 'automatic',
        seats: 5,
        category: 'sedan',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCar(null);
  };

  // حساب الإحصائيات
  const stats = {
    total: cars.length,
    available: cars.filter(c => c.status === 'available').length,
    rented: cars.filter(c => c.status === 'rented').length,
    maintenance: cars.filter(c => c.status === 'maintenance').length,
  };

  // فلترة السيارات
  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || car.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-orange-100 text-orange-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'متاحة';
      case 'rented': return 'مؤجرة';
      case 'maintenance': return 'صيانة';
      case 'sold': return 'مباعة';
      default: return status;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات الأسطول */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">إجمالي المركبات</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
            </div>
            <Car className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">متاحة</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats.available}</p>
            </div>
            <Car className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">مؤجرة</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{stats.rented}</p>
            </div>
            <DollarSign className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold">صيانة</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{stats.maintenance}</p>
            </div>
            <Wrench className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* شريط الأدوات */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن سيارة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">كل الحالات</option>
            <option value="available">متاحة</option>
            <option value="rented">مؤجرة</option>
            <option value="maintenance">صيانة</option>
            <option value="sold">مباعة</option>
          </select>
        </div>

        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة سيارة جديدة</span>
        </button>
      </div>

      {/* جدول السيارات */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الشركة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموديل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأميال</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم اللوحة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر/يوم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCars.map((car) => (
                <tr key={car.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(car.status)}`}>
                      {getStatusLabel(car.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{car.brand} {car.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{car.brand}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{car.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{car.mileage.toLocaleString()} كم</td>
                  <td className="px-6 py-4 whitespace-nowrap">{car.plateNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{car.dailyRate} د.ل</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(car)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      
                      {car.status !== 'maintenance' && (
                        <button
                          onClick={() => handleStatusChange(car.id, 'maintenance')}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="صيانة"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                      )}
                      
                      {car.status === 'maintenance' && (
                        <button
                          onClick={() => handleStatusChange(car.id, 'available')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="إرجاع للخدمة"
                        >
                          <Car className="w-4 h-4" />
                        </button>
                      )}
                      
                      {car.status !== 'sold' && (
                        <button
                          onClick={() => handleSellCar(car)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="بيع السيارة"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(car.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCars.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              لا توجد سيارات
            </div>
          )}
        </div>
      </div>

      {/* نافذة إضافة/تعديل سيارة */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editingCar ? 'تعديل السيارة' : 'إضافة سيارة جديدة'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الشركة المصنعة *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Toyota, Kia, Hyundai..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الموديل *</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Corolla"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">سنة الصنع *</label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم اللوحة *</label>
                  <input
                    type="text"
                    required
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أ ب ج 1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اللون *</label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أبيض"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهيكل (VIN) *</label>
                  <input
                    type="text"
                    required
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأميال (كم) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">سعر الإيجار/يوم (د.ل) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">متاح</option>
                    <option value="rented">مؤجر</option>
                    <option value="maintenance">صيانة</option>
                    <option value="sold">للبيع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة العامة *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="excellent">ممتازة</option>
                    <option value="good">جيدة</option>
                    <option value="fair">مقبولة</option>
                    <option value="poor">سيئة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الوقود *</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="petrol">بنزين</option>
                    <option value="diesel">ديزل</option>
                    <option value="hybrid">هجين</option>
                    <option value="electric">كهربائي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ناقل الحركة *</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="automatic">أوتوماتيك</option>
                    <option value="manual">يدوي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد المقاعد *</label>
                  <input
                    type="number"
                    required
                    min="2"
                    max="15"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الفئة *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="economy">اقتصادية</option>
                    <option value="sedan">سيدان</option>
                    <option value="suv">دفع رباعي</option>
                    <option value="luxury">فاخرة</option>
                    <option value="van">فان</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">سعر الشراء (د.ل)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الشراء</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCar ? 'تحديث السيارة' : 'حفظ السيارة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
