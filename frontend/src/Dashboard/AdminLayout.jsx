// src/Dashboard/AdminLayout.jsx
import React from 'react';
import { useSidebar } from './SidebarContext';
import { Sidebar } from './SideBarSection/Sidebar';

const AdminLayout = ({ children }) => {
  const { isMinimized } = useSidebar();

  React.useEffect(() => {
    console.log("✅ AdminLayout re-rendered! isMinimized =", isMinimized);
  }, [isMinimized]);

  return (
    <div className=" min-h-screen bg-gray-50">
      <Sidebar isMinimized={isMinimized} />
      <main className={isMinimized ? 'ml-16' : 'ml-64'} style={{ transition: 'margin 0.3s ease' }}>
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;