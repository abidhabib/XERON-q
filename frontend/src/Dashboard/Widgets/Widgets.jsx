import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sidebar } from '../SideBarSection/Sidebar';
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
  HiOutlineCalculator
} from 'react-icons/hi2';
import { HiOfficeBuilding } from 'react-icons/hi';
import MonthlyApprovalsDashboard from '../CompairGraph.jsx/MonthlyApprovalsDashboard';
import SubadminStatsCard from './SubadminStatsCard';

const Widgets = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/dashboard-data`);
        setDashboardData(response.data.dashboardData || {});
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatNumber = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  const widgets = [
    { title: "Today Approved", value: dashboardData.approvedUsersCountToday || 0, icon: <HiOutlineUserGroup /> },
    { title: "Today Received", value: dashboardData.totalReceivedToday || 0, icon: <HiOfficeBuilding /> },
    { title: "Today Withdrawal", value: dashboardData.totalAmountTodayWithdrawal || 0, icon: <HiOutlineCurrencyDollar /> },
    { title: "Today Income", value: dashboardData.todayIncome || 0, icon: <HiOutlineArrowTrendingUp /> },
    { title: "Approved Users", value: dashboardData.approvedUsersCount || 0, icon: <HiOutlineUserCircle /> },
    { title: "Total Received", value: dashboardData.totalReceived || 0, icon: <HiOutlineBanknotes /> },
    { title: "Total Income", value: dashboardData.totalIncome || 0, icon: <HiOutlineChartBar /> },
    { title: "Total Withdrawal", value: dashboardData.totalWithdrawal || 0, icon: <HiOutlineCurrencyDollar /> },
    { title: "Backend Wallet", value: dashboardData.backend_wallet || 0, icon: <HiOutlineCalculator /> },
    { title: "User Balance", value: dashboardData.users_balance || 0, icon: <HiOutlineScale /> },
    { title: "User Bonus", value: dashboardData.users_bonus || 0, icon: <HiOutlineGift /> },
    { title: "Will Give", value: dashboardData.will_give || 0, icon: <HiOutlineArrowTrendingDown /> },
    {
      title: "Difference",
      value: (dashboardData.will_give || 0) - (dashboardData.users_balance || 0) - (dashboardData.backend_wallet || 0),
      icon: <HiOutlineClock />
    },
    { title: "Pending Users", value: dashboardData.unapprovedUnpaidUsersCount || 0, icon: <HiOutlineClock /> }
  ];

  return (
   <>
    <h1 className="text-xl font-bold text-gray-800 mb-4">Dashboard Overview</h1>

    {loading ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 14 }).map((_, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gray-200 rounded-md p-2 w-8 h-8"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-300 rounded w-10"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {widgets.map((widget, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 min-h-[100px]"
            >
              <div className="flex items-start sm:items-center space-x-2">
                <div className="bg-indigo-50 text-indigo-600 rounded-md p-2">
                  {React.cloneElement(widget.icon, { className: "w-4 h-4" })}
                </div>
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-600 break-words whitespace-normal">
                    {widget.title}
                  </div>
                  <div className="text-base sm:text-lg font-bold text-gray-800">
                    {formatNumber(widget.value)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {dashboardData?.subadminApprovals?.length > 0 && (
          <section className="mt-8" aria-labelledby="subadmin-stats-title">
            <h2 id="subadmin-stats-title" className="text-lg font-semibold text-gray-800 mb-4">
              Subadmin Withdrawal Stats
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dashboardData.subadminApprovals.map((admin) => (
                <SubadminStatsCard 
                  key={admin.subadminId || admin.subadmin} 
                  admin={admin}
                />
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <MonthlyApprovalsDashboard />
        </div>
      </>
    )}
  </>
  );
};

export default Widgets;
