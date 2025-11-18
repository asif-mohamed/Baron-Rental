import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, CheckCircle, Clock, Eye } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface Booking {
  id: string;
  bookingNumber: string;
  carId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyRate: number;
  subtotal: number;
  extras: number;
  taxes: number;
  discount: number;
  totalAmount: number;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  pickupDate?: string;
  returnDate?: string;
  initialOdometer?: number;
  finalOdometer?: number;
  car: { brand: string; model: string; year: number; plateNumber: string };
  customer: { fullName: string; phone: string };
}

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  dailyRate: number;
  status: string;
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
}

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    carId: '',
    customerId: '',
    startDate: '',
    endDate: '',
    dailyRate: 0,
    extras: 0,
    taxes: 0,
    discount: 0,
    notes: '',
    initialOdometer: 0,
  });

  useEffect(() => {
    fetchBookings();
    fetchCars();
    fetchCustomers();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      toast.error('فشل تحميل الحجوزات');
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

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('فشل تحميل العملاء');
    }
  };

  const calculateTotalDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalAmount = (): number => {
    const days = calculateTotalDays(formData.startDate, formData.endDate);
    const subtotal = days * formData.dailyRate;
    const total = subtotal + formData.extras + formData.taxes - formData.discount;
    return Math.max(0, total);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.carId || !formData.customerId || !formData.startDate || !formData.endDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!formData.initialOdometer || formData.initialOdometer <= 0) {
      toast.error('يرجى إدخال قراءة العداد الحالية للسيارة');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      toast.error('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء');
      return;
    }

    try {
      // التحقق من توفر السيارة
      const checkResponse = await api.post('/bookings/check-availability', {
        carId: formData.carId,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });

      if (!checkResponse.data.available) {
        toast.error('السيارة غير متاحة في هذه الفترة');
        return;
      }

      // إنشاء الحجز
      const totalDays = calculateTotalDays(formData.startDate, formData.endDate);
      const subtotal = totalDays * formData.dailyRate;
      const totalAmount = calculateTotalAmount();

      await api.post('/bookings', {
        ...formData,
        totalDays,
        subtotal,
        totalAmount,
      });

      toast.success('تم إنشاء الحجز بنجاح');
      fetchBookings();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل إنشاء الحجز');
    }
  };

  const handlePickup = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من تسليم السيارة للعميل؟')) return;

    try {
      await api.patch(`/bookings/${id}/pickup`);
      toast.success('تم تسليم السيارة بنجاح');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل تسليم السيارة');
    }
  };

  const handleReturn = async (id: string) => {
    // Find the booking to get initial odometer and rental period
    const booking = bookings.find(b => b.id === id);
    if (!booking) {
      toast.error('لم يتم العثور على الحجز');
      return;
    }

    const finalOdometerInput = prompt('أدخل قراءة عداد الكيلومترات الحالية:');
    if (!finalOdometerInput) return;

    const finalOdometer = parseInt(finalOdometerInput);
    if (isNaN(finalOdometer) || finalOdometer < 0) {
      toast.error('قراءة العداد غير صحيحة');
      return;
    }

    // Validate final odometer is greater than initial
    if (booking.initialOdometer && finalOdometer < booking.initialOdometer) {
      toast.error(`قراءة العداد النهائية (${finalOdometer} كم) يجب أن تكون أكبر من القراءة الأولية (${booking.initialOdometer} كم)`);
      return;
    }

    try {
      const response = await api.patch(`/bookings/${id}/return`, { 
        finalOdometer,
        initialOdometer: booking.initialOdometer 
      });
      
      // Check if extra km charge was applied
      if (response.data.extraKmCharge && response.data.extraKmCharge > 0) {
        toast.success(`تم استلام السيارة بنجاح\n⚠️ تم إضافة رسوم إضافية: ${response.data.extraKmCharge} د.ل للكيلومترات الزائدة (${response.data.extraKm} كم)`, {
          autoClose: 5000
        });
      } else {
        toast.success('تم استلام السيارة بنجاح');
      }
      
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل استلام السيارة');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return;

    try {
      await api.patch(`/bookings/${id}`, { status: 'cancelled' });
      toast.success('تم إلغاء الحجز');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل إلغاء الحجز');
    }
  };

  const resetForm = () => {
    setFormData({
      carId: '',
      customerId: '',
      startDate: '',
      endDate: '',
      dailyRate: 0,
      extras: 0,
      taxes: 0,
      discount: 0,
      notes: '',
      initialOdometer: 0,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'مؤكد';
      case 'active':
        return 'نشط';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalAmount, 0);

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
              <p className="text-sm text-blue-600 font-semibold">حجوزات مؤكدة</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {bookings.filter((b) => b.status === 'confirmed').length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">حجوزات نشطة</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {bookings.filter((b) => b.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">حجوزات مكتملة</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {bookings.filter((b) => b.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">الإيرادات المتوقعة</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{totalRevenue.toFixed(2)} د.ل</p>
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
              placeholder="ابحث برقم الحجز، السيارة أو العميل..."
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
            <option value="confirmed">مؤكد</option>
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
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
          حجز جديد
        </button>
      </div>

      {/* جدول الحجوزات */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الحجز
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السيارة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  من
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إلى
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الأيام
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ الإجمالي
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
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    لا توجد حجوزات
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {booking.bookingNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.car.brand} {booking.car.model} {booking.car.year}
                      </div>
                      <div className="text-sm text-gray-500">{booking.car.plateNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.customer.fullName}</div>
                      <div className="text-sm text-gray-500" dir="ltr">
                        {booking.customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.startDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.endDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {booking.totalDays} يوم
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {booking.totalAmount.toFixed(2)} د.ل
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setViewModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handlePickup(booking.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            تسليم
                          </button>
                        )}

                        {booking.status === 'active' && (
                          <button
                            onClick={() => handleReturn(booking.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            استلام
                          </button>
                        )}

                        {(booking.status === 'confirmed' || booking.status === 'active') && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal إضافة حجز جديد */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">حجز جديد</h2>

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
                        dailyRate: car?.dailyRate || 0,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- اختر السيارة --</option>
                    {cars
                      .filter((car) => car.status === 'available')
                      .map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.brand} {car.model} {car.year} - {car.plateNumber} - {car.dailyRate} د.ل/يوم
                        </option>
                      ))}
                  </select>
                </div>

                {/* اختيار العميل */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر العميل <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- اختر العميل --</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* تاريخ البدء */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    من تاريخ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* تاريخ الانتهاء */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    إلى تاريخ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* قراءة العداد عند الاستلام */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    قراءة العداد الحالية (كم) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.initialOdometer || ''}
                    onChange={(e) => setFormData({ ...formData, initialOdometer: parseInt(e.target.value) || 0 })}
                    placeholder="مثال: 25000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 قراءة عداد الكيلومترات الحالية للسيارة عند استلامها</p>
                </div>

                {/* السعر اليومي */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعر اليومي</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dailyRate}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* عدد الأيام (محسوب تلقائياً) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأيام</label>
                  <input
                    type="number"
                    value={calculateTotalDays(formData.startDate, formData.endDate)}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* إضافات */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">إضافات (د.ل)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.extras}
                    onChange={(e) => setFormData({ ...formData, extras: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* الضرائب */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الضرائب (د.ل)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxes}
                    onChange={(e) => setFormData({ ...formData, taxes: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* الخصم */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الخصم (د.ل)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* المبلغ الإجمالي */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ الإجمالي</label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculateTotalAmount().toFixed(2)}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-blue-50 font-bold text-blue-900 cursor-not-allowed"
                  />
                </div>

                {/* ملاحظات */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="أضف أي ملاحظات إضافية..."
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
                  حفظ الحجز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal عرض تفاصيل الحجز */}
      {viewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">تفاصيل الحجز</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">رقم الحجز:</span>
                  <p className="font-bold text-lg">{selectedBooking.bookingNumber}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">الحالة:</span>
                  <p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        selectedBooking.status
                      )}`}
                    >
                      {getStatusLabel(selectedBooking.status)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">معلومات السيارة</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">الماركة والموديل:</span>
                    <p className="font-semibold">
                      {selectedBooking.car.brand} {selectedBooking.car.model} {selectedBooking.car.year}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">رقم اللوحة:</span>
                    <p className="font-semibold">{selectedBooking.car.plateNumber}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">معلومات العميل</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">الاسم:</span>
                    <p className="font-semibold">{selectedBooking.customer.fullName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">الهاتف:</span>
                    <p className="font-semibold" dir="ltr">
                      {selectedBooking.customer.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">تفاصيل الحجز</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">من تاريخ:</span>
                    <p className="font-semibold">
                      {new Date(selectedBooking.startDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">إلى تاريخ:</span>
                    <p className="font-semibold">
                      {new Date(selectedBooking.endDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">عدد الأيام:</span>
                    <p className="font-semibold">{selectedBooking.totalDays} يوم</p>
                  </div>
                  <div>
                    <span className="text-gray-600">السعر اليومي:</span>
                    <p className="font-semibold">{selectedBooking.dailyRate} د.ل</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">التفاصيل المالية</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-semibold">{selectedBooking.subtotal.toFixed(2)} د.ل</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">إضافات:</span>
                    <span className="font-semibold">{selectedBooking.extras.toFixed(2)} د.ل</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الضرائب:</span>
                    <span className="font-semibold">{selectedBooking.taxes.toFixed(2)} د.ل</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الخصم:</span>
                    <span className="font-semibold text-red-600">
                      -{selectedBooking.discount.toFixed(2)} د.ل
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2">
                    <span className="font-bold text-lg">المبلغ الإجمالي:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {selectedBooking.totalAmount.toFixed(2)} د.ل
                    </span>
                  </div>
                </div>
              </div>

              {selectedBooking.pickupDate && (
                <div className="border-t pt-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600">تاريخ التسليم:</span>
                    <p className="font-semibold">
                      {new Date(selectedBooking.pickupDate).toLocaleString('ar-LY')}
                    </p>
                  </div>
                </div>
              )}

              {selectedBooking.returnDate && (
                <div className="border-t pt-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600">تاريخ الاستلام:</span>
                    <p className="font-semibold">
                      {new Date(selectedBooking.returnDate).toLocaleString('ar-LY')}
                    </p>
                  </div>
                </div>
              )}
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

export default Bookings;
