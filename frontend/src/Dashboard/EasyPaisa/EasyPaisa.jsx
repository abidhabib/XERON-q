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
  HiOutlineLockClosed,
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

// --- Reusable UI Components ---

const StatusBadge = ({ status }) => {
  const configs = {
    blocked: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: HiOutlineBan, label: 'Blocked' },
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: HiOutlineCheck, label: 'Approved' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: HiOutlineClock, label: 'Pending' }
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3 h-3 mr-1.5" />
      {config.label}
    </span>
  );
};

const ActionButton = ({ onClick, variant = 'secondary', children, disabled, title, className = '' }) => {
  const baseStyles = "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500 border border-transparent",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500 shadow-sm",
    success: "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 focus:ring-emerald-500 shadow-sm",
    danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50 focus:ring-red-500 shadow-sm",
    warning: "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 focus:ring-amber-500 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-400",
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

const CryptoUsers = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingApproveUsers, setLoadingApproveUsers] = useState([]);
  const [loadingRejectUsers, setLoadingRejectUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', trx_id: '', refer_by: '', email: '' });
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
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.id?.toString().includes(term) ||
        user.trx_id?.toString().toLowerCase().includes(term) ||
        user.refer_by?.toLowerCase().includes(term)
      );
    }
    
    if (selectedAction === 'pending') {
      filtered = filtered.filter(user => !user.approved && !user.rejected && !user.blocked);
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

  const handleSearch = (e) => setSearchTerm(e.target.value.trim());

  const openConfirmation = (userId, userName, actionType, callback) => {
    setConfirmationModal({ isOpen: true, userId, userName, actionType, actionCallback: callback });
  };

  const handleConfirmAction = async () => {
    if (confirmationModal.actionCallback) {
      await confirmationModal.actionCallback(confirmationModal.userId);
    }
    setConfirmationModal({ isOpen: false, actionType: null, userId: null, userName: '', actionCallback: null });
  };

  const closeConfirmation = () => setConfirmationModal(prev => ({ ...prev, isOpen: false }));

  const handleApprove = async (userId) => {
    if (loadingApproveUsers.includes(userId)) return;
    setLoadingApproveUsers((prev) => [...prev, userId]);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/approveUser/${userId}`, { approved: 1, approved_at: new Date() });
      setData(prev => prev.filter(user => user.id !== userId));
      if (selectedUser?.id === userId) setIsDetailModalOpen(false);
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
      if (selectedUser?.id === userId) setIsDetailModalOpen(false);
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setLoadingRejectUsers((prev) => prev.filter(id => id !== userId));
    }
  };

  const handleDelete = (userId, userName) => {
    openConfirmation(userId, userName, 'delete', async (id) => {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteUser/${id}`);
        setData(prev => prev.filter(user => user.id !== id));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    });
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
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlockClick = (userId, blockedStatus, userName) => {
    openConfirmation(userId, userName, blockedStatus ? 'unblock' : 'block', async (id) => {
      await toggleBlock(id, blockedStatus, (id, newStatus) => {
        setData(prev => prev.map(u => u.id === id ? { ...u, blocked: newStatus } : u));
        // Update selected user if open
        if (selectedUser?.id === id) setSelectedUser(prev => ({ ...prev, blocked: newStatus }));
      });
    });
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
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/updateUserDataEasyPaisa/${selectedUser.id}`, editFormData);
      setData(prev => prev.map(user => user.id === selectedUser.id ? { ...user, ...editFormData } : user));
      setSelectedUser(prev => ({ ...prev, ...editFormData }));
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

  const getUserStatus = (user) => {
    if (user.blocked) return 'blocked';
    if (user.approved) return 'approved';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full ${
                confirmationModal.actionType === 'delete' ? 'bg-red-100' : 
                confirmationModal.actionType === 'block' ? 'bg-amber-100' : 'bg-indigo-100'
              }`}>
                {confirmationModal.actionType === 'delete' ? (
                  <HiOutlineTrash className="h-7 w-7 text-red-600" />
                ) : confirmationModal.actionType === 'block' ? (
                  <HiOutlineLockClosed className="h-7 w-7 text-amber-600" />
                ) : (
                  <HiOutlineLockOpen className="h-7 w-7 text-indigo-600" />
                )}
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 capitalize">
                {confirmationModal.actionType} User
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to {confirmationModal.actionType}{' '}
                <span className="font-semibold text-slate-900">{confirmationModal.userName}</span>?
                {confirmationModal.actionType === 'delete' && (
                  <span className="block mt-2 text-xs font-medium text-red-600 bg-red-50 py-1 px-2 rounded inline-block">
                    ⚠️ This action cannot be undone.
                  </span>
                )}
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
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all shadow-sm hover:shadow-md ${
                  confirmationModal.actionType === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : confirmationModal.actionType === 'block'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Yes, {confirmationModal.actionType}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-amber-600 shadow-lg shadow-indigo-200">
                <HiOutlineCreditCard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Crypto Users</h1>
              </div>
            </div>
            
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-70"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin w-4 h-4 text-indigo-600 mr-2" />
              ) : (
                <HiOutlineRefresh className="w-4 h-4 text-slate-500 mr-2" />
              )}
              Refresh Data
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                placeholder="Search name, email, TXID..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center text-sm text-slate-600">
                <HiOutlineFilter className="w-4 h-4 text-slate-400 mr-2" />
                <select 
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="all">All Users</option>
                  <option value="pending">Pending Only</option>
                  <option value="blocked">Blocked Only</option>
                </select>
              </div>
              
              <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>
              
              <div className="text-sm text-slate-600 font-medium">
                <span className="text-slate-900 font-bold">{filteredData.length}</span> Results
              </div>
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
                  <div className="h-8 w-32 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <HiOutlineUser className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No users found</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                {searchTerm ? `No matches for "${searchTerm}"` : 'No crypto verification requests found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Referrer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredData.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center ring-2 ring-white shadow-sm mr-3">
                            <span className="text-indigo-700 font-bold text-sm">
                              {(user.name || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{user.name || `User #${user.id}`}</div>
                            <div className="text-xs text-slate-500">{user.email || 'No email provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block max-w-[150px] truncate" title={user.trx_id}>
                          {user.trx_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{user.refer_by || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={getUserStatus(user)} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                          <ActionButton onClick={() => showUserDetails(user)} variant="primary" title="View / Edit Details">
                            <HiOutlineEye className="w-3.5 h-3.5 mr-1.5" />
                            Details
                          </ActionButton>
                          
                          {!user.approved && !user.blocked && (
                            <>
                              <ActionButton 
                                onClick={() => handleApprove(user.id)}
                                disabled={loadingApproveUsers.includes(user.id)}
                                variant="success"
                                title="Approve Verification"
                              >
                                {loadingApproveUsers.includes(user.id) ? <FaSpinner className="animate-spin w-3.5 h-3.5" /> : <HiOutlineCheck className="w-3.5 h-3.5 mr-1.5" />}
                                Approve
                              </ActionButton>
                              
                              <ActionButton 
                                onClick={() => handleReject(user.id)}
                                disabled={loadingRejectUsers.includes(user.id)}
                                variant="danger"
                                title="Reject Verification"
                              >
                                {loadingRejectUsers.includes(user.id) ? <FaSpinner className="animate-spin w-3.5 h-3.5" /> : <HiOutlineX className="w-3.5 h-3.5 mr-1.5" />}
                                Reject
                              </ActionButton>
                            </>
                          )}

                          <ActionButton
                            onClick={() => handleBlockClick(user.id, user.blocked ?? 0, user.name)}
                            disabled={loadingBlockUser}
                            variant={user.blocked ? "warning" : "secondary"}
                            title={user.blocked ? 'Unblock' : 'Block'}
                          >
                            {user.blocked ? <HiOutlineLockOpen className="w-3.5 h-3.5 mr-1.5" /> : <HiOutlineLockClosed className="w-3.5 h-3.5 mr-1.5" />}
                            {user.blocked ? 'Unblock' : 'Block'}
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

      {/* User Detail / Edit Modal */}
      {selectedUser && isDetailModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">User Details</h2>
                <p className="text-sm text-slate-500 mt-0.5">ID: <span className="font-mono text-slate-700">#{selectedUser.id}</span></p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {!isEditing ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</div>
                      <div className="font-medium text-slate-900">{selectedUser.name || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Transaction ID</div>
                      <div className="font-mono text-sm text-indigo-600 break-all font-medium">{selectedUser.trx_id || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Referrer</div>
                        <div className="font-medium text-slate-900 truncate" title={selectedUser.refer_by}>{selectedUser.refer_by || 'N/A'}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</div>
                        <StatusBadge status={getUserStatus(selectedUser)} />
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</div>
                      <div className="font-medium text-slate-900">{selectedUser.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter full name' },
                    { name: 'trx_id', label: 'Transaction ID', type: 'text', placeholder: 'Enter transaction ID', mono: true },
                    { name: 'refer_by', label: 'Referred By', type: 'text', placeholder: 'Enter referrer username' },
                    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter email address' }
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={editFormData[field.name]}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          formErrors[field.name] ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
                        } focus:outline-none focus:ring-2 transition-all ${field.mono ? 'font-mono text-sm' : ''}`}
                        placeholder={field.placeholder}
                      />
                      {formErrors[field.name] && <p className="mt-1 text-xs text-red-500 font-medium">{formErrors[field.name]}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              {updateSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-sm font-medium flex items-center animate-in slide-in-from-top-2">
                  <HiOutlineCheckCircle className="w-5 h-5 mr-2" />
                  User details updated successfully!
                </div>
              )}

              <div className="flex justify-between items-center">
                <div>
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateUser}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center disabled:opacity-70"
                      >
                        {isUpdating ? <FaSpinner className="animate-spin mr-2" /> : <HiOutlineSave className="mr-2" />}
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center shadow-sm"
                    >
                      <HiOutlinePencilAlt className="mr-2" />
                      Edit Details
                    </button>
                  )}
                </div>
                
                {!isEditing && (
                  <div className="flex space-x-2">
                    <ActionButton 
                      onClick={() => handleReject(selectedUser.id)}
                      disabled={loadingRejectUsers.includes(selectedUser.id)}
                      variant="danger"
                      className="!px-4 !py-2 !text-sm"
                    >
                      {loadingRejectUsers.includes(selectedUser.id) ? <FaSpinner className="animate-spin mr-2" /> : <HiOutlineXCircle className="mr-2" />}
                      Reject
                    </ActionButton>
                    <ActionButton 
                      onClick={() => handleApprove(selectedUser.id)}
                      disabled={loadingApproveUsers.includes(selectedUser.id)}
                      variant="success"
                      className="!px-4 !py-2 !text-sm"
                    >
                      {loadingApproveUsers.includes(selectedUser.id) ? <FaSpinner className="animate-spin mr-2" /> : <HiOutlineCheckCircle className="mr-2" />}
                      Approve
                    </ActionButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoUsers;