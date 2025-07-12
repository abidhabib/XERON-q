import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getTaskName = (task) => {
    switch(task) {
      case 'ApproveUser':
        return 'User Approvals';
      case 'ApproveWithdrawal':
        return 'Withdrawal Approvals';
      default:
        return 'Approvals';
    }
  };

  return (
<></>
  );
};

export default Sidebar;