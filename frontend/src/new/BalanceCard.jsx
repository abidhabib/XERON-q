import React from 'react';
import { useContext } from 'react';
import { UserContext } from '../UserContext/UserContext';
import {
  Wallet,
  Send,
  Users,
  Bell,
  Shield,
  Receipt
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { RemoveTrailingZeros } from '../../utils/utils';

function BalanceCard() {
  const {
    NewName,
    currBalance,
    backend_wallet,
    total_withdrawal,
    unreadCount,
    markAllNotificationsAsRead,
    Userid,
    level
  } = useContext(UserContext);

  const navigate = useNavigate();
  const location = useLocation();
  const isOnWalletPage = location.pathname === '/wallet';
  const isOnAlertsPage = location.pathname === '/alerts';

  const toWithdraw = () => {
    navigate('/cashout');
  };

  const handleAlertClick = async (e) => {
    e.preventDefault();
    if (!isOnAlertsPage && unreadCount > 0 && Userid && markAllNotificationsAsRead) {
      try {
        await markAllNotificationsAsRead(Userid);
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    }
    navigate('/alerts');
  };

  const menuItems = [
    {
      name: 'Wallet',
      link: isOnWalletPage ? '#' : '/cashout',
      icon: <Wallet size={20} className="text-[#848e9c]" />,
      label: 'Dashboard Home',
      onClick: isOnWalletPage ? toWithdraw : null,
      isAction: isOnWalletPage,
      actionIcon: <Send size={20} className="text-[#848e9c]" />
    },
    { name: 'Salary', link: '/week-salary', icon: <Receipt size={20} className="text-[#848e9c]" />, label: 'Salary' },
    { name: 'Team', link: '/team', icon: <Users size={20} className="text-[#848e9c]" />, label: 'View Team' },
    {
      name: 'Alert',
      link: '/alerts',
      icon: <Bell size={20} className="text-[#848e9c]" />,
      label: 'View Notifications',
      onClick: handleAlertClick
    },
  ];

  const progress = backend_wallet ? Math.min(Math.round((backend_wallet / 3) * 100), 100) : 0;

  const [balanceLoaded, setBalanceLoaded] = React.useState(false);
  React.useEffect(() => {
    setBalanceLoaded(true);
  }, [currBalance]);

  return (
    <div className="bg-[#1E2329] rounded-b-2xl p-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#EAECEF] text-base font-semibold flex items-center gap-2">
          {NewName || 'User'}
          <span className="relative w-5 h-5 flex items-center justify-center">
            <Shield size={20} className="text-[#F0B90B]" strokeWidth={2} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#1E2329]">
              {level || 1}
            </span>
          </span>
        </p>
        <span className="text-xs font-medium text-[#F0B90B] py-1 px-2.5 bg-[#F0B90B]/10 rounded-full">
          {progress}% Progress
        </span>
      </div>

      {/* Balance */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className={`text-[#EAECEF] text-[28px] font-semibold leading-tight tracking-tight transition-all duration-700 ${balanceLoaded ? 'opacity-100' : 'opacity-0'}`}>
            ${RemoveTrailingZeros(currBalance)}
          </p>
          <p className="text-[11px] text-[#5E6673] mt-1 tracking-wide uppercase font-medium">Available Balance</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[#B7BDC6] text-xl font-semibold tracking-tight">
            ${RemoveTrailingZeros(total_withdrawal)}
          </p>
          <p className="text-[11px] text-[#5E6673] mt-1 tracking-wide uppercase font-medium">Total Cashout</p>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-4 gap-2">
        {menuItems.map((item, index) => {
          if (item.isAction) {
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#2B3139] active:bg-[#2B3139]/80 transition-colors"
                aria-label="Send to Cashout"
              >
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#2B3139]">
                  {item.actionIcon}
                </div>
                <span className="text-[11px] font-medium text-[#EAECEF]">Send</span>
              </button>
            );
          }

          if (item.name === 'Alert') {
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#2B3139] active:bg-[#2B3139]/80 transition-colors"
                aria-label={item.label}
              >
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#2B3139] relative">
                  {item.icon}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-[#F6465D] rounded-full text-[10px] font-bold text-white px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[#848e9c]">{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={index}
              to={item.link}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#2B3139] active:bg-[#2B3139]/80 transition-colors"
              aria-label={item.label}
            >
              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#2B3139]">
                {item.icon}
              </div>
              <span className="text-[11px] font-medium text-[#848e9c] group-hover:text-[#EAECEF]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default BalanceCard;