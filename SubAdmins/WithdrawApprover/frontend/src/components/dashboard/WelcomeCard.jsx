import React from 'react';
import useAuth from '../../hooks/useAuth';

const WelcomeCard = () => {
  const { user } = useAuth();

  const getTaskDescription = (task) => {
    switch(task) {
      case 'ApproveUser':
        return 'You have permission to approve new user registrations and manage existing user accounts.';
      case 'ApproveWithdrawal':
        return 'You have permission to review and approve withdrawal requests from users.';
      default:
        return 'You have limited administrative privileges.';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Welcome, {user?.username}</h2>
          <p className="text-gray-600">You are logged in as a subadmin</p>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-900">Your Permissions</h3>
        <p className="mt-2 text-gray-600">
          {getTaskDescription(user?.task)}
        </p>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <div className="text-blue-800 font-medium">Pending Actions</div>
          <div className="text-2xl font-bold mt-2 text-blue-600">12</div>
        </div>
        <div className="bg-green-50 p-4 rounded-md border border-green-100">
          <div className="text-green-800 font-medium">Completed Today</div>
          <div className="text-2xl font-bold mt-2 text-green-600">8</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
          <div className="text-purple-800 font-medium">Total Users</div>
          <div className="text-2xl font-bold mt-2 text-purple-600">142</div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;