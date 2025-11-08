import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, User, FileText, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { usePostNotifications } from '../../hooks/usePostNotifications';
import { useAuth } from '../../contexts/AuthContext';
import API_CONFIG from '../../config/api';
import Navbar from '../Navbar/Navbar';

const Notifications = () => {
  const { token, user } = useAuth();
  const { notifications } = usePostNotifications(token, user?._id);
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch all notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      
      try {
        const res = await fetch(API_CONFIG.getApiUrl('/notifications'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setAllNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  // Merge real-time notifications with fetched ones
  useEffect(() => {
    if (notifications.length > 0) {
      setAllNotifications(prev => {
        const newNotifs = notifications.filter(
          n => !prev.some(p => p._id === n._id)
        );
        return [...newNotifs, ...prev];
      });
    }
  }, [notifications]);

  const markAsRead = async (notificationId) => {
    try {
      await fetch(API_CONFIG.getApiUrl(`/notifications/${notificationId}/read`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      setAllNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(API_CONFIG.getApiUrl('/notifications/read-all'), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(API_CONFIG.getApiUrl(`/notifications/${notificationId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      setAllNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    
    // Navigate based on notification type
    if (notification.type === 'new_post' && notification.relatedPostId) {
      navigate(`/discover`);
    } else if (notification.type === 'like' && notification.relatedPostId) {
      navigate(`/discover`);
    } else if (notification.type === 'comment' && notification.relatedPostId) {
      navigate(`/discover`);
    } else if (notification.type === 'follow' && notification.relatedUserId) {
      navigate(`/profile`);
    } else {
      navigate('/profile');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_post':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-4 flex justify-center">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Bell className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-sm text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </p>
                </div>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <Check className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {allNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-500">When you get notifications, they'll show up here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`bg-white rounded-xl shadow-sm border transition-all cursor-pointer group ${
                    notification.read
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-purple-200 bg-purple-50/30 hover:border-purple-300'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-4 flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      notification.read ? 'bg-gray-100' : 'bg-white'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${
                        notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;

