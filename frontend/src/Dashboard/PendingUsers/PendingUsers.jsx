import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlineExclamation,
  HiOutlineFilter,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineUserGroup
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

const PendingUsers = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDeleteUsers, setLoadingDeleteUsers] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    actionType: '',
    message: '',
    onConfirm: null
  });
  
  // Frontend search implementation
  const filteredData = data.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.id && user.id.toString().includes(searchTerm)) ||
    (user.phoneNumber && user.phoneNumber.toString().includes(searchTerm)) ||
    (user.completeAddress && user.completeAddress.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/pending-users`);
      if (response.data && response.data.pendingUsers) {
        setData(response.data.pendingUsers);
        setTotalCount(response.data.pendingUsers.length);
      }
    } catch (error) {
      console.error("Error fetching pending users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openConfirmation = (actionType, message, onConfirm) => {
    setConfirmationModal({
      isOpen: true,
      actionType,
      message,
      onConfirm
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      actionType: '',
      message: '',
      onConfirm: null
    });
  };

  const handleDelete = (userId, userName) => {
    openConfirmation(
      'delete_user',
      `Are you sure you want to delete user ${userName}? This action cannot be undone.`,
      async () => {
        try {
          setLoadingDeleteUsers(prev => [...prev, userId]);
          await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteUser/${userId}`);
          setData(prev => prev.filter(user => user.id !== userId));
          setTotalCount(prev => prev - 1);
          closeConfirmation();
        } catch (error) {
          console.error("Error deleting user:", error);
        } finally {
          setLoadingDeleteUsers(prev => prev.filter(id => id !== userId));
        }
      }
    );
  };

  const handleDelete7DaysOldUsers = () => {
    openConfirmation(
      'delete_old',
      'Are you sure you want to delete users pending for more than 7 days? This action cannot be undone.',
      async () => {
        setIsClearing(true);
        try {
          const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delete-7-days-old-users`);
          if (response.data.success) {
            await fetchData();
            closeConfirmation();
          }
        } catch (error) {
          console.error("Error deleting old records", error);
        } finally {
          setIsClearing(false);
        }
      }
    );
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.trim());
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  Confirm {confirmationModal.actionType === 'delete_user' ? 'Delete User' : 'Delete Old Records'}
                </h3>
              </div>

              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                  {confirmationModal.message}
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
                <HiOutlineUserGroup className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pending Users</h1>
                <p className="text-sm text-gray-600 mt-1">Users waiting for approval</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg">
                <HiOutlineClock className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">{totalCount}</span>
                <span className="text-sm text-gray-600 ml-1">pending</span>
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

          {/* Search and Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineSearch className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                  placeholder="Search users by name, email, phone, or address..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                  <label className="text-sm text-gray-600 mr-2">Show:</label>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-transparent text-sm focus:outline-none"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <button
                  onClick={handleDelete7DaysOldUsers}
                  disabled={isClearing}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    isClearing 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  <HiOutlineCalendar className="w-4 h-4 mr-2" />
                  Clear Old
                </button>
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
            <FaSpinner className="animate-spin text-4xl text-yellow-600 mb-4" />
            <p className="text-gray-600">Loading pending users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <HiOutlineUser className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending users found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {searchTerm ? 'No users match your search criteria' : 'All users are processed'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Registered
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
                      {paginatedData.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mt-1">
                                <HiOutlineUser className="w-4 h-4 text-yellow-600" />
                              </div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">
                                  {user.name || `User #${user.id}`}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {user.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-900 flex items-center">
                                <HiOutlineMail className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="truncate max-w-xs">{user.email}</span>
                              </div>
                              <div className="text-sm text-gray-900 flex items-center">
                                <HiOutlinePhone className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                                {user.phoneNumber || 'N/A'}
                              </div>
                              {user.completeAddress && (
                                <div className="text-sm text-gray-500 flex items-start">
                                  <HiOutlineLocationMarker className="w-3 h-3 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="truncate max-w-xs">{user.completeAddress}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatDate(user.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <HiOutlineClock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDelete(user.id, user.name || `User #${user.id}`)}
                              disabled={loadingDeleteUsers.includes(user.id)}
                              className="flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              {loadingDeleteUsers.includes(user.id) ? (
                                <>
                                  <FaSpinner className="animate-spin mr-2" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <HiOutlineTrash className="mr-2" />
                                  Delete
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * itemsPerPage, filteredData.length)}
                        </span> of <span className="font-medium">{filteredData.length}</span> users
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-lg border ${
                            currentPage === 1 
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          <HiOutlineChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-yellow-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-lg border ${
                            currentPage === totalPages
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          <HiOutlineChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PendingUsers;