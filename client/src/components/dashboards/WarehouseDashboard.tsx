import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, Car, CheckCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PickupRequest {
  id: string;
  bookingNumber: string;
  customer: { fullName: string; phone: string };
  car: { brand: string; model: string; plateNumber: string };
  pickupDate: string;
  status: string;
}

const WarehouseDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const [stats, setStats] = useState({
    totalCars: 0,
    available: 0,
    rented: 0,
    maintenance: 0,
    pendingPickups: 0,
    pendingReturns: 0,
  });

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      const { data } = await api.get('/reports/warehouse-overview');
      setPickupRequests(data.pickupRequests || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Failed to fetch warehouse data:', error);
    }
  };

  const handlePreparePickup = async (requestId: string) => {
    try {
      await api.patch(`/bookings/${requestId}/prepare-pickup`);
      fetchWarehouseData();
    } catch (error) {
      console.error('Failed to prepare pickup:', error);
    }
  };

  const handleCompletePickup = (requestId: string) => {
    navigate('/bookings', { state: { pickupBooking: requestId } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة المستودع</h1>
        <p className="text-gray-600">مرحباً {user?.fullName} - إدارة الأسطول وطلبات التسليم</p>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-semibold">إجمالي الأسطول</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalCars}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-semibold">متاحة</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.available}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-semibold">مؤجرة</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{stats.rented}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-700 font-semibold">في الصيانة</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.maintenance}</p>
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700 font-semibold">تسليمات معلقة</p>
              <p className="text-2xl font-bold text-blue-900">{stats.pendingPickups}</p>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <Car className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-700 font-semibold">استلامات معلقة</p>
              <p className="text-2xl font-bold text-purple-900">{stats.pendingReturns}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pickup Requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">طلبات التسليم</h3>
          {stats.pendingPickups > 0 && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {stats.pendingPickups} معلق
            </span>
          )}
        </div>

        <div className="space-y-3">
          {pickupRequests.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد طلبات تسليم معلقة</p>
            </div>
          ) : (
            pickupRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Car Icon */}
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>

                  {/* Request Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {request.car.brand} {request.car.model}
                        </h4>
                        <p className="text-sm text-gray-600">{request.car.plateNumber}</p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {request.bookingNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-gray-600">العميل:</p>
                        <p className="font-semibold">{request.customer.fullName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">الهاتف:</p>
                        <p className="font-semibold" dir="ltr">{request.customer.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        موعد التسليم: {new Date(request.pickupDate).toLocaleDateString('en-GB')}
                      </p>

                      <div className="flex gap-2">
                        {request.status === 'confirmed' && (
                          <button
                            onClick={() => handlePreparePickup(request.id)}
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                          >
                            تجهيز السيارة
                          </button>
                        )}
                        {request.status === 'ready' && (
                          <button
                            onClick={() => handleCompletePickup(request.id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            تسليم للعميل
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/fleet')}
          className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <Package className="w-5 h-5" />
          إدارة الأسطول الكامل
        </button>
        <button
          onClick={() => navigate('/maintenance')}
          className="p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <AlertCircle className="w-5 h-5" />
          عرض الصيانات
        </button>
      </div>
    </div>
  );
};

export default WarehouseDashboard;
