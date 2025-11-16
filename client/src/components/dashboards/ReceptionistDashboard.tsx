import { useState, useEffect } from 'react';
import { Calendar, Car, Search, Clock, CheckCircle, Plus, Bell, Phone, Mail, User } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface QuickBooking {
  id: string;
  bookingNumber: string;
  customer: { fullName: string; phone: string };
  car: { brand: string; model: string; plateNumber: string };
  startDate: string;
  endDate: string;
  status: string;
}

interface AvailableCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  dailyRate: number;
}

interface CustomerSearchResult {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  nationalId?: string;
  licenseNumber?: string;
}

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentBookings, setRecentBookings] = useState<QuickBooking[]>([]);
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState({
    todayBookings: 0,
    activeBookings: 0,
    pendingPickups: 0,
    availableCars: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, carsRes, statsRes] = await Promise.all([
        api.get('/bookings?limit=5&status=active,confirmed'),
        api.get('/cars?status=available&limit=6'),
        api.get('/reports/receptionist-stats'),
      ]);

      setRecentBookings(bookingsRes.data.bookings || []);
      setAvailableCars(carsRes.data.cars || []);
      setStats(statsRes.data.stats || stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleCustomerSearch = async () => {
    if (!searchTerm.trim()) {
      setCustomerResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await api.get(`/customers/search?q=${searchTerm}`);
      setCustomerResults(data.customers || []);
      if (data.customers.length === 0) {
        toast.info('لم يتم العثور على عملاء');
      }
    } catch (error) {
      toast.error('فشل البحث عن العميل');
    } finally {
      setSearching(false);
    }
  };

  const handleQuickBook = () => {
    navigate('/bookings', { state: { openModal: true } });
  };

  const handleExtendBooking = (bookingId: string) => {
    navigate('/bookings', { state: { editBooking: bookingId, action: 'extend' } });
  };

  const handleEndBooking = (bookingId: string) => {
    navigate('/bookings', { state: { editBooking: bookingId, action: 'complete' } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'مؤكد';
      case 'active': return 'نشط';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة الاستقبال</h1>
          <p className="text-gray-600">مرحباً {user?.fullName} - إدارة سريعة للحجوزات والعملاء</p>
        </div>
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          aria-label="الإشعارات"
        >
          <Bell className="w-6 h-6 text-blue-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            3
          </span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-semibold">حجوزات اليوم</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.todayBookings}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-semibold">حجوزات نشطة</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.activeBookings}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-semibold">بانتظار التسليم</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{stats.pendingPickups}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-semibold">سيارات متاحة</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{stats.availableCars}</p>
            </div>
            <Car className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Search */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              بحث عن عميل
            </h3>
            
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="الاسم، الهاتف، البريد، أو رقم الهوية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>

              <button
                onClick={handleCustomerSearch}
                disabled={searching}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {searching ? 'جاري البحث...' : 'بحث'}
              </button>

              {customerResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {customerResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-500 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{customer.fullName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                            <Phone className="w-3 h-3" />
                            <span dir="ltr">{customer.phone}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Book Button */}
          <button
            onClick={handleQuickBook}
            className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-bold text-lg"
          >
            <Plus className="w-6 h-6" />
            حجز سريع جديد
          </button>
        </div>

        {/* Recent Bookings & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Bookings */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">الحجوزات الأخيرة</h3>
            
            <div className="space-y-3">
              {recentBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد حجوزات حالياً</p>
              ) : (
                recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">{booking.bookingNumber}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">العميل:</p>
                            <p className="font-semibold">{booking.customer.fullName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">السيارة:</p>
                            <p className="font-semibold">{booking.car.brand} {booking.car.model}</p>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          من {new Date(booking.startDate).toLocaleDateString('en-GB')} 
                          {' '}إلى {new Date(booking.endDate).toLocaleDateString('en-GB')}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleExtendBooking(booking.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          تمديد
                        </button>
                        <button
                          onClick={() => handleEndBooking(booking.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                        >
                          إنهاء
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Cars */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">السيارات المتاحة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableCars.slice(0, 4).map((car) => (
                <div
                  key={car.id}
                  className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate('/fleet')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{car.brand} {car.model}</p>
                      <p className="text-sm text-gray-600">{car.plateNumber} • {car.year}</p>
                      <p className="text-xs text-blue-600 font-semibold mt-1">{car.dailyRate} د.ل/يوم</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {availableCars.length > 4 && (
              <button
                onClick={() => navigate('/fleet')}
                className="w-full mt-3 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
              >
                عرض جميع السيارات ({availableCars.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
