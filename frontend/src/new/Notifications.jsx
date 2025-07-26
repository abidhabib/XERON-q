import React, { useEffect, useState, useContext } from 'react';
import { CheckCircle, Clock, AlertCircle, Bell, X } from 'react-feather';
import { formatDistanceToNow } from 'date-fns';
import { UserContext } from '../UserContext/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../NavBAr';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { Userid: userId } = useContext(UserContext);

  const getNotificationStyle = (msg) => {
    const lowerMsg = msg.toLowerCase();
    
    if (/approved|success|congrat/i.test(lowerMsg)) {
      return {
        icon: <CheckCircle className="w-5 h-5" />,
        bg: 'bg-green-50',
        border: 'border-l-4 border-green-500',
        dot: 'bg-green-500',
        text: 'text-gray-800'
      };
    } else if (/pending|waiting|processing/i.test(lowerMsg)) {
      return {
        icon: <Clock className="w-5 h-5" />,
        bg: 'bg-amber-50',
        border: 'border-l-4 border-amber-500',
        dot: 'bg-amber-500',
        text: 'text-gray-800'
      };
    } else if (/reject|error|fail/i.test(lowerMsg)) {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        bg: 'bg-red-50',
        border: 'border-l-4 border-red-500',
        dot: 'bg-red-500',
        text: 'text-gray-800'
      };
    }
    
    return {
      icon: <Bell className="w-5 h-5" />,
      bg: 'bg-blue-50',
      border: 'border-l-4 border-blue-500',
      dot: 'bg-blue-500',
      text: 'text-gray-800'
    };
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${userId}`);
      const data = await response.json();
      
      if (data?.status === 'success') {
        setNotifications(data.data || []);
        setUnreadCount(data.data?.filter(n => n.is_read === 0).length || 0);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH'
      });
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: 1 } : n
      ));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${userId}/read-all`, {
        method: 'PATCH'
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-gray-50  max-w-4xl mx-auto">
      {/* Header */}
      <NavBar />
    <div className="p-3">
          <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-sans">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="ml-3 px-2 py-0.5 text-xs font-medium text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
            unreadCount > 0 
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">We'll notify you when something arrives</p>
          </div>
        ) : (
          <ul>
            <AnimatePresence>
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.msg);
                const isUnread = notification.is_read === 0;
                
                return (
                  <motion.li
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`${style.bg} ${style.border} border-b border-gray-100 last:border-b-0`}
                  >
                    <div className="flex items-start p-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isUnread ? 'bg-white' : 'bg-gray-50'} flex items-center justify-center mt-0.5`}>
                        {style.icon}
                      </div>
                      
                      <div className="ml-3 flex-1">
                        <p className={`${style.text} font-medium text-sm`}>
                          {notification.msg}
                        </p>
                        <div className="flex items-center mt-1.5">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          {isUnread && (
                            <span className={`ml-2 w-2 h-2 rounded-full ${style.dot}`}></span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
    </div>
  );
};

export default NotificationsPage;