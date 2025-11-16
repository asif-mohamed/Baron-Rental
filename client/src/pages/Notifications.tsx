import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Eye, MessageSquare, X, Send, Plus, Users } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId?: string;
  roleId?: string;
  data?: string;
  requiresAction?: boolean;
  actionType?: 'approve' | 'extend' | 'confirm' | 'acknowledge';
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role: { name: string };
}

const Notifications = () => {
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  
  // Create notification modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [newNotification, setNewNotification] = useState({
    type: 'user_message',
    title: '',
    message: '',
    requiresAction: false,
    actionType: '',
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'action-required' | 'sent'>('all');

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications for current user...');
      const endpoint = filter === 'sent' ? '/notifications/sent' : '/notifications';
      const { data } = await api.get(endpoint);
      console.log('Notifications received:', data);
      setNotifications(data.notifications || []);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      toast.error('فشل تحميل الإشعارات: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users for recipient selection...');
      const { data } = await api.get('/users/recipients-list');
      console.log('Users received:', data);
      
      // Filter out current user from the list
      const filteredUsers = (data.users || []).filter((u: User) => u.id !== currentUser?.id);
      setUsers(filteredUsers);
      console.log('Available recipients:', filteredUsers.length);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error('فشل تحميل قائمة المستخدمين: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSendNotification = async () => {
    if (!selectedRecipients.length) {
      toast.error('يرجى اختيار مستلم واحد على الأقل');
      return;
    }

    if (!newNotification.title || !newNotification.message) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (newNotification.requiresAction && !newNotification.actionType) {
      toast.error('يرجى اختيار نوع الإجراء المطلوب');
      return;
    }

    try {
      console.log('Sending notification to:', selectedRecipients);
      console.log('Notification data:', newNotification);
      
      await api.post('/notifications/send', {
        recipientIds: selectedRecipients,
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        requiresAction: newNotification.requiresAction,
        actionType: newNotification.requiresAction ? newNotification.actionType : null,
      });

      toast.success(`تم إرسال الإشعار إلى ${selectedRecipients.length} مستلم بنجاح`);
      setShowCreateModal(false);
      setSelectedRecipients([]);
      setNewNotification({
        type: 'user_message',
        title: '',
        message: '',
        requiresAction: false,
        actionType: '',
      });
      
      // Refresh notifications to show sent items
      fetchNotifications();
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      toast.error(error.response?.data?.error || 'فشل إرسال الإشعار');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      console.log('Marking notification as read:', notificationId);
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      toast.success('تم تحديد الإشعار كمقروء');
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
      toast.error('فشل تحديث الإشعار: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read...');
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
      toast.error('فشل تحديث الإشعارات: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;
    
    try {
      console.log('Deleting notification:', notificationId);
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('تم حذف الإشعار');
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      toast.error('فشل حذف الإشعار: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAcknowledge = async (notification: Notification) => {
    if (!responseMessage.trim() && notification.requiresAction) {
      toast.error('يرجى كتابة رسالة قبل الرد');
      return;
    }

    try {
      console.log('Acknowledging notification:', notification.id);
      console.log('Response message:', responseMessage);
      
      // Send acknowledgment based on action type
      let endpoint = '';
      let payload: any = { message: responseMessage };

      switch (notification.actionType) {
        case 'approve':
          endpoint = '/approvals/respond';
          payload.notificationId = notification.id;
          payload.approved = true;
          break;
        case 'extend':
          endpoint = '/bookings/extend-response';
          payload.notificationId = notification.id;
          payload.approved = true;
          break;
        case 'acknowledge':
        case 'confirm':
        default:
          endpoint = '/notifications/acknowledge';
          payload.notificationId = notification.id;
          break;
      }

      console.log('Sending to endpoint:', endpoint);
      await api.post(endpoint, payload);
      
      // Mark as read and close modal
      await handleMarkAsRead(notification.id);
      setSelectedNotification(null);
      setResponseMessage('');
      toast.success('تم إرسال الرد بنجاح');
      
      // Refresh notifications
      fetchNotifications();
    } catch (error: any) {
      console.error('Failed to acknowledge:', error);
      toast.error('فشل إرسال الرد: ' + (error.response?.data?.error || error.message));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
      case 'booking_created':
        return '📅';
      case 'maintenance':
      case 'maintenance_due':
        return '🔧';
      case 'car_delivery':
      case 'car_pickup_needed':
        return '🚗';
      case 'payment':
        return '💰';
      case 'approval':
      case 'approve':
        return '✅';
      case 'user_message':
        return '💬';
      case 'request':
        return '📝';
      case 'alert':
        return '⚠️';
      case 'reminder':
        return '⏰';
      case 'info':
        return 'ℹ️';
      case 'acknowledgment':
        return '✉️';
      case 'pickup_due':
      case 'overdue':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'booking':
      case 'booking_created':
        return 'حجز';
      case 'maintenance':
      case 'maintenance_due':
        return 'صيانة';
      case 'car_delivery':
      case 'car_pickup_needed':
        return 'تسليم سيارة';
      case 'payment':
        return 'دفع';
      case 'approval':
      case 'approve':
        return 'موافقة';
      case 'user_message':
        return 'رسالة';
      case 'request':
        return 'طلب';
      case 'alert':
        return 'تنبيه';
      case 'reminder':
        return 'تذكير';
      case 'info':
        return 'معلومة';
      case 'acknowledgment':
        return 'إقرار';
      case 'pickup_due':
        return 'استلام مستحق';
      case 'overdue':
        return 'متأخر';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking':
      case 'booking_created':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
      case 'maintenance_due':
        return 'bg-orange-100 text-orange-800';
      case 'car_delivery':
      case 'car_pickup_needed':
        return 'bg-purple-100 text-purple-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'approval':
      case 'approve':
        return 'bg-yellow-100 text-yellow-800';
      case 'user_message':
        return 'bg-indigo-100 text-indigo-800';
      case 'request':
        return 'bg-cyan-100 text-cyan-800';
      case 'alert':
        return 'bg-red-100 text-red-800';
      case 'reminder':
        return 'bg-pink-100 text-pink-800';
      case 'info':
        return 'bg-teal-100 text-teal-800';
      case 'acknowledgment':
        return 'bg-emerald-100 text-emerald-800';
      case 'pickup_due':
      case 'overdue':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'sent') return true; // Already filtered by endpoint
    if (filter === 'unread') return !n.isRead;
    if (filter === 'action-required') return n.requiresAction;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const actionRequiredCount = notifications.filter(n => n.requiresAction).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الإشعارات</h1>
          <p className="text-gray-600">
            {unreadCount > 0 && (
              <span className="text-blue-600 font-semibold">{unreadCount} غير مقروء</span>
            )}
            {actionRequiredCount > 0 && (
              <span className="text-orange-600 font-semibold mr-3">
                {actionRequiredCount} يتطلب إجراء
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إنشاء إشعار
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            تحديد الكل كمقروء
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            setFilter('all');
            fetchNotifications();
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          الكل ({filter === 'all' ? notifications.length : 0})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          غير مقروء ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('action-required')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'action-required'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          يتطلب إجراء ({actionRequiredCount})
        </button>
        <button
          onClick={() => {
            setFilter('sent');
            setLoading(true);
            api.get('/notifications/sent').then(({ data }) => {
              setNotifications(data.notifications || []);
              setLoading(false);
            }).catch((error) => {
              console.error('Failed to fetch sent notifications:', error);
              toast.error('فشل تحميل الإشعارات المرسلة');
              setLoading(false);
            });
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'sent'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          المرسلة ({filter === 'sent' ? notifications.length : 0})
        </button>
      </div>

      {/* Notifications List */}
      <div className="card">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <span className="text-3xl">{getTypeIcon(notification.type)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{notification.title}</h3>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{notification.message}</p>
                      </div>

                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getTypeColor(notification.type)}`}>
                        {getTypeLabel(notification.type)}
                      </span>
                    </div>

                    {/* Additional Data */}
                    {notification.data && (
                      <div className="bg-gray-100 rounded p-2 mb-2 text-sm text-gray-700">
                        {notification.data}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="تحديد كمقروء"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        {notification.requiresAction && (
                          <button
                            onClick={() => setSelectedNotification(notification)}
                            className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            الرد
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedNotification(notification)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">تفاصيل الإشعار</h2>
              <button
                onClick={() => {
                  setSelectedNotification(null);
                  setResponseMessage('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type Badge */}
              <div className="flex items-center gap-2">
                <span className="text-3xl">{getTypeIcon(selectedNotification.type)}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(selectedNotification.type)}`}>
                  {getTypeLabel(selectedNotification.type)}
                </span>
              </div>

              {/* Title & Message */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedNotification.title}</h3>
                <p className="text-gray-700">{selectedNotification.message}</p>
              </div>

              {/* Additional Data */}
              {selectedNotification.data && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">معلومات إضافية:</p>
                  <p className="text-sm text-gray-600">{selectedNotification.data}</p>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-sm text-gray-500">
                التاريخ: {new Date(selectedNotification.createdAt).toLocaleString('en-GB', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>

              {/* Response Section */}
              {selectedNotification.requiresAction && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الرد على الطلب: *
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="اكتب رسالة الرد هنا..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    يجب كتابة رسالة قبل إرسال الرد
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedNotification.requiresAction ? (
                  <>
                    <button
                      onClick={() => handleAcknowledge(selectedNotification)}
                      disabled={!responseMessage.trim()}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      إرسال الرد
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNotification(null);
                        setResponseMessage('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    {!selectedNotification.isRead && (
                      <button
                        onClick={() => {
                          handleMarkAsRead(selectedNotification.id);
                          setSelectedNotification(null);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        تحديد كمقروء
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      إغلاق
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">إنشاء إشعار جديد</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Recipient Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    المستلمون
                    {currentUser?.role?.name !== 'Admin' && currentUser?.role?.name !== 'Manager' && (
                      <span className="text-xs text-gray-500 mr-2">(يمكن اختيار مستلم واحد فقط)</span>
                    )}
                  </label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {users.map(user => (
                      <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRecipients.includes(user.id)}
                          onChange={(e) => {
                            if (currentUser?.role?.name !== 'Admin' && currentUser?.role?.name !== 'Manager') {
                              // Non-admin/non-manager can only select one
                              setSelectedRecipients(e.target.checked ? [user.id] : []);
                            } else {
                              // Admin and Manager can select multiple
                              setSelectedRecipients(prev =>
                                e.target.checked
                                  ? [...prev, user.id]
                                  : prev.filter(id => id !== user.id)
                              );
                            }
                          }}
                          className="ml-3"
                        />
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-gray-500">{user.email} • {user.role.name}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    تم اختيار {selectedRecipients.length} مستلم
                  </p>
                </div>

                {/* Notification Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الإشعار
                  </label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user_message">رسالة عامة</option>
                    <option value="request">طلب</option>
                    <option value="alert">تنبيه</option>
                    <option value="reminder">تذكير</option>
                    <option value="info">معلومة</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان *
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل عنوان الإشعار"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرسالة *
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل تفاصيل الإشعار"
                  />
                </div>

                {/* Requires Action */}
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNotification.requiresAction}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, requiresAction: e.target.checked }))}
                      className="ml-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      يتطلب رد من المستلم
                    </span>
                  </label>
                </div>

                {/* Action Type (if requires action) */}
                {newNotification.requiresAction && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع الإجراء المطلوب
                    </label>
                    <select
                      value={newNotification.actionType}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, actionType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">اختر نوع الإجراء</option>
                      <option value="acknowledge">إقرار</option>
                      <option value="approve">موافقة</option>
                      <option value="confirm">تأكيد</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSendNotification}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  إرسال الإشعار
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
