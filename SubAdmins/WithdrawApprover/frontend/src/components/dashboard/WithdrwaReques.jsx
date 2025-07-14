import React, { useState, useEffect } from 'react';
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineCreditCard,
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';
import {  Alert } from 'react-bootstrap';
import { withdrawalService } from '../../services/withdrawalService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const WithdrawRequests = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingActions, setLoadingActions] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('insufficient_balance');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState(null);
  const { logout, user, loading } = useAuth();
  const navigate = useNavigate();

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchData();
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gray-100">
        <FaSpinner className="animate-spin text-4xl mr-2" />
      </div>
    );
  }
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const filteredData = data.filter(request =>
    (request.id?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request.account_number?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request.user_id?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await withdrawalService.getAllWithdrawalRequests();
      setData(response);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      setError('Failed to fetch withdrawal requests. Please try again.');
      if (error.response?.status === 401) {
        // Handle unauthorized (redirect to login)
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };
  const openRejectModal = (request) => {
    setCurrentRequest(request);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setCustomReason('');
  };

  const handleReject = async () => {
    if (!rejectionReason && !customReason) {
      alert('Please select a reason or enter a custom message');
      return;
    }

    const reason = rejectionReason === 'custom'
      ? customReason
      : rejectionReason;

    await handleAction('reject', currentRequest.user_id, currentRequest.id, reason);
    closeRejectModal();
  };

  const handleAction = async (action, userId, requestId, reason) => {
    const actionKey = `${action}-${requestId}`;

    if (loadingActions[actionKey]) return;

    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    setError(null);

    try {
      if (action === 'approve') {
        await withdrawalService.approveWithdrawal(userId, requestId, reason);
      } else if (action === 'reject') {
        const reason = rejectionReason === 'custom' ? customReason : rejectionReason;
        await withdrawalService.rejectWithdrawal(userId, requestId, reason);
        setShowRejectModal(false);
      } else if (action === 'delete') {
        await withdrawalService.deleteWithdrawal(userId, requestId);
      }

      // Remove request from local state on success
      setData(prev => prev.filter(item => item.id !== requestId));
    } catch (error) {
      console.error(`Error with ${action} action:`, error);
      setError(`Failed to ${action} request: ${error.response?.data?.error || error.message}`);

      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert('Copied to clipboard');
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <HiOutlineCreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">Requests</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchData}
              className="p-2 bg-gray-100 rounded-lg"
            >
              <HiOutlineRefresh className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 bg-gray-100 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="mt-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <HiOutlineSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 border-0 focus:ring-2 focus:ring-purple-300"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg mt-1 rounded-lg p-4 z-20">
            <button 
              className="w-full py-3 bg-red-500 text-white rounded-lg flex items-center justify-center"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-xl mr-4">
              <HiOutlineCreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Withdrawal Requests</h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <HiOutlineRefresh className="mr-2" />
              )}
              Refresh
            </button>
            <button 
              className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
        
        <div className="flex">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <HiOutlineSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 border-0 focus:ring-2 focus:ring-purple-300"
              placeholder="Search by ID, account, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6">
        {error && (
          <div className="mb-6">
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto mb-3" />
              <p className="text-gray-600">Loading requests...</p>
            </div>
          </div>
        ) : (
          <>
            {filteredData.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg--600 text-white bg-indigo-500">
                      <tr>
                        {['ID', 'Amount', 'Address', 'Wallet', 'ID', 'Team', 'Total', 'Actions'].map((header) => (
                          <th 
                            key={header}
                            className="px-4 py-3 text-center text-left text-xs font-medium text-white uppercase tracking-wider"
                          >
                            <div className="flex items-center">
                              {header}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            <div className="inline-flex items-center">
                              <span className="truncate max-w-[80px] md:max-w-full">{request.id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                            ${parseFloat(request.amount).toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-sm text-blue-500 font-mono ">
                            <span className="break-all max-w-[100px] inline-block md:max-w-[180px]" onClick={() => copyToClipboard(request.account_number)}>
                              {request.account_number}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {request.bank_name}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {request.user_id}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {request.team}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                            ${parseFloat(request.total_withdrawn).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleAction('approve', request.user_id, request.id, request.amount)}
                                disabled={loadingActions[`approve-${request.id}`]}
                                className="p-2 rounded-lg bg-green-500  hover:bg-green-100 transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                {loadingActions[`approve-${request.id}`] ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <p className="w-15 h-5 text-center text-white" > Approve</p>
)}
                              </button>
                              
                              <button
                                onClick={() => openRejectModal(request)}
                                className="p-2 mx-1 ml-4 rounded-lg bg-orange-500 text-orange-600 hover:bg-orange-100 transition-colors"
                                title="Reject"
                              >
                                <p className="w-15 h-5 text-center text-white">Reject</p>
                                </button>
                              
                              <button
                                onClick={() => handleAction('delete', request.user_id, request.id)}
                                disabled={loadingActions[`delete-${request.id}`]}
                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <HiOutlineTrash className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {searchTerm ? 'No matches found' : 'No pending requests'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm
                      ? 'Try adjusting your search query'
                      : 'All  requests have been processed'}
                  </p>
                  <button
                    onClick={fetchData}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <HiOutlineRefresh className="mr-2" />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showRejectModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 relative">
      
      {/* Close Button */}
      <button
        onClick={closeRejectModal}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="px-6 pt-6">
        <h2 className="text-lg font-semibold text-gray-800">Reject Withdrawal Request</h2>
        <p className="text-sm text-gray-500 mt-1">Please select or write a rejection reason:</p>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {[
          'Invalid BEP 20 Address',
          'Reject For Security Reason',
          { value: 'custom', label: 'Custom Message' }
        ].map((reason) => {
          const isCustom = typeof reason === 'object';
          const value = isCustom ? reason.value : reason;
          const label = isCustom ? reason.label : reason;

          return (
            <label
              key={value}
              className={`flex items-start p-3 rounded-lg border cursor-pointer ${
                rejectionReason === value
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="rejectionReason"
                value={value}
                checked={rejectionReason === value}
                onChange={() => setRejectionReason(value)}
                className="form-radio text-purple-600 mt-1"
              />
              <span className="ml-3 text-gray-700">{label}</span>
            </label>
          );
        })}

        {rejectionReason === 'custom' && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-300"
            placeholder="Enter your custom reason"
            rows={3}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-2 flex justify-end space-x-3">
        <button
          onClick={closeRejectModal}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleReject}
          disabled={loadingActions[`reject-${currentRequest?.id}`] || (rejectionReason === 'custom' && !customReason.trim())}
          className={`px-4 py-2 rounded-lg text-white font-medium transition ${
            loadingActions[`reject-${currentRequest?.id}`] || (rejectionReason === 'custom' && !customReason.trim())
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {loadingActions[`reject-${currentRequest?.id}`] ? (
            <span className="flex items-center">
              <FaSpinner className="animate-spin mr-2" />
              Processing...
            </span>
          ) : (
            'Confirm Rejection'
          )}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default WithdrawRequests;