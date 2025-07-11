import React, { useState, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../../UserContext/UserContext";
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
  HiOutlineBell
} from "react-icons/hi";

export const Sidebar = () => {
  const { setAdminAuthenticated } = useContext(UserContext);
  const location = useLocation();
  const [isMinimized, setIsMinimized] = useState(() => {
    // Initialize state from localStorage if available
    const savedState = localStorage.getItem('sidebarMinimized');
    return savedState ? JSON.parse(savedState) : false;
  });
  
  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  const logout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminToken");
    setAdminAuthenticated(false);
  };

  const toggleSidebar = () => {
    setIsMinimized(prev => !prev);
  };

  const isActive = (path) => location.pathname === path;

  // Menu structure
  const menuItems = [
    {
      group: "Dashboard",
      items: [
        {
          path: "/adminpanel",
          icon: <HiOutlineViewGrid className="w-5 h-5" />,
          label: "Dashboard",
        }
      ]
    },
    {
      group: "User Management",
      items: [
        {
          path: "/users",
          icon: <HiOutlineUsers className="w-5 h-5" />,
          label: "All Users",
        },
        {
          path: "/easypaisa",
          icon: <HiOutlineCurrencyDollar className="w-5 h-5" />,
          label: "Crypto Users",
        },
        {
          path: "/rejecteduser",
          icon: <HiOutlineXCircle className="w-5 h-5" />,
          label: "Rejected Users",
        },
        {
          path: "/todayApproved",
          icon: <HiOutlineCheckCircle className="w-5 h-5" />,
          label: "Today Approved",
        },
        {
          path: "/pending",
          icon: <HiOutlineClock className="w-5 h-5" />,
          label: "Pending Users",
        },
        {
          path: "/finduser",
          icon: <HiOutlineFilter className="w-5 h-5" />,
          label: "Find User",
        }
      ]
    },
    {
      group: "Withdrawals",
      items: [
        {
          path: "/withdrwa",
          icon: <HiOutlineCash className="w-5 h-5" />,
          label: "Withdraw Requests",
        },
        {
          path: "/ApprovedWithdrwa",
          icon: <HiOutlineShieldCheck className="w-5 h-5" />,
          label: "Approved Withdraw",
        },
        {
          path: "/rejectwithdrwa",
          icon: <HiOutlineDocumentText className="w-5 h-5" />,
          label: "Rejected Withdrawa",
        }
      ]
    },
    {
      group: "Administration",
      items: [
        {
          path: "/sendNotification",
          icon: <HiOutlineBell className="w-5 h-5" />,
          label: "Send Notification",
        },
        {
          path: "/SubAdminsManagement",
          icon: <HiOutlineUserGroup className="w-5 h-5" />,
          label: "Sub Admins",
        },
        {
          path: "/accounts",
          icon: <HiDocumentDuplicate className="w-5 h-5" />,
          label: "Admin Wallet",
        },
        {
          path: "/initialsettings",
          icon: <HiOutlineAnnotation className="w-5 h-5" />,
          label: "Fee-Inintial-Offer",
        },
        {
          path: "/products",
          icon: <HiOutlineCamera className="w-5 h-5" />,
          label: "Products",
        },
        {
          path: "/withdrawalLimits",
          icon: <HiOutlineClock className="w-5 h-5" />,
          label: "Withdraw Limits",
        },
        {
          path: "/accountsetting",
          icon: <HiOutlineCog className="w-5 h-5" />,
          label: "Settings",
        }
      ]
    }
  ];

  return (
    <div 
      className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
        isMinimized ? "w-12" : "w-64"
      }`}
    >
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 ${isMinimized ? "flex justify-center" : ""}`}>
        <div className="flex items-center space-x-3">
          {!isMinimized && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 w-10 h-10 rounded-lg flex items-center justify-center">
              <HiOutlineUserGroup className="w-6 h-6 text-white" />
            </div>
          )}
          {!isMinimized ? (
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-xs text-gray-500">Administration Dashboard</p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 w-10 h-10 rounded-lg flex items-center justify-center">
              <HiOutlineUserGroup className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>
      
      {/* Toggle Button */}
      <div className="absolute top-4 right-0 transform translate-x-1/2 z-10">
        <button
          onClick={toggleSidebar}
          className="bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
          aria-label={isMinimized ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isMinimized ? (
            <HiOutlineChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <HiOutlineChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {menuItems.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-8">
            {!isMinimized && (
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-2 mb-2">
                {group.group}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center space-x-3 px-1 py-2 rounded-xl
                      transition-all duration-200
                      ${isActive(item.path) 
                        ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm" 
                        : "text-gray-600 hover:bg-gray-50"}
                      ${isMinimized ? "justify-center" : ""}
                    `}
                    title={isMinimized ? item.label : ""}
                  >
                    <span className={isActive(item.path) ? "text-blue-500" : "text-gray-400"}>
                      {item.icon}
                    </span>
                    {!isMinimized && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className={`p-4 border-t border-gray-200 ${isMinimized ? "flex justify-center" : ""}`}>
        <button
          onClick={logout}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-xl
            text-sm text-white bg-red-500 hover:bg-red-600
            transition-colors duration-200 border border-red-600
            ${isMinimized ? "px-3" : "w-full justify-center"}
          `}
          title={isMinimized ? "Logout" : ""}
        >
          <HiOutlineLogout className="w-5 h-5" />
          {!isMinimized && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};