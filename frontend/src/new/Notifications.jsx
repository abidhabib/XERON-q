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
        `<span class="text-[#F0B90B] font-semibold">${amountMatch[0]}</span>`
      );
    }
    if (approvedMatch) {
      highlightedMsg = highlightedMsg.replace(
        /approved/gi,
        '<span class="text-emerald-600 font-semibold">approved</span>'
      );
    }

    return <span dangerouslySetInnerHTML={{ __html: highlightedMsg }} />;
  };

  const getNotificationStyle = (msg) => {
    const lowerMsg = msg.toLowerCase();
    if (/approved|success|congrat|completed/i.test(lowerMsg)) {
      return { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, dot: 'bg-emerald-500' };
    } else if (/pending|waiting|processing/i.test(lowerMsg)) {
      return { icon: <Clock className="w-4 h-4 text-amber-500" />, dot: 'bg-amber-500' };
    } else if (/reject|error|fail|declined/i.test(lowerMsg)) {
      return { icon: <AlertCircle className="w-4 h-4 text-rose-500" />, dot: 'bg-rose-500' };
    } else if (/info|update|notice/i.test(lowerMsg)) {
      return { icon: <Info className="w-4 h-4 text-blue-500" />, dot: 'bg-blue-500' };
    }
    return { icon: <Bell className="w-4 h-4 text-[#C5C8CE]" />, dot: 'bg-[#C5C8CE]' };
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
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="pt-0 pb-3">
        <BalanceCard />
      </div>

      <div className="px-3 py-3">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-[#F0F0F0] border border-[#E6E8EB] flex items-center justify-center">
                <Bell className="w-[18px] h-[18px] text-[#F0B90B]" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-5 h-5 bg-[#F0B90B] rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[9px] font-bold text-[#1E2026] leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#1E2026] tracking-tight">Notifications</h1>
              <p className="text-xs text-[#707A8A] mt-0.5">
                {notifications.length} total • {unreadCount} unread
              </p>
            </div>
          </div>

          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              unreadCount > 0 && !isLoading
                ? 'text-[#F0B90B] hover:text-[#E5AC00] hover:bg-[#F0B90B]/10'
                : 'text-[#C5C8CE] cursor-not-allowed'
            }`}
          >
            <BiSolidCheckboxChecked className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border border-[#E6E8EB] animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F0F0]"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-[#F0F0F0] rounded w-4/5"></div>
                    <div className="h-2.5 bg-[#F0F0F0] rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E6E8EB]">
              <div className="w-12 h-12 mx-auto bg-[#F5F5F5] rounded-xl flex items-center justify-center mb-3 border border-[#E6E8EB]">
                <Bell className="w-5.5 h-5.5 text-[#C5C8CE]" />
              </div>
              <h3 className="text-base font-semibold text-[#1E2026] mb-0.5">All caught up</h3>
              <p className="text-[#707A8A] text-xs">No new notifications</p>
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
                    className={`bg-white rounded-xl overflow-hidden border border-[#E6E8EB] ${
                      isUnread ? 'shadow-sm' : ''
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          isUnread ? 'bg-[#F5F5F5]' : 'bg-[#FAFAFA]'
                        }`}>
                          {style.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[#1E2026] text-sm leading-relaxed">
                              {renderMessage(notification.msg)}
                            </p>
                            {isUnread && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="flex-shrink-0 text-[#C5C8CE] hover:text-[#707A8A] transition-colors p-0.5 -mt-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[#707A8A] text-xs">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {isUnread && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>}
                              <ChevronRight className="w-3 h-3 text-[#C5C8CE]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isUnread && (
                      <div className="h-px bg-gradient-to-r from-[#F0B90B]/20 to-transparent" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && !isLoading && (
          <div className="mt-5 pt-3 border-t border-[#E6E8EB]">
            <div className="flex items-center justify-between text-[#707A8A] text-xs">
              <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F0B90B]"></span>
                    <span>{unreadCount} unread</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
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