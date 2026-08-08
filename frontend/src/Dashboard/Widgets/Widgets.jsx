import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineBanknotes,
  HiOutlineGift,
  HiOutlineScale,
  HiOutlineClock,
  HiOutlineUserCircle,
  HiOutlineChartBar,
  HiOutlineCalculator,
} from 'react-icons/hi2';
import { HiOfficeBuilding, HiGlobe } from 'react-icons/hi';
import { RefreshCw } from 'lucide-react';

// Widget configuration with color themes
const WIDGET_CONFIG = {
  approvedUsersCountToday: { title: "Today Approved", icon: HiOutlineUserGroup, color: "emerald" },
  totalReceivedToday:      { title: "Today Received", icon: HiOfficeBuilding, color: "blue" },
  totalAmountTodayWithdrawal: { title: "Today Withdrawal", icon: HiOutlineCurrencyDollar, color: "rose" },
  todayIncome:             { title: "Today Income", icon: HiOutlineArrowTrendingUp, color: "emerald" },
  approvedUsersCount:      { title: "Approved Users", icon: HiOutlineUserCircle, color: "indigo" },
  totalReceived:           { title: "Total Received", icon: HiOutlineBanknotes, color: "blue" },
  totalIncome:             { title: "Total Income", icon: HiOutlineChartBar, color: "emerald" },
  totalWithdrawal:         { title: "Total Withdrawal", icon: HiOutlineCurrencyDollar, color: "rose" },
  webBackendEarnings:      { title: "Web Backend Earnings", icon: HiGlobe, color: "violet", isCurrency: true, highlight: true },
  backend_wallet:          { title: "Backend Wallet", icon: HiOutlineCalculator, color: "slate" },
  users_balance:           { title: "User Balance", icon: HiOutlineScale, color: "amber" },
  users_bonus:             { title: "User Bonus", icon: HiOutlineGift, color: "pink" },
  will_give:               { title: "Will Give", icon: HiOutlineArrowTrendingDown, color: "orange" },
  difference:              { title: "Difference", icon: HiOutlineClock, color: "cyan", isComputed: true },
  unapprovedUnpaidUsersCount: { title: "Pending Users", icon: HiOutlineClock, color: "gray" },
};

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-100' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-100' },
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-100' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-100' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-100' },
  cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-100' },
  gray:    { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-100' },
};

const formatNumber = (value, isCurrency = false) => {
  const num = parseFloat(value);
  if (isNaN(num)) return isCurrency ? "$0.00" : "0";
  if (isCurrency) {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // For counts, show integers; for monetary values, show decimals
  return num % 1 === 0 
    ? num.toLocaleString('en-US') 
    : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const WidgetCard = ({ config, value, onClick }) => {
  const colors = COLOR_MAP[config.color] || COLOR_MAP.gray;
  const Icon = config.icon;
  const isHighlight = config.highlight;

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 rounded-2xl transition-all duration-200 min-h-[90px] flex flex-col justify-center cursor-pointer select-none
        ${isHighlight 
          ? `${colors.bg} border-2 ${colors.border} shadow-md hover:shadow-lg hover:scale-[1.02]` 
          : `bg-white border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-zinc-200`
        }
      `}
    >
     
      
      <div className="flex items-center space-x-2.5">
        <div className={`${colors.bg} ${colors.text} rounded-xl p-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-xs font-semibold leading-tight truncate ${isHighlight ? colors.text : 'text-zinc-500'}`}>
            {config.title}
          </span>
          <span className={`text-base sm:text-lg font-bold tracking-tight mt-0.5 truncate ${isHighlight ? 'text-zinc-900' : 'text-zinc-900'}`}>
            {formatNumber(value, config.isCurrency)}
          </span>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-zinc-50 rounded-2xl p-3 animate-pulse min-h-[90px] border border-zinc-100">
    <div className="flex items-center space-x-3">
      <div className="bg-zinc-200 rounded-xl w-9 h-9"></div>
      <div className="space-y-2 flex-1">
        <div className="h-2.5 bg-zinc-200 rounded-md w-3/4"></div>
        <div className="h-4 bg-zinc-300 rounded-md w-1/2"></div>
      </div>
    </div>
  </div>
);

const Widgets = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/dashboard-data`);
      setDashboardData(response.data.dashboardData || {});
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => fetchData(true);

  // Build ordered widget list with computed values
  const widgetKeys = [
    'approvedUsersCountToday', 'totalReceivedToday', 'totalAmountTodayWithdrawal', 'todayIncome',
    'approvedUsersCount', 'totalReceived', 'totalIncome', 'totalWithdrawal',
    'webBackendEarnings', 'backend_wallet', 'users_balance',
    'will_give', 'difference', 'unapprovedUnpaidUsersCount'
  ];

  const getWidgetValue = (key) => {
    if (key === 'difference') {
      return (dashboardData.will_give || 0) - (dashboardData.users_balance || 0) - (dashboardData.backend_wallet || 0);
    }
    return dashboardData[key] ?? 0;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Dashboard Overview</h1>
          {lastUpdated && (
            <p className="text-xs text-zinc-400 mt-0.5">
              Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 30s
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-3 py-2 text-sm font-medium bg-white border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 15 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {widgetKeys.map((key) => {
            const config = WIDGET_CONFIG[key];
            if (!config) return null;
            return (
              <WidgetCard
                key={key}
                config={config}
                value={getWidgetValue(key)}
                onClick={handleRefresh}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Widgets;