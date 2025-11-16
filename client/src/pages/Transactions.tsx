import { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'refund' | 'payment';
  amount: number;
  description: string;
  category: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other';
  reference?: string;
  referenceNumber?: string;
  transactionDate: string;
  createdAt: string;
}

const categories = {
  income: ['إيجار سيارات', 'رسوم إضافية', 'تأمين', 'أخرى'],
  expense: ['صيانة', 'وقود', 'رواتب', 'إيجار مكتب', 'تأمين', 'تسويق', 'أخرى'],
  refund: ['استرداد تأمين', 'استرداد مدفوعات', 'أخرى'],
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense' | 'refund',
    amount: 0,
    description: '',
    category: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'other',
    reference: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.category || formData.amount <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      // Map fields to match backend schema
      const payload = {
        type: formData.type,
        amount: Number(formData.amount), // Ensure it's a number
        description: formData.description,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.reference || undefined, // Map reference to referenceNumber, send undefined if empty
        transactionDate: new Date(formData.date).toISOString(), // Convert to ISO string
      };
      
      await api.post('/transactions', payload);
      toast.success('تم إضافة المعاملة بنجاح');
      fetchTransactions();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Transaction error:', error.response?.data);
      toast.error(error.response?.data?.error || 'فشل إضافة المعاملة');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;

    try {
      await api.delete(`/transactions/${id}`);
      toast.success('تم حذف المعاملة بنجاح');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل حذف المعاملة');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: 0,
      description: '',
      category: '',
      paymentMethod: 'cash',
      reference: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
      case 'payment':
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
      case 'payment':
        return 'دفع';
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'rental':
        return 'إيجار سيارات';
      case 'maintenance':
        return 'صيانة';
      case 'fuel':
        return 'وقود';
      case 'insurance':
        return 'تأمين';
      case 'salary':
      case 'salaries':
        return 'رواتب';
      case 'office_rent':
        return 'إيجار مكتب';
      case 'marketing':
        return 'تسويق';
      case 'additional_fees':
        return 'رسوم إضافية';
      case 'car_sale':
        return 'بيع سيارات';
      case 'refund_deposit':
        return 'استرداد تأمين';
      case 'refund_payment':
        return 'استرداد مدفوعات';
      case 'other':
        return 'أخرى';
      default:
        return category;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.referenceNumber && transaction.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'income' || t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalIncome - totalExpense;

  // Debug: log transactions to see what types we have
  console.log('Transactions:', transactions);
  console.log('Total Income:', totalIncome, 'Total Expense:', totalExpense);

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
              <p className="text-sm text-blue-600 font-semibold">إجمالي المعاملات</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{transactions.length}</p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">إجمالي الإيرادات</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{totalIncome.toFixed(2)} د.ل</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold">إجمالي المصروفات</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{totalExpense.toFixed(2)} د.ل</p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">الصافي</p>
              <p className={`text-3xl font-bold mt-2 ${netAmount >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {netAmount.toFixed(2)} د.ل
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-600" />
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
              placeholder="ابحث بالوصف أو الفئة أو المرجع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">كل الأنواع</option>
            <option value="income">إيرادات</option>
            <option value="expense">مصروفات</option>
            <option value="refund">استردادات</option>
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
          معاملة جديدة
        </button>
      </div>

      {/* جدول المعاملات */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    لا توجد معاملات
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.transactionDate).toLocaleDateString('en-GB')}
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
                      {getCategoryLabel(transaction.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <span
                        className={
                          transaction.type === 'income' || transaction.type === 'payment'
                            ? 'text-green-600'
                            : transaction.type === 'expense'
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }
                      >
                        {transaction.type === 'income' || transaction.type === 'payment' ? '+' : '-'}
                        {transaction.amount.toFixed(2)} د.ل
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setViewModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
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

      {/* Modal إضافة معاملة */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">معاملة جديدة</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* نوع المعاملة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع المعاملة <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'income' | 'expense' | 'refund',
                        category: '',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="income">إيراد</option>
                    <option value="expense">مصروف</option>
                    <option value="refund">استرداد</option>
                  </select>
                </div>

                {/* الفئة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- اختر الفئة --</option>
                    {categories[formData.type].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* المبلغ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المبلغ (د.ل) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* طريقة الدفع */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value as 'cash' | 'card' | 'bank_transfer' | 'other',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">نقدي</option>
                    <option value="card">بطاقة</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                {/* التاريخ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* رقم المرجع */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم المرجع</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="رقم الفاتورة أو المرجع"
                  />
                </div>

                {/* الوصف */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="وصف تفصيلي للمعاملة..."
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
                  <Plus className="w-5 h-5" />
                  حفظ المعاملة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal عرض تفاصيل المعاملة */}
      {viewModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">تفاصيل المعاملة</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">النوع:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(
                    selectedTransaction.type
                  )}`}
                >
                  {getTypeLabel(selectedTransaction.type)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">المبلغ:</span>
                <span
                  className={`font-bold text-lg ${
                    selectedTransaction.type === 'income' || selectedTransaction.type === 'payment'
                      ? 'text-green-600'
                      : selectedTransaction.type === 'expense'
                      ? 'text-red-600'
                      : 'text-orange-600'
                  }`}
                >
                  {selectedTransaction.type === 'income' || selectedTransaction.type === 'payment' ? '+' : '-'}
                  {selectedTransaction.amount.toFixed(2)} د.ل
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">الوصف:</span>
                <p className="font-semibold mt-1">{selectedTransaction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">الفئة:</span>
                  <p className="font-semibold mt-1">{getCategoryLabel(selectedTransaction.category)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">طريقة الدفع:</span>
                  <p className="font-semibold mt-1">
                    {getPaymentMethodLabel(selectedTransaction.paymentMethod)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">التاريخ:</span>
                  <p className="font-semibold mt-1">
                    {new Date(selectedTransaction.transactionDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
                {(selectedTransaction.reference || selectedTransaction.referenceNumber) && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">المرجع:</span>
                    <p className="font-semibold mt-1">
                      {selectedTransaction.reference || selectedTransaction.referenceNumber}
                    </p>
                  </div>
                )}
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

export default Transactions;
