import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Mail, Phone, Calendar, Shield, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    password: '',
    isActive: true,
  });

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data.users || []);
    } catch (error) {
      toast.error('فشل تحميل الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/users/roles');
      console.log('Roles fetched:', response.data); // Debug log
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('فشل تحميل الأدوار الوظيفية');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.roleId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!editMode && !formData.password) {
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        roleId: formData.roleId,
        isActive: formData.isActive,
        ...(formData.password && { password: formData.password }),
      };

      if (editMode) {
        await api.put(`/users/${formData.id}`, payload);
        toast.success('تم تحديث الموظف بنجاح');
      } else {
        await api.post('/users', payload);
        toast.success('تم إضافة الموظف بنجاح');
      }

      fetchEmployees();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل حفظ الموظف');
    }
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone || '',
      roleId: employee.role.id,
      password: '',
      isActive: employee.isActive,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('تم حذف الموظف بنجاح');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل حذف الموظف');
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    try {
      await api.patch(`/users/${employee.id}/toggle-status`);
      toast.success(employee.isActive ? 'تم تعطيل الموظف' : 'تم تفعيل الموظف');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل تحديث حالة الموظف');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      fullName: '',
      email: '',
      phone: '',
      roleId: '',
      password: '',
      isActive: true,
    });
    setEditMode(false);
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || employee.role.name === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (roleName: string) => {
    const colors: { [key: string]: string } = {
      Admin: 'bg-red-100 text-red-800',
      Manager: 'bg-purple-100 text-purple-800',
      Reception: 'bg-blue-100 text-blue-800',
      Warehouse: 'bg-green-100 text-green-800',
      Accountant: 'bg-yellow-100 text-yellow-800',
      Mechanic: 'bg-orange-100 text-orange-800',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            إدارة الموظفين
          </h1>
          <p className="text-gray-600 mt-1">إدارة حسابات وأدوار الموظفين</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          موظف جديد
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <p className="text-sm text-purple-700 font-semibold">إجمالي الموظفين</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">{employees.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700 font-semibold">نشط</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            {employees.filter((e) => e.isActive).length}
          </p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <p className="text-sm text-red-700 font-semibold">معطل</p>
          <p className="text-3xl font-bold text-red-900 mt-1">
            {employees.filter((e) => !e.isActive).length}
          </p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700 font-semibold">الأدوار</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{roles.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pr-10"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input"
          >
            <option value="all">جميع الأدوار</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الموظف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإضافة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{employee.fullName}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {employee.email}
                          </span>
                          {employee.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {employee.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                          employee.role.name
                        )}`}
                      >
                        <Shield className="w-3 h-3" />
                        {employee.role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {employee.isActive ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          <XCircle className="w-3 h-3" />
                          معطل
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(employee.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(employee)}
                          className={`p-2 rounded-lg transition-colors ${
                            employee.isActive
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={employee.isActive ? 'تعطيل' : 'تفعيل'}
                        >
                          {employee.isActive ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-7 h-7 text-purple-600" />
                {editMode ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {editMode ? 'تحديث معلومات الموظف وصلاحياته' : 'إضافة موظف جديد إلى النظام'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* معلومات شخصية */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  المعلومات الشخصية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="أدخل الاسم الكامل"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="مثال: 0912345678"
                      dir="ltr"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      البريد الإلكتروني <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="example@company.com"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* الدور والصلاحيات */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  الدور والصلاحيات
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      الدور الوظيفي <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">-- اختر الدور الوظيفي --</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name === 'Admin' ? 'مدير النظام' :
                           role.name === 'Manager' ? 'مدير' :
                           role.name === 'Reception' ? 'موظف استقبال' :
                           role.name === 'Warehouse' ? 'أمين مستودع' :
                           role.name === 'Accountant' ? 'محاسب' :
                           role.name === 'Mechanic' ? 'ميكانيكي' :
                           role.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      يحدد الدور الصلاحيات المتاحة للموظف في النظام
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      حالة الحساب
                    </label>
                    <select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="active">نشط - يمكن تسجيل الدخول</option>
                      <option value="inactive">معطل - لا يمكن تسجيل الدخول</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.isActive ? 'الموظف يمكنه الدخول للنظام' : 'الموظف لا يمكنه الدخول للنظام'}
                    </p>
                  </div>
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  الأمان
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    كلمة المرور {!editMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={editMode ? 'اتركه فارغاً للإبقاء على كلمة المرور الحالية' : 'أدخل كلمة مرور قوية'}
                    dir="ltr"
                    required={!editMode}
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editMode 
                      ? 'اترك الحقل فارغاً إذا كنت لا تريد تغيير كلمة المرور'
                      : 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'
                    }
                  </p>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  {editMode ? (
                    <>
                      <Edit className="w-5 h-5" />
                      تحديث البيانات
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      إضافة الموظف
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
