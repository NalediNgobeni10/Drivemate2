import React, { useEffect, useState } from 'react';
import { Bell, Check, AlertCircle, Loader, Calendar, MessageSquare, Star, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../lib/api';
import type { Notification } from '../types';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationsAPI.getAll();
        setNotifications(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return <Calendar size={20} className="text-emerald-400" />;
      case 'lesson_reminder':
        return <Calendar size={20} className="text-amber-400" />;
      case 'feedback_received':
        return <Star size={20} className="text-purple-400" />;
      case 'message_received':
        return <MessageSquare size={20} className="text-blue-400" />;
      case 'payment_received':
        return <CreditCard size={20} className="text-green-400" />;
      default:
        return <Bell size={20} className="text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Notifications
          </h1>
          <p className="text-slate-400">Stay updated with your bookings, reminders, and messages</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No notifications yet</p>
              <p className="text-slate-500 text-sm mt-2">We'll notify you about important updates</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition ${
                    notification.isRead
                      ? 'bg-slate-700/30 border-slate-600'
                      : 'bg-emerald-500/10 border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-semibold">{notification.title}</p>
                          <p className="text-slate-400 text-sm mt-1">{notification.message}</p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition"
                            title="Mark as read"
                          >
                            <Check size={18} />
                          </button>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
