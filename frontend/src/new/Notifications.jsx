import React, { useEffect, useState, useContext } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Bell, 
  X, 
  Info,
  ChevronRight
} from 'react-feather';
import { formatDistanceToNow } from 'date-fns';
import { UserContext } from '../UserContext/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import NavBAr from '../NavBAr';
import BalanceCard from './BalanceCard';
import { BiSolidCheckboxChecked } from 'react-icons/bi';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { Userid: userId } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);

  const getNotificationStyle = (msg) => {
    const lowerMsg = msg.toLowerCase();
    
    if (/approved|success|congrat|completed/i.test(lowerMsg)) {
      return {
        icon: <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />,
        accent: 'emerald',
        bg: 'bg-white',
        border: 'border border-gray-100',
        dot: 'bg-emerald-500',
        iconBg: 'bg-emerald-50',
        titleColor: 'text-gray-900',
        timeColor: 'text-gray-500'
      };
    } else if (/pending|waiting|processing/i.test(lowerMsg)) {
      return {
        icon: <Clock className="w-4.5 h-4.5 text-amber-600" />,
        accent: 'amber',
        bg: 'bg-white',
        border: 'border border-gray-100',
        dot: 'bg-amber-500',
        iconBg: 'bg-amber-50',
        titleColor: 'text-gray-900',
        timeColor: 'text-gray-500'
      };
    } else if (/reject|error|fail|declined/i.test(lowerMsg)) {
      return {
        icon: <AlertCircle className="w-4.5 h-4.5 text-rose-600" />,
        accent: 'rose',
        bg: 'bg-white',
        border: 'border border-gray-100',
        dot: 'bg-rose-500',
        iconBg: 'bg-rose-50',
        titleColor: 'text-gray-900',
        timeColor: 'text-gray-500'
      };
    } else if (/info|update|notice/i.test(lowerMsg)) {
      return {
        icon: <Info className="w-4.5 h-4.5 text-blue-600" />,
        accent: 'blue',
        bg: 'bg-white',
        border: 'border border-gray-100',
        dot: 'bg-blue-500',
        iconBg: 'bg-blue-50',
        titleColor: 'text-gray-900',
        timeColor: 'text-gray-500'
      };
    }
    
    return {
      icon: <Bell className="w-4.5 h-4.5 text-gray-600" />,
      accent: 'gray',
      bg: 'bg-white',
      border: 'border border-gray-100',
      dot: 'bg-gray-400',
      iconBg: 'bg-gray-50',
      titleColor: 'text-gray-900',
      timeColor: 'text-gray-500'
    };
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${userId}`);
      const data = await response.json();
      
      if (data?.status === 'success') {
        const sortedNotifications = (data.data || []).sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setNotifications(sortedNotifications);
        setUnreadCount(sortedNotifications.filter(n => n.is_read === 0).length || 0);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
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
    if (unreadCount === 0 || isLoading) return;
    
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
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBAr />
      </div>

      {/* Main Content - Starting below Navbar */}
      <div className="pt-16">
        {/* Balance Card */}
        <div className="pt- pb-4">
          <BalanceCard />
        </div>

        {/* Notifications Container */}
        <div className="px-4 md:px-6 py-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <div className="relative">
                      <div className="w-5 h-5 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Notifications
                </h1>
                <p className="text-sm text-gray-500">
                  {notifications.length} total • {unreadCount} unread
                </p>
              </div>
            </div>
            
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || isLoading}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                unreadCount > 0 && !isLoading
                  ? 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <BiSolidCheckboxChecked className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            {isLoading ? (
              // Skeleton Loaders
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              // Empty State
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
                  <Bell className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
                <p className="text-gray-500 text-sm">
                  You don't have any notifications right now.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {notifications.map((notification) => {
                  const style = getNotificationStyle(notification.msg);
                  const isUnread = notification.is_read === 0;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`${style.bg} ${style.border} rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200`}
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Icon Container */}
                          <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${style.iconBg} flex items-center justify-center`}>
                            {style.icon}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`${style.titleColor} text-sm font-medium leading-tight pr-2`}>
                                {notification.msg}
                              </p>
                              {isUnread && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="flex-shrink-0 text-gray-300 hover:text-gray-400 transition-colors p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-1.5">
                              <span className={`${style.timeColor} text-xs`}>
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {isUnread && (
                                  <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                                )}
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Unread Indicator Line */}
                      {isUnread && (
                        <div className="h-0.5 bg-gradient-to-r from-gray-900 via-gray-700 to-transparent rounded-b-xl"></div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Footer Stats */}
          {notifications.length > 0 && !isLoading && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{unreadCount} unread</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>All read</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;