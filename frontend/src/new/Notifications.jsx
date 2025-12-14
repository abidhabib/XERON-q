import React, { useEffect, useState, useContext } from 'react';
import {
  Clock,
  AlertCircle,
  Bell,
  X,
  Info,
  ChevronRight,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserContext } from '../UserContext/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import BalanceCard from './BalanceCard';
import { BiSolidCheckboxChecked } from 'react-icons/bi';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get from context - FIXED: removed setLocalUnreadCount which doesn't exist
  const { 
    Userid: userId, 
    unreadCount, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchGlobalNotifications,
    setUnreadCount 
  } = useContext(UserContext);

  const getNotificationStyle = (msg) => {
    const lowerMsg = msg.toLowerCase();
    
    if (/approved|success|congrat|completed/i.test(lowerMsg)) {
      return {
        icon: <Check className="w-4.5 h-4.5 text-emerald-400" />,
        dot: 'bg-emerald-400',
        titleColor: 'text-white',
        timeColor: 'text-[#D4AF37]/70'
      };
    } else if (/pending|waiting|processing/i.test(lowerMsg)) {
      return {
        icon: <Clock className="w-4.5 h-4.5 text-[#D4AF37]" />,
        dot: 'bg-[#D4AF37]',
        titleColor: 'text-white',
        timeColor: 'text-[#D4AF37]/70'
      };
    } else if (/reject|error|fail|declined/i.test(lowerMsg)) {
      return {
        icon: <AlertCircle className="w-4.5 h-4.5 text-rose-400" />,
        dot: 'bg-rose-400',
        titleColor: 'text-white',
        timeColor: 'text-[#D4AF37]/70'
      };
    } else if (/info|update|notice/i.test(lowerMsg)) {
      return {
        icon: <Info className="w-4.5 h-4.5 text-blue-400" />,
        dot: 'bg-blue-400',
        titleColor: 'text-white',
        timeColor: 'text-[#D4AF37]/70'
      };
    }
    
    return {
      icon: <Bell className="w-4.5 h-4.5 text-gray-400" />,
      dot: 'bg-gray-400',
      titleColor: 'text-white',
      timeColor: 'text-[#D4AF37]/70'
    };
  };

  // Fetch detailed notifications for this page
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
        // Update global count from context
        const unread = sortedNotifications.filter(n => n.is_read === 0).length || 0;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle mark as read - using context function
  const handleMarkAsRead = async (id) => {
    try {
      // Use context function
      await markNotificationAsRead(id);
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: 1 } : n
      ));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  // Handle mark all as read - using context function
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isLoading) return;
    
    try {
      // Use context function
      await markAllNotificationsAsRead(userId);
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
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
    <div className="min-h-screen bg-[#111827]">
      {/* Balance Card - No need to pass prop since it uses context */}
      <div className="pt-0 pb-4">
        <BalanceCard />
      </div>

      {/* Notifications Container */}
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#19202a] flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#D4AF37]" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-5 h-5 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Notifications</h1>
              <p className="text-sm text-[#D4AF37]/70">
                {notifications.length} total • {unreadCount} unread
              </p>
            </div>
          </div>
          
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isLoading}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              unreadCount > 0 && !isLoading
                ? 'text-[#D4AF37] hover:text-[#e8c04e] hover:bg-[#19202a]'
                : 'text-[#D4AF37]/50 cursor-not-allowed'
            }`}
          >
            <BiSolidCheckboxChecked className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-[#19202a] rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#26303b]"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#26303b] rounded w-3/4"></div>
                    <div className="h-3 bg-[#26303b] rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="bg-[#19202a] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-[#1c2a3a] rounded-2xl flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-[#D4AF37]/50" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">All caught up!</h3>
              <p className="text-[#D4AF37]/70 text-sm">
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
                    className="bg-[#19202a] rounded-xl"
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1c2a3a] flex items-center justify-center">
                          {style.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`${style.titleColor} text-sm font-medium leading-tight pr-2`}>
                              {notification.msg}
                            </p>
                            {isUnread && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="flex-shrink-0 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-1.5">
                            <span className={style.timeColor} style={{ fontSize: '0.75rem' }}>
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {isUnread && (
                                <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]/50" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {isUnread && (
                      <div className="h-0.5 bg-gradient-to-r from-[#D4AF37] to-transparent rounded-b-xl" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer Stats */}
        {notifications.length > 0 && !isLoading && (
          <div className="mt-6 pt-4 border-t border-[#26303b]">
            <div className="flex items-center justify-between text-sm text-[#D4AF37]/70">
              <span>
                Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    <span>{unreadCount} unread</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>All read</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;