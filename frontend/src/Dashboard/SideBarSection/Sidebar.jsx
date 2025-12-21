import React, { useState, useContext, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../../UserContext/UserContext";  
import { useSidebar } from "../SidebarContext";

import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineXCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCash,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiDocumentDuplicate,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCamera,
  HiOutlineAnnotation,
  HiOutlineFilter,
  HiOutlineBell,
} from "react-icons/hi";

export const Sidebar = () => {
  const { setAdminAuthenticated } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();



  // Persist state with useEffect
  const { isMinimized, toggleMinimized } = useSidebar();


  const logout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminTokens");
    setAdminAuthenticated(false);
    navigate("/admin/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path;
  const toggleSidebar = toggleMinimized;

  const menuItems = [
    {
      group: "Dashboard",
      items: [
        { path: "/admin", icon: <HiOutlineViewGrid />, label: "Dashboard" },
      ],
    },
    {
      group: "User Management",
      items: [
        { path: "/users", icon: <HiOutlineUsers />, label: "All Users" },
        { path: "/easypaisa", icon: <HiOutlineCurrencyDollar />, label: "Crypto Users" },
        { path: "/rejecteduser", icon: <HiOutlineXCircle />, label: "Rejected Users" },
        { path: "/todayApproved", icon: <HiOutlineCheckCircle />, label: "Today Approved" },
        { path: "/pending", icon: <HiOutlineClock />, label: "Pending Users" },
        { path: "/finduser", icon: <HiOutlineFilter />, label: "Find User" },
      ],
    },
    {
      group: "Withdrawals",
      items: [
        { path: "/withdrwa", icon: <HiOutlineCash />, label: "Withdraw Requests" },
        { path: "/ApprovedWithdrwa", icon: <HiOutlineShieldCheck />, label: "Approved Withdraw" },
        { path: "/rejectwithdrwa", icon: <HiOutlineDocumentText />, label: "Rejected Withdraw" },
      ],
    },
    {
      group: "Administration",
      items: [
        { path: "/sendNotification", icon: <HiOutlineBell />, label: "Send Notification" },
        { path: "/admin-profile-manager", icon: <HiOutlineCog />, label: "Admin Contact Card" },
        { path: "/commission", icon: <HiOutlineCash />, label: "Commission" },
        { path: "/w_salary", icon: <HiOutlineViewGrid />, label: "Week Salary" },
        { path: "/monthlyLevels", icon: <HiOutlineViewGrid />, label: "Monthly Salary" },
        { path: "/SubAdminsManagement", icon: <HiOutlineUserGroup />, label: "Sub Admins" },
        { path: "/accounts", icon: <HiDocumentDuplicate />, label: "Admin Wallet" },
        { path: "/initialSettings", icon: <HiOutlineAnnotation />, label: "Fee-Initial-Offer" },
        { path: "/products", icon: <HiOutlineCamera />, label: "Products" },
        { path: "/withdrawalLimits", icon: <HiOutlineClock />, label: "Withdraw Limits" },
        { path: "/accountsetting", icon: <HiOutlineCog />, label: "Settings" },
      ],
    },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isMinimized ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${isMinimized ? "flex-col gap-2" : ""}`}>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700">
            <HiOutlineUserGroup className="h-6 w-6 text-white" />
          </div>
          {!isMinimized && (
            <div>
              <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          )}
        </div>

        {/* Toggle Button - inside header for better alignment */}
        {!isMinimized && (
          <button
            onClick={toggleSidebar}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Collapse sidebar"
          >
            <HiOutlineChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Toggle in minimized mode */}
      {isMinimized && (
        <div className="relative -right-2 mb-2 flex justify-center">
          <button
            onClick={toggleSidebar}
            className="rounded-full bg-white p-1.5 text-gray-500 shadow-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Expand sidebar"
          >
            <HiOutlineChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {menuItems.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6 last:mb-0">
            {!isMinimized && (
              <h3 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {group.group}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 rounded-xl px-2 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isActive(item.path)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    } ${isMinimized ? "justify-center px-2" : ""}`}
                    title={isMinimized ? item.label : undefined}
                    aria-current={isActive(item.path) ? "page" : undefined}
                  >
                    <span
                      className={`h-5 w-5 ${
                        isActive(item.path) ? "text-blue-600" : "text-gray-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!isMinimized && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer - Logout */}
      <div className={`border-t border-gray-200 p-3 ${isMinimized ? "flex justify-center" : ""}`}>
        <button
          onClick={logout}
          className={`flex w-full items-center space-x-2 rounded-xl px-2 py-2 text-sm font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 ${
            isMinimized ? "justify-center" : "justify-center"
          } bg-red-500 hover:bg-red-600`}
          title={isMinimized ? "Logout" : undefined}
          aria-label="Logout from admin panel"
        >
          <HiOutlineLogout className="h-5 w-5" />
          {!isMinimized && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};