import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Download } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'refund';
  amount: number;
  description: string;
  category: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other';
  reference?: string;
  date: string;
  createdAt: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

const Finance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchFinancialData();
    fetchTransactions();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      const data = response.data;

      setSummary({
        totalRevenue: data.totalRevenue || 0,
        totalExpenses: data.totalExpenses || 0,
        netProfit: (data.totalRevenue || 0) - (data.totalExpenses || 0),
        pendingInvoices: data.pendingInvoices || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        monthlyExpenses: data.monthlyExpenses || 0,
      });
    } catch (error) {
      console.error('فشل تحميل البيانات المالية');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.transactions || []);
    } catch (error) {
      toast.error('فشل تحميل المعاملات');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.post(`/api/reports/export?${params.toString()}`, {
        format: 'excel',
      });

      // تنزيل الملف
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('تم تصدير التقرير بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل تصدير التقرير');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      case 'refund':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'إيراد';
      case 'expense':
        return 'مصروف';
      case 'refund':
        return 'استرداد';
      default:
        return type;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'نقدي';
      case 'card':
        return 'بطاقة';
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'other':
        return 'أخرى';
      default:
        return method;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType = filterType === 'all' || transaction.type === filterType;

    let matchesDate = true;
    if (startDate && endDate) {
      const transactionDate = new Date(transaction.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      matchesDate = transactionDate >= start && transactionDate <= end;
    }

    return matchesType && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات مالية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">إجمالي الإيرادات</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {summary.totalRevenue.toFixed(2)} د.ل
              </p>
              <p className="text-xs text-green-600 mt-1">
                الشهر الحالي: {summary.monthlyRevenue.toFixed(2)} د.ل
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold">إجمالي المصروفات</p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                {summary.totalExpenses.toFixed(2)} د.ل
              </p>
              <p className="text-xs text-red-600 mt-1">
                الشهر الحالي: {summary.monthlyExpenses.toFixed(2)} د.ل
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">صافي الربح</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{summary.netProfit.toFixed(2)} د.ل</p>
              <p className="text-xs text-blue-600 mt-1">
                الفواتير المعلقة: {summary.pendingInvoices}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* شريط الفلاتر */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-3 flex-1 w-full">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">كل الأنواع</option>
              <option value="income">إيرادات</option>
              <option value="expense">مصروفات</option>
              <option value="refund">استردادات</option>
            </select>

            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="من تاريخ"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="إلى تاريخ"
              />
            </div>
          </div>

          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            تصدير Excel
          </button>
        </div>
      </div>

      {/* جدول المعاملات */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">سجل المعاملات المالية</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفئة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المرجع
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    لا توجد معاملات مالية
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(
                          transaction.type
                        )}`}
                      >
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <span
                        className={
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : transaction.type === 'expense'
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {transaction.amount.toFixed(2)} د.ل
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.reference || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ملخص سريع */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">ملخص الفترة المحددة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-semibold">إيرادات</p>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {filteredTransactions
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}{' '}
              د.ل
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 font-semibold">مصروفات</p>
            <p className="text-2xl font-bold text-red-900 mt-2">
              {filteredTransactions
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}{' '}
              د.ل
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-semibold">الصافي</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {(
                filteredTransactions
                  .filter((t) => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0) -
                filteredTransactions
                  .filter((t) => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0)
              ).toFixed(2)}{' '}
              د.ل
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
