import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCreditCard,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineLocationMarker,
  HiOutlineUsers,
  HiOutlineExclamation
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

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
  const filteredData = sortedData.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.id && user.id.toString().includes(searchTerm)) ||
    (user.trx_id && user.trx_id.toString().includes(searchTerm)) ||
    (user.refer_by && user.refer_by.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <div className="min-h-screen bg-gray-50">
      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full animate-fadeIn">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <HiOutlineExclamation className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">
                  Reject User
                </h3>
              </div>

              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                  Are you sure you want to reject{' '}
                  <span className="font-medium text-gray-900">{confirmationModal.userName}</span>?
                  This will remove their approval status.
                </p>
              </div>

              <div className="mt-6 flex justify-center space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={closeConfirmation}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={confirmationModal.onConfirm}
                >
                  Reject User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-white shadow-sm border border-gray-200">
                <HiOutlineCalendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Today's Approved Users</h1>
                <p className="text-sm text-gray-600 mt-1">Users approved in the last 24 hours</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg">
                <HiOutlineUsers className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">{filteredData.length}</span>
                <span className="text-sm text-gray-600 ml-1">users</span>
              </div>
              
              <button 
                onClick={fetchData}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <HiOutlineRefresh className="w-4 h-4 mr-2" />
                )}
                Refresh
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineSearch className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Search users by name, email, ID, or TXID..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="text-sm text-gray-600 flex items-center">
                {searchTerm && (
                  <>
                    <span className="font-medium text-gray-900">{filteredData.length}</span>
                    <span className="ml-1">results for "</span>
                    <span className="font-medium mx-1">{searchTerm}</span>
                    <span>"</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
            <FaSpinner className="animate-spin text-4xl text-green-600 mb-4" />
            <p className="text-gray-600">Loading today's approved users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <HiOutlineUser className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No approved users found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchTerm ? 'No users match your search criteria' : 'No users approved in the last 24 hours'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                              <HiOutlineUser className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">
                                {user.name || `User #${user.id}`}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <HiOutlineMail className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate max-w-xs">{user.email}</span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Ref: {user.refer_by || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <HiOutlineCreditCard className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="font-mono truncate max-w-xs">
                                {user.trx_id || 'N/A'}
                              </span>
                            </div>
                            {user.completeAddress && (
                              <div className="flex items-center text-xs text-gray-500 mt-2">
                                <HiOutlineLocationMarker className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate max-w-xs">{user.completeAddress}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <HiOutlineCurrencyDollar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {user.balance || '0'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <HiOutlineCheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </span>
                       
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openConfirmation(user.id, user.name || `User #${user.id}`)}
                            disabled={loadingRejectUsers.includes(user.id)}
                            className="flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            {loadingRejectUsers.includes(user.id) ? (
                              <>
                                <FaSpinner className="animate-spin mr-2" />
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <HiOutlineXCircle className="mr-2" />
                                Reject
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TodayApproved;