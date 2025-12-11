import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineUser,
  HiOutlineCreditCard,
  HiOutlinePencilAlt,
  HiOutlineSave,
  HiOutlineBan,
  HiOutlineTrash,
  HiOutlineLockOpen,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineFilter
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';
import useBlockUser from '../Hooks/useBlockUser';

const CryptoUsers = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingApproveUsers, setLoadingApproveUsers] = useState([]);
  const [loadingRejectUsers, setLoadingRejectUsers] = useState([]);
  const [loadingDeleteUsers, setLoadingDeleteUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    trx_id: '',
    refer_by: '',
    email: ''
  });
  const { toggleBlock, loading: loadingBlockUser } = useBlockUser();

  const [formErrors, setFormErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [selectedAction, setSelectedAction] = useState('all');

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    actionType: null,
    userId: null,
    userName: '',
    actionCallback: null
  });

  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id?.toString().includes(searchTerm.toLowerCase()) ||
        user.trx_id?.toString().includes(searchTerm.toLowerCase()) ||
        user.refer_by?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by action type
    if (selectedAction === 'pending') {
      // Users that are pending (not approved/rejected)
      filtered = filtered.filter(user => !user.approved && !user.rejected);
    } else if (selectedAction === 'blocked') {
      filtered = filtered.filter(user => user.blocked);
    }
    
    return filtered;
  }, [data, searchTerm, selectedAction]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/EasypaisaUsers`);
      if (response.data?.approvedUsers) {
        setData(response.data.approvedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.trim());
  };

  // Open confirmation dialog
  const openConfirmation = (userId, userName, actionType, callback) => {
    setConfirmationModal({
      isOpen: true,
      userId,
      userName,
      actionType,
      actionCallback: callback
    });
  };

  // Handle confirmed action
  const handleConfirmAction = async () => {
    if (confirmationModal.actionCallback) {
      await confirmationModal.actionCallback(confirmationModal.userId);
    }
    setConfirmationModal({
      isOpen: false,
      actionType: null,
      userId: null,
      userName: '',
      actionCallback: null
    });
  };

  // Close confirmation dialog
  const closeConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleApprove = async (userId) => {
    if (loadingApproveUsers.includes(userId)) return;
    setLoadingApproveUsers((prev) => [...prev, userId]);

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/approveUser/${userId}`, {
        approved: 1,
        approved_at: new Date()
      });

      setData(prev => prev.filter(user => user.id !== userId));
    
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setLoadingApproveUsers((prev) => prev.filter(id => id !== userId));
    }
  };

  const handleReject = async (userId) => {
    if (loadingRejectUsers.includes(userId)) return;
    setLoadingRejectUsers((prev) => [...prev, userId]);

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/rejectUserCurrMin/${userId}`);
      setData(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setLoadingRejectUsers((prev) => prev.filter(id => id !== userId));
    }
  };

  const handleDelete = (userId, userName) => {
    openConfirmation(
      userId,
      userName,
      'delete',
      async (id) => {
        try {
          await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteUser/${id}`);
          setData(prev => prev.filter(user => user.id !== id));
        } catch (error) {
          console.error("Error deleting user:", error);
        }
      }
    );
  };

  const showUserDetails = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      trx_id: user.trx_id || '',
      refer_by: user.refer_by || '',
      email: user.email || ''
    });
    setIsEditing(false);
    setFormErrors({});
    setUpdateSuccess(false);
    setIsDetailModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlockClick = (userId, blockedStatus, userName) => {
    openConfirmation(
      userId, 
      userName,
      blockedStatus ? 'unblock' : 'block',
      async (id) => {
        await toggleBlock(id, blockedStatus, (id, newStatus) => {
          setData(prev => prev.map(u => u.id === id ? { ...u, blocked: newStatus } : u));
        });
      }
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!editFormData.name) errors.name = 'Name is required';
    if (!editFormData.trx_id) errors.trx_id = 'Transaction ID is required';
    if (!editFormData.refer_by) errors.refer_by = 'Referrer is required';
    if (!editFormData.email) errors.email = 'Email is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async () => {
    if (!validateForm()) return;

    setIsUpdating(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/updateUserDataEasyPaisa/${selectedUser.id}`, {
        name: editFormData.name,
        trx_id: editFormData.trx_id,
        refer_by: editFormData.refer_by,
        email: editFormData.email
      });

      setData(prev => prev.map(user =>
        user.id === selectedUser.id
          ? { ...user, ...editFormData }
          : user
      ));

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user data:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      name: selectedUser.name || '',
      trx_id: selectedUser.trx_id || '',
      refer_by: selectedUser.refer_by || '',
      email: selectedUser.email || ''
    });
    setFormErrors({});
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
                  Confirm {confirmationModal.actionType}
                </h3>
              </div>

              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                  Are you sure you want to {confirmationModal.actionType} user{' '}
                  <span className="font-medium text-gray-900">{confirmationModal.userName}</span>?
                </p>
                {confirmationModal.actionType === 'delete' && (
                  <p className="mt-1 text-xs text-red-500">
                    This action cannot be undone.
                  </p>
                )}
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
                  className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                    confirmationModal.actionType === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  onClick={handleConfirmAction}
                >
                  Confirm
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
                <HiOutlineCreditCard className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Crypto Users</h1>
                <p className="text-sm text-gray-600 mt-1">Manage cryptocurrency payment verifications</p>
              </div>
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

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineSearch className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="Search users by name, email, ID, or TXID..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                  <HiOutlineFilter className="w-4 h-4 text-gray-500 mr-2" />
                  <select 
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="bg-transparent text-sm focus:outline-none"
                  >
                    <option value="all">All Users</option>
                    <option value="pending">Pending</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{filteredData.length}</span> users found
                {searchTerm && (
                  <span className="ml-2">
                    • Searching for "<span className="font-medium">{searchTerm}</span>"
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
            <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <HiOutlineUser className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchTerm ? 'No users match your search criteria' : 'No crypto users found'}
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
                        TXID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Referrer
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
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <HiOutlineUser className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">
                                {user.name || `User #${user.id}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-mono">
                            {user.trx_id || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.refer_by || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.blocked 
                                ? 'bg-red-100 text-red-800' 
                                : user.approved
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.blocked ? (
                                <>
                                  <HiOutlineBan className="w-3 h-3 mr-1" />
                                  Blocked
                                </>
                              ) : user.approved ? (
                                <>
                                  <HiOutlineCheck className="w-3 h-3 mr-1" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <HiOutlineClock className="w-3 h-3 mr-1" />
                                  Pending
                                </>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => showUserDetails(user)}
                              className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="View details"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleApprove(user.id)}
                              disabled={loadingApproveUsers.includes(user.id)}
                              className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Approve user"
                            >
                              {loadingApproveUsers.includes(user.id) ? (
                                <FaSpinner className="animate-spin w-4 h-4" />
                              ) : (
                                <HiOutlineCheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleReject(user.id)}
                              disabled={loadingRejectUsers.includes(user.id)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Reject user"
                            >
                              {loadingRejectUsers.includes(user.id) ? (
                                <FaSpinner className="animate-spin w-4 h-4" />
                              ) : (
                                <HiOutlineXCircle className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleBlockClick(user.id, user.blocked ?? 0, user.name)}
                              disabled={loadingBlockUser}
                              className={`p-1.5 rounded transition-colors ${
                                user.blocked
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                  : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                              title={user.blocked ? 'Unblock user' : 'Block user'}
                            >
                              <HiOutlineLockOpen className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete user"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* User Detail Modal */}
      {selectedUser && isDetailModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full animate-fadeIn max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
                  <p className="text-sm text-gray-600 mt-1">ID: #{selectedUser.id}</p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiOutlineX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Full Name</div>
                      <div className="font-medium text-gray-900">{selectedUser.name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
                      <div className="font-medium font-mono text-sm text-indigo-600 break-all">
                        {selectedUser.trx_id || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Referred By</div>
                      <div className="font-medium text-gray-900">{selectedUser.refer_by || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Email Address</div>
                      <div className="font-medium text-gray-900">{selectedUser.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.blocked 
                          ? 'bg-red-100 text-red-800' 
                          : selectedUser.approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedUser.blocked ? 'Blocked' : selectedUser.approved ? 'Approved' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2.5 rounded-lg border ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                      placeholder="Enter full name"
                    />
                    {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      name="trx_id"
                      value={editFormData.trx_id}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2.5 rounded-lg border ${
                        formErrors.trx_id ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors font-mono text-sm`}
                      placeholder="Enter transaction ID"
                    />
                    {formErrors.trx_id && <p className="mt-1 text-xs text-red-500">{formErrors.trx_id}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Referred By
                    </label>
                    <input
                      type="text"
                      name="refer_by"
                      value={editFormData.refer_by}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2.5 rounded-lg border ${
                        formErrors.refer_by ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                      placeholder="Enter referrer"
                    />
                    {formErrors.refer_by && <p className="mt-1 text-xs text-red-500">{formErrors.refer_by}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2.5 rounded-lg border ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                      placeholder="Enter email"
                    />
                    {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateUser}
                        disabled={isUpdating}
                        className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                      >
                        {isUpdating ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <HiOutlineSave className="mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center"
                    >
                      <HiOutlinePencilAlt className="mr-2" />
                      Edit Details
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleReject(selectedUser.id)}
                    disabled={loadingRejectUsers.includes(selectedUser.id)}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center"
                  >
                    {loadingRejectUsers.includes(selectedUser.id) ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : (
                      <HiOutlineXCircle className="mr-2" />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedUser.id)}
                    disabled={loadingApproveUsers.includes(selectedUser.id)}
                    className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center"
                  >
                    {loadingApproveUsers.includes(selectedUser.id) ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : (
                      <HiOutlineCheckCircle className="mr-2" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
              
              {updateSuccess && (
                <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
                  User details updated successfully!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoUsers;