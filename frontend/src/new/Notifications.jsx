import React, { useEffect, useState, useContext } from 'react';
import {
  Clock,
  AlertCircle,
  Bell,
  X,
  Info,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserContext } from '../UserContext/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import BalanceCard from './BalanceCard';
import { BiSolidCheckboxChecked } from 'react-icons/bi';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    Userid: userId, 
    unreadCount, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setUnreadCount 
  } = useContext(UserContext);

  // ✅ Enhanced message rendering with inline highlights
  const renderMessage = (msg) => {
    // Match amount: $123.45 or $1,234.56
    const amountMatch = msg.match(/\$(\d{1,3}(,\d{3})*(\.\d{2})?)/);
    // Match "approved"
    const approvedMatch = /approved/i.test(msg);

    if (!amountMatch && !approvedMatch) {
      return <span>{msg}</span>;
    }

    let highlightedMsg = msg;
    if (amountMatch) {
      highlightedMsg = highlightedMsg.replace(
        amountMatch[0],
        `<span class="text-[#D4AF37] font-medium">${amountMatch[0]}</span>`
      );
    }
    if (approvedMatch) {
      highlightedMsg = highlightedMsg.replace(
        /approved/gi,
        '<span class="text-emerald-400 font-medium">approved</span>'
      );
    }

    return <span dangerouslySetInnerHTML={{ __html: highlightedMsg }} />;
  };

  const getNotificationStyle = (msg) => {
    const lowerMsg = msg.toLowerCase();
    if (/approved|success|congrat|completed/i.test(lowerMsg)) {
      return { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, dot: 'bg-emerald-400' };
    } else if (/pending|waiting|processing/i.test(lowerMsg)) {
      return { icon: <Clock className="w-4 h-4 text-[#D4AF37]" />, dot: 'bg-[#D4AF37]' };
    } else if (/reject|error|fail|declined/i.test(lowerMsg)) {
      return { icon: <AlertCircle className="w-4 h-4 text-rose-400" />, dot: 'bg-rose-400' };
    } else if (/info|update|notice/i.test(lowerMsg)) {
      return { icon: <Info className="w-4 h-4 text-blue-400" />, dot: 'bg-blue-400' };
    }
    return { icon: <Bell className="w-4 h-4 text-gray-400" />, dot: 'bg-gray-400' };
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${userId}`);
      const data = await response.json();
      if (data?.status === 'success') {
        const sortedNotifications = (data.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setNotifications(sortedNotifications);
        setUnreadCount(sortedNotifications.filter(n => n.is_read === 0).length || 0);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isLoading) return;
    try {
      await markAllNotificationsAsRead(userId);
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
      <div className="pt-0 pb-3">
        <BalanceCard />
      </div>

      <div className="px-3 py-3">
        {/* Header - tighter spacing */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-[#19202a] flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-[#D4AF37]" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-4.5 h-4.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-900 leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">Notifications</h1>
              <p className="text-xs text-[#D4AF37]/60 mt-0.5">
                {notifications.length} total • {unreadCount} unread
              </p>
            </div>
          </div>
          
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              unreadCount > 0 && !isLoading
                ? 'text-[#D4AF37] hover:text-[#e8c04e] hover:bg-[#1c2a3a]'
                : 'text-[#D4AF37]/50 cursor-not-allowed'
            }`}
          >
            <BiSolidCheckboxChecked className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>

        {/* Notifications List - compact & premium */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#19202a] rounded-xl p-3 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#26303b]"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-[#26303b] rounded w-4/5"></div>
                    <div className="h-2.5 bg-[#26303b] rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="bg-[#19202a] rounded-2xl p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-[#1c2a3a] rounded-xl flex items-center justify-center mb-3">
                <Bell className="w-5.5 h-5.5 text-[#D4AF37]/40" />
              </div>
              <h3 className="text-base font-medium text-white mb-0.5">All caught up</h3>
              <p className="text-[#D4AF37]/60 text-xs">No new notifications</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.msg);
                const isUnread = notification.is_read === 0;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="bg-[#19202a] rounded-xl overflow-hidden"
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#1c2a3a] flex items-center justify-center">
                          {style.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-white text-sm leading-relaxed">
                              {renderMessage(notification.msg)}
                            </p>
                            {isUnread && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="flex-shrink-0 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors p-0.5 -mt-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[#D4AF37]/60 text-xs">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              {isUnread && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>}
                              <ChevronRight className="w-3 h-3 text-[#D4AF37]/50" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {isUnread && (
                      <div className="h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer - subtle */}
        {notifications.length > 0 && !isLoading && (
          <div className="mt-5 pt-3 border-t border-[#26303b]/40">
            <div className="flex items-center justify-between text-[#D4AF37]/60 text-xs">
              <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 ? (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[#D4AF37]"></span>
                    <span>{unreadCount} unread</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
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