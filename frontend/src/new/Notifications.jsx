import React, { useEffect, useState, useContext } from 'react';
import { Clock, AlertCircle, Bell, Info, CheckCircle, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserContext } from '../UserContext/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../NavBar';

/* Safe message highlighting (no innerHTML) */
const renderMessage = (msg) => {
  const regex = /(\$(?:\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|\bapproved\b)/gi;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(msg)) !== null) {
    if (match.index > lastIndex) parts.push(<span key={key++}>{msg.slice(lastIndex, match.index)}</span>);
    const token = match[0];
    parts.push(
      token.startsWith('$') ? (
        <span key={key++} className="tnum font-semibold text-[#C6A15B]">{token}</span>
      ) : (
        <span key={key++} className="font-semibold text-[#8FC7A0]">{token}</span>
      )
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < msg.length) parts.push(<span key={key++}>{msg.slice(lastIndex)}</span>);
  return parts.length ? parts : <span>{msg}</span>;
};

const getNotificationStyle = (msg) => {
  const m = msg.toLowerCase();
  if (/approved|success|congrat|completed/.test(m)) return { icon: <CheckCircle size={16} strokeWidth={2} />, tint: 'bg-[#1E2A22]', color: 'text-[#8FC7A0]' };
  if (/pending|waiting|processing/.test(m)) return { icon: <Clock size={16} strokeWidth={2} />, tint: 'bg-[#C6A15B]/10', color: 'text-[#C6A15B]' };
  if (/reject|error|fail|declined/.test(m)) return { icon: <AlertCircle size={16} strokeWidth={2} />, tint: 'bg-[#241619]', color: 'text-[#E2A896]' };
  if (/info|update|notice/.test(m)) return { icon: <Info size={16} strokeWidth={2} />, tint: 'bg-[#212125]', color: 'text-[#A0A0A6]' };
  return { icon: <Bell size={16} strokeWidth={2} />, tint: 'bg-[#212125]', color: 'text-[#A0A0A6]' };
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { Userid: userId, unreadCount, markNotificationAsRead, markAllNotificationsAsRead, setUnreadCount } = useContext(UserContext);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${userId}`);
      const data = await response.json();
      if (data?.status === 'success') {
        const sorted = (data.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setNotifications(sorted);
        setUnreadCount(sorted.filter((n) => n.is_read === 0).length || 0);
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
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isLoading) return;
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
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
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[300px] pb-28 lg:pb-12">
        <div className="relative max-w-2xl mx-auto px-3 sm:px-6 pt-3 lg:pt-10">

          <div className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }} />

          {/* Header */}
          <div className="rise relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-[#C6A15B]/10 ring-1 ring-[#C6A15B]/15 flex items-center justify-center">
                  <Bell size={18} className="text-[#C6A15B]" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C6A15B] flex items-center justify-center text-[9px] font-bold text-[#161618] ring-2 ring-[#161618]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="fd text-[24px] sm:text-[26px] font-medium text-[#EDEDEE] leading-tight">Notifications</h1>
               
              </div>
            </div>
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || isLoading}
             
            >
            </button>
          </div>

          {/* List */}
          <div className="relative mt-4">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04]">
                    <div className="w-9 h-9 rounded-lg bg-[#212125] animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-4/5 rounded bg-[#212125] animate-pulse" />
                      <div className="h-2 w-1/3 rounded bg-[#212125] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="rise mt-6 text-center py-12 px-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#212125] flex items-center justify-center text-[#C6A15B] mb-3.5">
                  <Bell size={22} strokeWidth={1.8} />
                </div>
                <h3 className="fi text-[14.5px] font-semibold text-[#EDEDEE]">All caught up</h3>
                <p className="fi text-[12.5px] text-[#A0A0A6] mt-1">No new notifications</p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="flex flex-col gap-2">
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
                        onClick={() => isUnread && handleMarkAsRead(notification.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors ${
                          isUnread ? 'bg-[#1B1B1E] ring-1 ring-white/[0.05] cursor-pointer' : 'hover:bg-[#1B1B1E]/40'
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.tint} ${style.color}`}>
                          {style.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`fi text-[13px] leading-relaxed ${isUnread ? 'text-[#EDEDEE]' : 'text-[#A0A0A6]'}`}>
                            {renderMessage(notification.msg)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] flex-shrink-0" />}
                            <span className="fi text-[11px] text-[#6F6F76]">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {isUnread && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                            className="flex-shrink-0 p-1.5 rounded-lg text-[#6F6F76] hover:text-[#C6A15B] hover:bg-[#212125] transition-colors"
                            aria-label="Mark as read"
                          >
                            <Check size={14} strokeWidth={2.5} />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </div>

        
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;