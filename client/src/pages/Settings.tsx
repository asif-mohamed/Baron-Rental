import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Shield, Plus, Eye, Trash2, Save } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'accountant' | 'receptionist' | 'maintenance' | 'viewer';
  isActive: boolean;
  createdAt: string;
}

const roleLabels = {
  admin: 'مدير النظام',
  manager: 'مدير',
  accountant: 'محاسب',
  receptionist: 'موظف استقبال',
  maintenance: 'فني صيانة',
  viewer: 'مشاهد',
};

const Settings = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'viewer' as 'admin' | 'manager' | 'accountant' | 'receptionist' | 'maintenance' | 'viewer',
  });

  const [systemSettings, setSystemSettings] = useState({
    companyName: 'سلسلة البارون',
    currency: 'د.ل',
    timezone: 'Africa/Tripoli',
    language: 'ar',
    emailNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userForm.fullName || !userForm.email) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!editingUser && !userForm.password) {
      toast.error('كلمة المرور مطلوبة للمستخدمين الجدد');
      return;
    }

    try {
      if (editingUser) {
        // تحديث مستخدم
        await api.patch(`/api/users/${editingUser.id}`, {
          fullName: userForm.fullName,
          email: userForm.email,
          role: userForm.role,
          ...(userForm.password && { password: userForm.password }),
        });
        toast.success('تم تحديث المستخدم بنجاح');
      } else {
        // إضافة مستخدم جديد
        await api.post('/users', userForm);
        toast.success('تم إضافة المستخدم بنجاح');
      }

      fetchUsers();
      setShowUserModal(false);
      resetUserForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل حفظ المستخدم');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      await api.delete(`/api/users/${id}`);
      toast.success('تم حذف المستخدم بنجاح');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل حذف المستخدم');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/api/users/${id}`, { isActive: !isActive });
      toast.success(isActive ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل تحديث حالة المستخدم');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      fullName: '',
      email: '',
      password: '',
      role: 'viewer',
    });
    setEditingUser(null);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowUserModal(true);
  };

  const handleSaveSettings = () => {
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
          <p className="text-gray-600 mt-1">إدارة النظام والمستخدمين والصلاحيات</p>
        </div>
        <SettingsIcon className="w-12 h-12 text-blue-600" />
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">إجمالي المستخدمين</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{users.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">مستخدمين نشطين</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
            <Shield className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">المديرون</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {users.filter((u) => u.role === 'admin' || u.role === 'manager').length}
              </p>
            </div>
            <Shield className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* إدارة المستخدمين */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">إدارة المستخدمين</h2>
          <button
            onClick={() => {
              resetUserForm();
              setShowUserModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            مستخدم جديد
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البريد الإلكتروني
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    لا يوجد مستخدمون
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'نشط' : 'معطل'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="تعديل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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

      {/* الإعدادات العامة */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">الإعدادات العامة</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم الشركة</label>
            <input
              type="text"
              value={systemSettings.companyName}
              onChange={(e) => setSystemSettings({ ...systemSettings, companyName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">العملة</label>
            <select
              value={systemSettings.currency}
              onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="د.ل">دينار ليبي (د.ل)</option>
              <option value="$">دولار أمريكي ($)</option>
              <option value="€">يورو (€)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة الزمنية</label>
            <select
              value={systemSettings.timezone}
              onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Africa/Tripoli">طرابلس (Africa/Tripoli)</option>
              <option value="Africa/Cairo">القاهرة (Africa/Cairo)</option>
              <option value="Asia/Dubai">دبي (Asia/Dubai)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اللغة</label>
            <select
              value={systemSettings.language}
              onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={systemSettings.emailNotifications}
              onChange={(e) =>
                setSystemSettings({ ...systemSettings, emailNotifications: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="mr-3 text-sm font-medium text-gray-700">تفعيل إشعارات البريد الإلكتروني</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={systemSettings.smsNotifications}
              onChange={(e) => setSystemSettings({ ...systemSettings, smsNotifications: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="mr-3 text-sm font-medium text-gray-700">تفعيل إشعارات SMS</label>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t">
          <button
            onClick={handleSaveSettings}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            حفظ الإعدادات
          </button>
        </div>
      </div>

      {/* Modal إضافة/تعديل مستخدم */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingUser ? 'تعديل مستخدم' : 'مستخدم جديد'}
            </h2>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={editingUser ? 'اتركه فارغاً إذا لم ترد تغييره' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الدور <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      role: e.target.value as
                        | 'admin'
                        | 'manager'
                        | 'accountant'
                        | 'receptionist'
                        | 'maintenance'
                        | 'viewer',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">مشاهد</option>
                  <option value="receptionist">موظف استقبال</option>
                  <option value="maintenance">فني صيانة</option>
                  <option value="accountant">محاسب</option>
                  <option value="manager">مدير</option>
                  <option value="admin">مدير النظام</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
