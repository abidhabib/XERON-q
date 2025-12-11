// src/Dashboard/SidebarContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// ✅ Initialize with undefined (not null)
const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  // ✅ Load from localStorage ONLY on initial mount
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarMinimized');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // ✅ Persist on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }
  }, [isMinimized]);

  const toggleMinimized = () => setIsMinimized(prev => !prev);

  // ✅ MEMOIZE the context value — this is essential
  const value = useMemo(() => ({
    isMinimized,
    toggleMinimized
  }), [isMinimized]); // Only changes when isMinimized changes

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};