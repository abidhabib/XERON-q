import  { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Sidebar } from "../SideBarSection/Sidebar";
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
  HiOutlineExclamation
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
  
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    actionType: null,
    userId: null,
    userName: '',
    actionCallback: null
  });

  const filteredData = useMemo(() => {
    return data.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toString().includes(searchTerm.toLowerCase()) ||
      user.trx_id?.toString().includes(searchTerm.trimEnd())
    );
  }, [data, searchTerm]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/EasypaisaUsers`, {
      });
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
    setSearchTerm(e.target.value.trimStart());
  }

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
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/updateUserAccounts/${userId}`);
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
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/rejectUser/${userId}`);
      setData(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setLoadingRejectUsers((prev) => prev.filter(id => id !== userId));
    }
  };

  const handleDelete = async (userId) => {
    if (loadingDeleteUsers.includes(userId)) return;
    
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    
    setLoadingDeleteUsers((prev) => [...prev, userId]);

    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteUser/${userId}`);
      setData(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setLoadingDeleteUsers((prev) => prev.filter(id => id !== userId));
    }
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
      
      // Update local data
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
    <div className="flex min-h-screen">
      <Sidebar />
      
      {/* Confirmation Modal */}
      <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity ${confirmationModal.isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full transform transition-transform scale-95">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <HiOutlineExclamation className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="ml-4 text-lg font-medium text-gray-900">
                Confirm {confirmationModal.actionType}
              </h3>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to {confirmationModal.actionType} user{' '}
                <span className="font-medium">{confirmationModal.userName}</span>?
                {confirmationModal.actionType === 'reject' && ' This will permanently remove their approval status.'}
              </p>
            </div>
            
            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={closeConfirmation}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={handleConfirmAction}
              >
                Confirm {confirmationModal.actionType}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <HiOutlineCreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Crypto Users</h1>
                <p className="text-gray-600">Manage cryptocurrency payment verifications</p>
              </div>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <HiOutlineRefresh className="mr-2" /> Refresh
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-2 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                placeholder="Search by name, email, ID or TXID..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      TXID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Referred By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? filteredData.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer"
                      >
                        <div className="flex items-center">
                          <HiOutlineUser className="mr-2 text-gray-500" />
                          {user.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {user.trx_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.refer_by || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={loadingApproveUsers.includes(user.id)}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                              loadingApproveUsers.includes(user.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {loadingApproveUsers.includes(user.id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <HiOutlineCheckCircle className="mr-1" />
                            )}
                            Approve
                          </button>
                          
                          <button
                            onClick={() => showUserDetails(user)}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200`}
                          >
                            Edit
                          </button>
                          
                          {/* Block/Unblock Button */}
                          <button
                            onClick={() => openConfirmation(
                              user.id, 
                              user.name || `ID: ${user.id}`, 
                              user.blocked ? 'unblock' : 'block', 
                              () => toggleBlock(
                                user.id, 
                                user.blocked ?? 0, 
                                (id, newStatus) => {
                                  setData(prev => prev.map(u => 
                                    u.id === id ? { ...u, blocked: newStatus } : u
                                  ));
                                }
                              )
                            )}
                            disabled={loadingBlockUser}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                              user.blocked
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {loadingBlockUser ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <HiOutlineLockOpen className="mr-1" />
                            )}
                            {user.blocked ? 'Unblock' : 'Block'}
                          </button>
                          
                          {/* Reject Button */}
                          <button
                            onClick={() => openConfirmation(
                              user.id, 
                              user.name || `ID: ${user.id}`, 
                              'reject', 
                              () => handleReject(user.id)
                            )}
                            disabled={loadingRejectUsers.includes(user.id)}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                              loadingRejectUsers.includes(user.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {loadingRejectUsers.includes(user.id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <HiOutlineXCircle className="mr-1" />
                            )}
                            Reject
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to permanently delete this user?')) {
                                handleDelete(user.id);
                              }
                            }}
                            disabled={loadingDeleteUsers.includes(user.id)}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                              loadingDeleteUsers.includes(user.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {loadingDeleteUsers.includes(user.id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <HiOutlineTrash className="mr-1" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <HiOutlineUser className="w-12 h-12 text-gray-400 mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No pending users found</h3>
                          <p className="text-gray-500">All verification requests have been processed</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity ${isDetailModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full transform transition-transform scale-95">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {isEditing ? "Edit User Details" : "User Details"}
                  </h2>
                  <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <HiOutlineX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">User ID</div>
                      <div className="font-medium">{selectedUser.id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className="font-medium text-yellow-600">Pending Verification</div>
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md ${
                            formErrors.name ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter full name"
                        />
                        {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                        <input
                          type="text"
                          name="trx_id"
                          value={editFormData.trx_id}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md break-all text-sm ${
                            formErrors.trx_id ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter transaction ID"
                        />
                        {formErrors.trx_id && <p className="mt-1 text-xs text-red-500">{formErrors.trx_id}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referred By</label>
                        <input
                          type="text"
                          name="refer_by"
                          value={editFormData.refer_by}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md ${
                            formErrors.refer_by ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter referrer"
                        />
                        {formErrors.refer_by && <p className="mt-1 text-xs text-red-500">{formErrors.refer_by}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editFormData.email}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md ${
                            formErrors.email ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter email"
                        />
                        {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Full Name</div>
                          <div className="font-medium">{selectedUser.name || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
                          <div className="font-medium break-all text-sm text-blue-600">{selectedUser.trx_id || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Referred By</div>
                          <div className="font-medium">{selectedUser.refer_by || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Email</div>
                          <div className="font-medium">{selectedUser.email || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-4 gap-2 border-t border-gray-200">
                    <div className="flex space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            <HiOutlineBan className="mr-1" /> Cancel
                          </button>
                          <button
                            onClick={handleUpdateUser}
                            disabled={isUpdating}
                            className="flex items-center px-2 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            {isUpdating ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <HiOutlineSave className="mr-1" />
                            )}
                            Save 
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center  px-2 py-1 text-sm text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <HiOutlinePencilAlt className="mr-1" /> Edit Details
                        </button>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openConfirmation(
                          selectedUser.id, 
                          selectedUser.name || `ID: ${selectedUser.id}`, 
                          'reject', 
                          () => handleReject(selectedUser.id)
                        )}
                        disabled={loadingRejectUsers.includes(selectedUser.id)}
                        className={`flex items-center px-4 py-1 text-sm rounded-md transition-colors ${
                          loadingRejectUsers.includes(selectedUser.id)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {loadingRejectUsers.includes(selectedUser.id) ? (
                          <FaSpinner className="animate-spin mr-1" />
                        ) : (
                          <HiOutlineXCircle className="mr-1" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(selectedUser.id)}
                        disabled={loadingApproveUsers.includes(selectedUser.id)}
                        className={`flex items-center px-4 py-1 text-sm rounded-md transition-colors ${
                          loadingApproveUsers.includes(selectedUser.id)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {loadingApproveUsers.includes(selectedUser.id) ? (
                          <FaSpinner className="animate-spin mr-1" />
                        ) : (
                          <HiOutlineCheckCircle className="mr-1" />
                        )}
                        Approve
                      </button>
                    </div>
                  </div>
                  
                  {updateSuccess && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-100">
                      User details updated successfully!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoUsers;