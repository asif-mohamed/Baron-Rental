import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Eye, FileText } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber?: string;
  email?: string;
  address?: string;
  nationalId?: string;
  nationalIdDocument?: string;
  fingerprintDocument?: string;
  rentalContract?: string;
  notes?: string;
  createdAt: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    nationalId: '',
    licenseNumber: '',
    notes: '',
  });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [fingerprintFile, setFingerprintFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error: any) {
      toast.error('فشل تحميل العملاء');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let nationalIdDocPath = '';
      let fingerprintDocPath = '';
      let contractDocPath = '';

      // Upload ID document if selected
      if (idFile) {
        const idFormData = new FormData();
        idFormData.append('file', idFile);
        idFormData.append('entityType', 'customers');
        
        const idResponse = await api.post('/upload/single', idFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        nationalIdDocPath = idResponse.data.file.path;
      }

      // Upload fingerprint document if selected
      if (fingerprintFile) {
        const fpFormData = new FormData();
        fpFormData.append('file', fingerprintFile);
        fpFormData.append('entityType', 'customers');
        
        const fpResponse = await api.post('/upload/single', fpFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fingerprintDocPath = fpResponse.data.file.path;
      }

      // Upload rental contract if selected
      if (contractFile) {
        const contractFormData = new FormData();
        contractFormData.append('file', contractFile);
        contractFormData.append('entityType', 'customers');
        
        const contractResponse = await api.post('/upload/single', contractFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        contractDocPath = contractResponse.data.file.path;
      }

      const dataToSend = {
        ...formData,
        nationalIdDocument: nationalIdDocPath || undefined,
        fingerprintDocument: fingerprintDocPath || undefined,
        rentalContract: contractDocPath || undefined,
      };

      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, dataToSend);
        toast.success('تم تحديث العميل بنجاح');
      } else {
        await api.post('/customers', dataToSend);
        toast.success('تم إضافة العميل بنجاح ✅');
      }
      
      fetchCustomers();
      closeModal();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'فشلت العملية';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    try {
      await api.delete(`/api/customers/${id}`);
      toast.success('تم حذف العميل بنجاح');
      fetchCustomers();
    } catch (error: any) {
      toast.error('فشل حذف العميل');
    }
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        nationalId: customer.nationalId || '',
        licenseNumber: customer.licenseNumber || '',
        notes: customer.notes || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        nationalId: '',
        licenseNumber: '',
        notes: '',
      });
    }
    setIdFile(null);
    setFingerprintFile(null);
    setContractFile(null);
    setShowModal(true);
    setViewingCustomer(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setViewingCustomer(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات العملاء */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">إجمالي العملاء</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{customers.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">عملاء جدد هذا الشهر</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {customers.filter(c => {
                  const date = new Date(c.createdAt);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Users className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">عملاء نشطون</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{customers.length}</p>
            </div>
            <FileText className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* شريط الأدوات */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث عن عميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* جدول العملاء */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الكامل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الهاتف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد الإلكتروني</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{customer.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap" dir="ltr">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(customer.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingCustomer(customer)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="عرض"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(customer)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
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
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              لا يوجد عملاء
            </div>
          )}
        </div>
      </div>

      {/* نافذة إضافة/تعديل عميل */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أحمد محمد عبدالعزيز"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0912345678"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="طرابلس - المدينة القديمة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهوية الوطنية</label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345678901"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">صورة الهوية الوطنية</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (الحد الأقصى 5MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">صورة البصمة</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFingerprintFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (الحد الأقصى 5MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عقد الإيجار (اختياري)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG (الحد الأقصى 5MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'جاري الحفظ...' : editingCustomer ? 'تحديث العميل' : 'حفظ العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة عرض تفاصيل العميل */}
      {viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">تفاصيل العميل</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">الاسم الكامل</p>
                  <p className="text-lg font-semibold">{viewingCustomer.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">رقم الهاتف</p>
                  <p className="text-lg font-semibold" dir="ltr">{viewingCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p className="text-lg font-semibold">{viewingCustomer.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">العنوان</p>
                  <p className="text-lg font-semibold">{viewingCustomer.address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">رقم الهوية الوطنية</p>
                  <p className="text-lg font-semibold">{viewingCustomer.nationalId || '-'}</p>
                </div>
              </div>

              {/* Documents Section */}
              {(viewingCustomer.nationalIdDocument || viewingCustomer.fingerprintDocument || viewingCustomer.rentalContract) && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-lg mb-3">📄 المستندات المرفقة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {viewingCustomer.nationalIdDocument && (
                      <a
                        href={`http://localhost:5000${viewingCustomer.nationalIdDocument}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">🆔</div>
                        <p className="text-sm font-medium">صورة الهوية</p>
                        <p className="text-xs text-blue-600 mt-1">اضغط للعرض</p>
                      </a>
                    )}
                    {viewingCustomer.fingerprintDocument && (
                      <a
                        href={`http://localhost:5000${viewingCustomer.fingerprintDocument}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">👆</div>
                        <p className="text-sm font-medium">البصمة</p>
                        <p className="text-xs text-green-600 mt-1">اضغط للعرض</p>
                      </a>
                    )}
                    {viewingCustomer.rentalContract && (
                      <a
                        href={`http://localhost:5000${viewingCustomer.rentalContract}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-sm font-medium">عقد الإيجار</p>
                        <p className="text-xs text-purple-600 mt-1">اضغط للعرض</p>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {viewingCustomer.notes && (
                <div>
                  <p className="text-sm text-gray-500">ملاحظات</p>
                  <p className="text-lg">{viewingCustomer.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
