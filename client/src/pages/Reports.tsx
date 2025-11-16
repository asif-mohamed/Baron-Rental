import { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, Car, Users, DollarSign } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  totalBookings: number;
  totalCars: number;
  totalCustomers: number;
  activeBookings: number;
  availableCars: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyBookings: number;
  rentedCars: number;
  maintenanceCars: number;
}

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalBookings: 0,
    totalCars: 0,
    totalCustomers: 0,
    activeBookings: 0,
    availableCars: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    monthlyBookings: 0,
    rentedCars: 0,
    maintenanceCars: 0,
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState<string>('all');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      console.log('Fetching report data...');
      
      // Fetch dashboard stats
      const dashboardResponse = await api.get('/reports/dashboard');
      console.log('Dashboard stats:', dashboardResponse.data);
      
      const stats = dashboardResponse.data.stats;
      
      // Fetch all transactions to calculate total revenue and expenses
      const transactionsResponse = await api.get('/transactions');
      console.log('Transactions:', transactionsResponse.data);
      
      const transactions = transactionsResponse.data.transactions || [];
      
      // Calculate total revenue (payments and income)
      const totalRevenue = transactions
        .filter((t: any) => t.type === 'payment' || t.type === 'income')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      
      // Calculate total expenses (expense type)
      const totalExpenses = transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      
      // Get current month start
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
      // Calculate monthly revenue
      const monthlyRevenue = transactions
        .filter((t: any) => {
          const transDate = new Date(t.transactionDate);
          return (t.type === 'payment' || t.type === 'income') && transDate >= monthStart;
        })
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      
      // Calculate monthly expenses
      const monthlyExpenses = transactions
        .filter((t: any) => {
          const transDate = new Date(t.transactionDate);
          return t.type === 'expense' && transDate >= monthStart;
        })
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      
      // Fetch all bookings to get total count
      const bookingsResponse = await api.get('/bookings');
      const totalBookings = bookingsResponse.data.bookings?.length || 0;
      
      // Calculate monthly bookings
      const monthlyBookings = (bookingsResponse.data.bookings || []).filter((b: any) => {
        const startDate = new Date(b.startDate);
        return startDate >= monthStart;
      }).length;
      
      console.log('Calculated values:', {
        totalRevenue,
        totalExpenses,
        totalBookings,
        monthlyRevenue,
        monthlyExpenses,
        monthlyBookings,
      });
      
      // Map the backend stats to the report data structure
      setReportData({
        totalRevenue,
        totalExpenses,
        totalBookings,
        totalCars: stats.fleet.total,
        totalCustomers: stats.customers,
        activeBookings: stats.bookings.active,
        availableCars: stats.fleet.available,
        rentedCars: stats.fleet.rented,
        maintenanceCars: stats.fleet.maintenance,
        monthlyRevenue,
        monthlyExpenses,
        monthlyBookings,
      });
    } catch (error: any) {
      console.error('Failed to fetch report data:', error);
      console.error('Error details:', error.response?.data);
      toast.error('فشل تحميل بيانات التقرير: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      console.log('Exporting report as', format);
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (reportType !== 'all') params.append('type', reportType);
      params.append('format', format);

      toast.info(`جاري تصدير التقرير بصيغة ${format === 'excel' ? 'Excel' : 'PDF'}...`);

      const response = await api.post(`/reports/export?${params.toString()}`, {
        format,
        reportType,
        startDate,
        endDate,
        data: reportData,
      }, {
        responseType: 'blob', // Important for file downloads
      });

      console.log('Export response:', response);

      // Create download link
      const fileExtension = format === 'excel' ? 'xlsx' : 'pdf';
      const fileName = `تقرير_${reportType}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`تم تصدير التقرير بصيغة ${format === 'excel' ? 'Excel' : 'PDF'} بنجاح`);
    } catch (error: any) {
      console.error('Export error:', error);
      console.error('Error details:', error.response?.data);
      
      // If the response is a blob, try to read the error message
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        console.error('Blob error content:', text);
        try {
          const errorData = JSON.parse(text);
          toast.error(errorData.error || 'فشل تصدير التقرير');
        } catch {
          toast.error('فشل تصدير التقرير');
        }
      } else {
        toast.error(error.response?.data?.error || 'فشل تصدير التقرير');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
          <p className="text-gray-600 mt-1">نظرة شاملة على أداء النظام</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            تحديث البيانات
          </button>
          <BarChart3 className="w-12 h-12 text-blue-600" />
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">إجمالي الإيرادات</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {reportData.totalRevenue.toFixed(2)} د.ل
              </p>
              <p className="text-xs text-green-600 mt-1">
                هذا الشهر: {reportData.monthlyRevenue.toFixed(2)} د.ل
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold">إجمالي المصروفات</p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                {reportData.totalExpenses.toFixed(2)} د.ل
              </p>
              <p className="text-xs text-red-600 mt-1">
                هذا الشهر: {reportData.monthlyExpenses.toFixed(2)} د.ل
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">صافي الربح</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {(reportData.totalRevenue - reportData.totalExpenses).toFixed(2)} د.ل
              </p>
              <p className="text-xs text-blue-600 mt-1">
                هذا الشهر:{' '}
                {(reportData.monthlyRevenue - reportData.monthlyExpenses).toFixed(2)} د.ل
              </p>
            </div>
            <BarChart3 className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* إحصائيات التشغيل */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">إحصائيات التشغيل</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <Car className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-purple-600 font-semibold">إجمالي السيارات</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{reportData.totalCars}</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Car className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-600 font-semibold">متاحة</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{reportData.availableCars}</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Car className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-orange-600 font-semibold">مؤجرة</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{reportData.rentedCars}</p>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Car className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-600 font-semibold">في الصيانة</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{reportData.maintenanceCars}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-orange-600 font-semibold">الحجوزات</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{reportData.totalBookings}</p>
            <p className="text-xs text-orange-600 mt-1">نشطة: {reportData.activeBookings} | شهري: {reportData.monthlyBookings}</p>
          </div>

          <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
            <Users className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p className="text-sm text-teal-600 font-semibold">العملاء</p>
            <p className="text-2xl font-bold text-teal-900 mt-1">{reportData.totalCustomers}</p>
            <p className="text-xs text-teal-600 mt-1">عملاء مسجلون في النظام</p>
          </div>
        </div>
      </div>

      {/* خيارات التصفية والتصدير */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">تصدير التقارير</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">تقرير شامل</option>
              <option value="financial">تقرير مالي</option>
              <option value="bookings">تقرير الحجوزات</option>
              <option value="fleet">تقرير الأسطول</option>
              <option value="customers">تقرير العملاء</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => handleExport('excel')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            تصدير Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            تصدير PDF
          </button>
        </div>
      </div>

      {/* معلومات إضافية */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-bold text-gray-800 mb-3">ملاحظات هامة</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>التقارير تعرض البيانات حسب الفترة المحددة أو كامل البيانات إذا لم تحدد فترة</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>تصدير Excel يتضمن جداول تفصيلية لكل قسم مع إمكانية الفلترة والترتيب</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>تصدير PDF يوفر تقرير منسق جاهز للطباعة والمشاركة</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>البيانات المالية تشمل الإيرادات من الحجوزات والمصروفات من الصيانة والتشغيل</span>
          </li>
        </ul>
      </div>

      {/* رسم بياني بسيط */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">نظرة سريعة - الشهر الحالي</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">الإيرادات مقابل المصروفات</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600 font-semibold">إيرادات</span>
                  <span className="text-green-900 font-bold">
                    {reportData.monthlyRevenue.toFixed(2)} د.ل
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{
                      width: `${
                        (reportData.monthlyRevenue /
                          (reportData.monthlyRevenue + reportData.monthlyExpenses)) *
                          100 || 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600 font-semibold">مصروفات</span>
                  <span className="text-red-900 font-bold">
                    {reportData.monthlyExpenses.toFixed(2)} د.ل
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-600 h-3 rounded-full"
                    style={{
                      width: `${
                        (reportData.monthlyExpenses /
                          (reportData.monthlyRevenue + reportData.monthlyExpenses)) *
                          100 || 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">استخدام الأسطول</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-orange-600 font-semibold">سيارات مؤجرة</span>
                  <span className="text-orange-900 font-bold">
                    {reportData.rentedCars} سيارة ({((reportData.rentedCars / reportData.totalCars) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-orange-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${
                        (reportData.rentedCars / reportData.totalCars) * 100 || 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600 font-semibold">سيارات متاحة</span>
                  <span className="text-green-900 font-bold">
                    {reportData.availableCars} سيارة ({((reportData.availableCars / reportData.totalCars) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${(reportData.availableCars / reportData.totalCars) * 100 || 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-600 font-semibold">في الصيانة</span>
                  <span className="text-yellow-900 font-bold">
                    {reportData.maintenanceCars} سيارة ({((reportData.maintenanceCars / reportData.totalCars) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${(reportData.maintenanceCars / reportData.totalCars) * 100 || 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
