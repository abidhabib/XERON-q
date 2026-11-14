/* eslint-disable react/prop-types */
import { useEffect, useState, useContext } from 'react';
import { Clock, AlertCircle, Bell, Info, CheckCircle, Check, BriefcaseBusiness, CalendarDays, ShieldCheck, Users, BellDot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { Userid: userId, unreadCount, markNotificationAsRead, markAllNotificationsAsRead, setUnreadCount, NewName, currBalance, total_withdrawal, backend_wallet } = useContext(UserContext);
  const navigate = useNavigate();
  const accountProgress = backend_wallet ? Math.min(Math.round((Number(backend_wallet) / 3) * 100), 100) : 0;
  const available = Number(currBalance || 0).toFixed(1).replace(/\.0$/, '');
  const cashout = Number(total_withdrawal || 0).toFixed(1).replace(/\.0$/, '');

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
    <div className="min-h-dvh bg-[#f5f5f4]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="mx-auto min-h-dvh max-w-md overflow-hidden bg-[#f5f5f4]">
        <header className="min-h-[300px] rounded-b-[14px] bg-[#20262d] px-[25px] pt-[14px] shadow-[0_8px_20px_rgba(22,28,35,0.16)]">
          <NavBar />
          <div className="mt-[25px] flex items-center justify-between gap-3"><p className="flex min-w-0 items-center gap-1.5 truncate text-[15px] font-semibold text-white"><span className="truncate">{NewName || 'Member'}</span><ShieldCheck size={17} className="shrink-0 text-[#e3b900]" /></p><span className="shrink-0 rounded-full bg-[#4c4330] px-2.5 py-1 text-[10px] font-semibold text-[#f5c927]">{accountProgress}% Progress</span></div>
          <div className="mt-[18px] grid grid-cols-2"><div><p className="text-[27px] font-semibold leading-none tracking-[-0.04em] text-white"><span className="mr-0.5 text-[20px] text-[#dce4ee]">$</span>{available}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[#8191a5]">Available balance</p></div><div className="pt-[8px] text-right"><p className="text-[19px] font-semibold leading-none tracking-[-0.03em] text-[#c7d1dc]"><span className="mr-0.5 text-[14px]">$</span>{cashout}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[#8191a5]">Total cashout</p></div></div>
          <div className="mt-[31px] grid grid-cols-4 gap-5">{[["Wallet", BriefcaseBusiness, "/wallet"], ["Salary", CalendarDays, "/SalaryofMonth"], ["Team", Users, "/team"], ["Alert", Bell, "/alerts"]].map(([label, Icon, path]) => <button key={label} type="button" onClick={() => navigate(path)} className="flex min-w-0 flex-col items-center gap-1.5 text-[#93a1b3]"><span className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#303943]"><Icon size={19} strokeWidth={2} /></span><span className="text-[10px] font-medium">{label}</span></button>)}</div>
        </header>
      <main className="pb-8">
        <div className="relative mx-auto max-w-md px-4 pt-3">

          {/* Header */}
          <div className="rise relative flex items-center justify-between gap-3">
              <div className="relative flex-shrink-0">
               
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C6A15B] flex items-center justify-center text-[9px] font-bold text-[#161618] ring-2 ring-[#161618]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              <div>
                <h1 className="fi text-[21px] font-semibold text-[#17212b] leading-tight">Notifications</h1>
               
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
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-white shadow-[0_2px_5px_rgba(27,38,49,0.08)]">
                    <div className="w-9 h-9 rounded-lg bg-[#edf1f5] animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-4/5 rounded bg-[#edf1f5] animate-pulse" />
                      <div className="h-2 w-1/3 rounded bg-[#edf1f5] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="rise mt-6 text-center py-12 px-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#fff8df] flex items-center justify-center text-[#c39400] mb-3.5">
                  <Bell size={22} strokeWidth={1.8} />
                </div>
                <h3 className="fi text-[14.5px] font-semibold text-[#17212b]">All caught up</h3>
                <p className="fi text-[12.5px] text-[#7f91a7] mt-1">No new notifications</p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="flex flex-col gap-2">
                  {notifications.map((notification) => {
                    const isUnread = notification.is_read === 0;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => isUnread && handleMarkAsRead(notification.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                          isUnread ? 'bg-white shadow-[0_2px_5px_rgba(27,38,49,0.08)] cursor-pointer' : 'bg-white/60 hover:bg-white'
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[#C6A15B] ${isUnread ? 'bg-[#C6A15B]/10' : 'bg-[#edf1f5]'}`}>
                          <BellDot size={16} strokeWidth={2} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`fi text-[13px] leading-relaxed ${isUnread ? 'text-[#263545]' : 'text-[#718195]'}`}>
                            {renderMessage(notification.msg)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] flex-shrink-0" />}
                            <span className="fi text-[11px] text-[#7f91a7]">
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
    </div>
  );
};

export default NotificationsPage;
