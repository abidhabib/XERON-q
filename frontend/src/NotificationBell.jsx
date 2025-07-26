import React, { useEffect, useState, useContext } from 'react';
import { Bell } from 'react-feather';
import { Link } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';

const NotificationBell = ({ iconClass = "w-5 h-5" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { Userid: userId } = useContext(UserContext);

  const fetchUnreadCount = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${userId}/unread-count`);
      const data = await response.json();
      
      if (data?.status === 'success') {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="relative">
      <Bell className={iconClass} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;