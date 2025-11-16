import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, Calendar } from 'lucide-react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

const AccountantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const { data } = await api.get('/reports/financial-overview');
      setRecentTransactions(data.transactions || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      rental: 'إيجار',
      maintenance: 'صيانة',
      fuel: 'وقود',
      insurance: 'تأمين',
      purchase: 'شراء',
      salary: 'رواتب',
      other: 'أخرى',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة المحاسب</h1>
        <p className="text-gray-600">مرحباً {user?.fullName} - النظرة المالية الشاملة</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-10 h-10 text-green-600" />
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-green-700 font-semibold">إجمالي الإيرادات</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            {stats.totalRevenue.toLocaleString()} د.ل
          </p>
          <p className="text-xs text-green-600 mt-1">
            هذا الشهر: {stats.monthlyRevenue.toLocaleString()} د.ل
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-10 h-10 text-red-600" />
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-red-700 font-semibold">إجمالي المصروفات</p>
          <p className="text-3xl font-bold text-red-900 mt-1">
            {stats.totalExpenses.toLocaleString()} د.ل
          </p>
          <p className="text-xs text-red-600 mt-1">
            هذا الشهر: {stats.monthlyExpenses.toLocaleString()} د.ل
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-10 h-10 text-blue-600" />
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700 font-semibold">صافي الربح</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">
            {stats.netProfit.toLocaleString()} د.ل
          </p>
          <p className="text-xs text-blue-600 mt-1">
            الهامش: {stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Pending Payments Alert */}
      {stats.pendingPayments > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">مدفوعات معلقة</p>
              <p className="text-sm text-yellow-700">
                هناك {stats.pendingPayments} مدفوعات تحتاج إلى معالجة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">المعاملات الأخيرة</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            عرض الكل
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">النوع</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الفئة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الوصف</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    لا توجد معاملات
                  </td>
                </tr>
              ) : (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(transaction.date).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {transaction.type === 'income' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                          <TrendingUp className="w-3 h-3" />
                          إيراد
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                          <TrendingDown className="w-3 h-3" />
                          مصروف
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {getCategoryLabel(transaction.category)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      <span className={transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {transaction.amount.toLocaleString()} د.ل
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/transactions')}
          className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <FileText className="w-5 h-5" />
          جميع المعاملات
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <TrendingUp className="w-5 h-5" />
          التقارير المالية
        </button>
        <button
          onClick={() => navigate('/finance')}
          className="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <DollarSign className="w-5 h-5" />
          الإدارة المالية
        </button>
      </div>
    </div>
  );
};

export default AccountantDashboard;
