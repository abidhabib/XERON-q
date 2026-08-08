import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCreditCard,
  HiOutlineCalendar,
  HiOutlineXCircle,
  HiOutlineCurrencyDollar,
  HiOutlineLocationMarker,
  HiOutlineUsers,
  HiOutlineExclamation
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

// --- Reusable UI Components ---

const ActionButton = ({ onClick, variant = 'secondary', children, disabled, title, className = '' }) => {
  const baseStyles = "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500 border border-transparent",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500 shadow-sm",
    danger: "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 focus:ring-rose-500 shadow-sm",
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const TodayApproved = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRejectUsers, setLoadingRejectUsers] = useState([]);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    onConfirm: null
  });
  
  // Sort data to show newest IDs first
  const sortedData = [...data].sort((a, b) => b.id - a.id);
  
  // Frontend search implementation
  const filteredData = sortedData.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.id && user.id.toString().includes(term)) ||
      (user.trx_id && user.trx_id.toString().toLowerCase().includes(term)) ||
      (user.refer_by && user.refer_by.toLowerCase().includes(term))
    );
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/todayApproved`);
      if (response.data && response.data.approvedUsers) {
        setData(response.data.approvedUsers);
      }
    } catch (error) {
      console.error("Error fetching today's approved users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openConfirmation = (userId, userName) => {
    setConfirmationModal({
      isOpen: true,
      userId,
      userName,
      onConfirm: () => handleReject(userId)
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      userId: null,
      userName: '',
      onConfirm: null
    });
  };

  const handleReject = async (userId) => {
    if (loadingRejectUsers.includes(userId)) return;
    
    setLoadingRejectUsers(prev => [...prev, userId]);
    closeConfirmation();
    
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/rejectUserCurrMin/${userId}`);
      setData(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setLoadingRejectUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-rose-100">
                <HiOutlineExclamation className="h-7 w-7 text-rose-600" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">Revoke Approval</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Are you sure you want to reject{' '}
                <span className="font-semibold text-slate-900">{confirmationModal.userName}</span>?
                This will remove their approval status.
              </p>
            </div>
            
            <div className="mt-8 flex justify-center space-x-3">
              <button
                onClick={closeConfirmation}
                className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmationModal.onConfirm}
                disabled={loadingRejectUsers.includes(confirmationModal.userId)}
                className="px-5 py-2.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md shadow-rose-200 transition-all disabled:opacity-70 flex items-center"
              >
                {loadingRejectUsers.includes(confirmationModal.userId) ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : null}
                Yes, Reject User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200">
                <HiOutlineCalendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Today's Approved Users</h1>
                <p className="text-sm text-slate-500 mt-0.5">Users verified in the last 24 hours</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                <HiOutlineUsers className="w-4 h-4 text-emerald-600 mr-2" />
                <span className="text-sm font-bold text-slate-900">{filteredData.length}</span>
                <span className="text-sm text-slate-500 ml-1">users</span>
              </div>
              
              <button 
                onClick={fetchData}
                disabled={isLoading}
                className="flex items-center px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-70"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin w-4 h-4 text-emerald-600 mr-2" />
                ) : (
                  <HiOutlineRefresh className="w-4 h-4 text-slate-500 mr-2" />
                )}
                Refresh
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                placeholder="Search name, email, TXID..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="text-sm text-slate-500 w-full lg:w-auto text-left lg:text-right">
              {searchTerm ? (
                <span>
                  Found <span className="font-bold text-slate-900">{filteredData.length}</span> results for "<span className="font-medium text-slate-700">{searchTerm}</span>"
                </span>
              ) : (
                <span>Showing all approvals from today</span>
              )}
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          {isLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/6"></div>
                  </div>
                  <div className="h-8 w-24 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <HiOutlineUser className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No approved users found</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                {searchTerm ? `No matches for "${searchTerm}"` : 'No users approved in the last 24 hours'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                  <tr>
                    {/* Reduced padding from px-6 to px-4 to tighten gaps */}
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[30%]">Transaction Details</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredData.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center ring-2 ring-white shadow-sm mr-3 mt-0.5 flex-shrink-0">
                            <span className="text-emerald-700 font-bold text-xs">
                              {(user.name || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm truncate">{user.name || `User #${user.id}`}</div>
                            <div className="text-xs text-slate-500 flex items-center mt-0.5 truncate">
                              <HiOutlineMail className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate" title={user.email}>{user.email}</span>
                            </div>
                            {user.refer_by && (
                              <div className="text-xs text-slate-400 mt-0.5 truncate">
                                Ref: <span className="text-slate-600">{user.refer_by}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* TXID Column: Removed truncation, allowed wrapping for full visibility */}
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm text-slate-900">
                          <div className="flex items-start mb-1">
                            <HiOutlineCreditCard className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="text-xs text-slate-400 block mb-0.5">TXID</span>
                              <span className="font-mono text-xs text-slate-700 break-all leading-relaxed block">
                                {user.trx_id || 'N/A'}
                              </span>
                            </div>
                          </div>
                          {user.completeAddress && (
                            <div className="flex items-start text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                              <HiOutlineLocationMarker className="w-3 h-3 mr-1.5 flex-shrink-0 mt-0.5" />
                              <span className="break-all leading-relaxed" title={user.completeAddress}>{user.completeAddress}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap align-top">
                        <div className="flex items-center mt-1">
                          <div className="p-1.5 bg-emerald-50 rounded-md mr-2">
                            <HiOutlineCurrencyDollar className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="font-mono font-medium text-slate-900 text-sm">
                            {user.balance || '0.00'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right align-top">
                        <div className="flex items-center justify-end mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                          <ActionButton 
                            onClick={() => openConfirmation(user.id, user.name || `User #${user.id}`)}
                            disabled={loadingRejectUsers.includes(user.id)}
                            variant="danger"
                            title="Revoke Approval"
                          >
                            {loadingRejectUsers.includes(user.id) ? (
                              <FaSpinner className="animate-spin w-3.5 h-3.5" />
                            ) : (
                              <>
                                <HiOutlineXCircle className="w-3.5 h-3.5 mr-1.5" />
                                Reject
                              </>
                            )}
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TodayApproved;