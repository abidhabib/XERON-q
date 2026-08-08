import React, { useContext } from "react";
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
  const { isMinimized, toggleMinimized } = useSidebar();

  const logout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminTokens");
    setAdminAuthenticated(false);
    navigate("/admin/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      group: "Overview",
      items: [
        { path: "/admin", icon: <HiOutlineViewGrid />, label: "Dashboard" },
      ],
    },
    {
      group: "Users",
      items: [
        { path: "/users", icon: <HiOutlineUsers />, label: "All Users" },
        { path: "/pending-for-approval", icon: <HiOutlineCurrencyDollar />, label: "Crypto Users" },
        { path: "/rejecteduser", icon: <HiOutlineXCircle />, label: "Rejected" },
        { path: "/todayApproved", icon: <HiOutlineCheckCircle />, label: "Today Approved" },
        { path: "/pending", icon: <HiOutlineClock />, label: "Pending" },
        { path: "/finduser", icon: <HiOutlineFilter />, label: "Find User" },
      ],
    },
    {
      group: "Finance",
      items: [
        { path: "/withdrwa", icon: <HiOutlineCash />, label: "Withdrawals" },
        { path: "/ApprovedWithdrwa", icon: <HiOutlineShieldCheck />, label: "Approved" },
        { path: "/rejectwithdrwa", icon: <HiOutlineDocumentText />, label: "Rejected" },
        { path: "/accounts", icon: <HiDocumentDuplicate />, label: "Admin Wallet" },
        { path: "/commission", icon: <HiOutlineCash />, label: "Commission" },
      ],
    },
    {
      group: "Management",
      items: [
        // { path: "/SubAdminsManagement", icon: <HiOutlineUserGroup />, label: "Sub Admins" },
        { path: "/admin/monthly-salary", icon: <HiOutlineViewGrid />, label: "Monthly Salary" },
        { path: "/products", icon: <HiOutlineCamera />, label: "Products" },
        { path: "/withdrawalLimits", icon: <HiOutlineClock />, label: "Withdrawal Limits" },
                { path: "/admin/level-setting", icon: <HiOutlineClock />, label: "Category Setting" },


        { path: "/initialSettings", icon: <HiOutlineAnnotation />, label: "Settings" },
        { path: "/sendNotification", icon: <HiOutlineBell />, label: "Notifications" },
        { path: "/accountsetting", icon: <HiOutlineCog />, label: "Change Password" },
        // { path: "/admin-profile-manager", icon: <HiOutlineCog />, label: "Contact Card" },
      ],
    },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white transition-all duration-300 ease-in-out ${
        isMinimized ? "w-20" : "w-64"
      } shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
    >
      {/* Header */}
      <div className={`flex h-20 items-center justify-center relative ${isMinimized ? "px-2" : "px-6"}`}>
        {!isMinimized ? (
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg shadow-zinc-200">
              <HiOutlineUserGroup className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-zinc-900 tracking-tight font-manrope">WEB3</h1>
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Admin</span>
            </div>
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg shadow-zinc-200">
            <HiOutlineUserGroup className="h-5 w-5" />
          </div>
        )}

        {/* Toggle Button - Floating on the edge */}
        <button
          onClick={toggleMinimized}
          className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-zinc-100 text-zinc-400 shadow-sm hover:text-zinc-900 hover:border-zinc-300 transition-colors z-50"
        >
          {isMinimized ? (
            <HiOutlineChevronRight className="h-3.5 w-3.5" />
          ) : (
            <HiOutlineChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 scrollbar-hide">
        {menuItems.map((group, groupIndex) => (
          <div key={groupIndex}>
            {!isMinimized && (
              <h3 className="px-2 mb-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {group.group}
              </h3>
            )}
            <ul className="space-y-1.5">
              {group.items.map((item, itemIndex) => {
                const active = isActive(item.path);
                return (
                  <li key={itemIndex}>
                    <Link
                      to={item.path}
                      className={`group flex items-center space-x-2 rounded-xl px-2 py-2 transition-all duration-200 ${
                        active
                          ? "bg-zinc-900 text-white shadow-md shadow-zinc-200"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                      } ${isMinimized ? "justify-center px-2" : ""}`}
                      title={isMinimized ? item.label : undefined}
                    >
                      <span className={`flex-shrink-0 ${active ? "text-white" : "text-zinc-400 group-hover:text-zinc-900"}`}>
                        {React.cloneElement(item.icon, { className: "h-5 w-5" })}
                      </span>
                      {!isMinimized && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer - Logout */}
      <div className={`p-4 ${isMinimized ? "flex justify-center" : ""}`}>
        <button
          onClick={logout}
          className={`flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 ${
            isMinimized ? "justify-center" : "w-full"
          }`}
          title={isMinimized ? "Logout" : undefined}
        >
          <HiOutlineLogout className="h-5 w-5" />
          {!isMinimized && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};