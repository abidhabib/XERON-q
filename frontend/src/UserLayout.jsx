import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBAr'; // Import your navbar component

const UserLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 left-0 right-0 z-50">
        <NavBar />
      </div>
      
      {/* Main content area */}
      <main className="pt-16"> {/* Adjust pt based on your navbar height */}
        <Outlet /> {/* This renders the child route components */}
      </main>
    </div>
  );
};

export default UserLayout;