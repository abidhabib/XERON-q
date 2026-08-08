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
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineUserGroup
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

// --- Reusable UI Components ---

const ActionButton = ({ onClick, variant = 'secondary', children, disabled, title, className = '' }) => {
  const baseStyles = "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500 shadow-sm",
    danger: "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 focus:ring-rose-500 shadow-sm",
    warning: "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 focus:ring-amber-500 shadow-sm",
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
  const filteredData = data.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.id && user.id.toString().includes(term)) ||
      (user.phoneNumber && user.phoneNumber.toString().includes(term)) ||
      (user.completeAddress && user.completeAddress.toLowerCase().includes(term))
    );
  });

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
    setConfirmationModal({ isOpen: true, actionType, message, onConfirm });
  };

  const closeConfirmation = () => {
    setConfirmationModal({ isOpen: false, actionType: '', message: '', onConfirm: null });
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
          setTotalCount(prev => Math.max(0, prev - 1));
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
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-rose-100">
                <HiOutlineExclamation className="h-7 w-7 text-rose-600" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 capitalize">
                {confirmationModal.actionType === 'delete_user' ? 'Delete User' : 'Clear Old Records'}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {confirmationModal.message}
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
                disabled={isClearing}
                className="px-5 py-2.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md shadow-rose-200 transition-all disabled:opacity-70 flex items-center"
              >
                {isClearing ? <FaSpinner className="animate-spin mr-2" /> : null}
                Confirm Delete
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
              <div className="p-3 rounded-xl bg-amber-500 shadow-lg shadow-amber-200">
                <HiOutlineUserGroup className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Users</h1>
                <p className="text-sm text-slate-500 mt-0.5">Users awaiting verification and approval</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                <HiOutlineClock className="w-4 h-4 text-amber-500 mr-2" />
                <span className="text-sm font-bold text-slate-900">{totalCount}</span>
                <span className="text-sm text-slate-500 ml-1">pending</span>
              </div>
              
              <button 
                onClick={fetchData}
                disabled={isLoading}
                className="flex items-center px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-70"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin w-4 h-4 text-amber-500 mr-2" />
                ) : (
                  <HiOutlineRefresh className="w-4 h-4 text-slate-500 mr-2" />
                )}
                Refresh
              </button>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all"
                placeholder="Search name, email, phone, address..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center text-sm text-slate-600">
                <span className="mr-2">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value={25}>25 Rows</option>
                  <option value={50}>50 Rows</option>
                  <option value={100}>100 Rows</option>
                </select>
              </div>
              
              <ActionButton
                onClick={handleDelete7DaysOldUsers}
                disabled={isClearing || isLoading}
                variant="warning"
                className="!px-4 !py-2.5 !text-sm"
              >
                {isClearing ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <HiOutlineCalendar className="w-4 h-4 mr-2" />
                )}
                Clear &gt;7 Days
              </ActionButton>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-3 text-sm text-slate-500 px-1">
            <span className="font-bold text-slate-900">{filteredData.length}</span> users found
            {searchTerm && (
              <span className="ml-1">
                for "<span className="font-medium text-slate-700">{searchTerm}</span>"
              </span>
            )}
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
                    <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                  </div>
                  <div className="h-8 w-20 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <HiOutlineUser className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No pending users found</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                {searchTerm ? `No matches for "${searchTerm}"` : 'All users have been processed'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                    <tr>
                      {/* Tighter padding: px-4 py-3 instead of px-6 py-4 */}
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[20%]">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[40%]">Contact Info</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[20%]">Registered</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-[20%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedData.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* User Column */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-start">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center ring-2 ring-white shadow-sm mr-3 mt-0.5 flex-shrink-0">
                              <span className="text-amber-700 font-bold text-xs">
                                {(user.name || '?')[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 text-sm truncate" title={user.name}>
                                {user.name || `User #${user.id}`}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info - Full visibility, no truncation */}
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-start text-slate-700">
                              <HiOutlineMail className="w-3.5 h-3.5 text-slate-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="break-all leading-relaxed">{user.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center text-slate-700">
                              <HiOutlinePhone className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
                              <span>{user.phoneNumber || 'N/A'}</span>
                            </div>
                            {user.completeAddress && (
                              <div className="flex items-start text-slate-500 pt-1.5 mt-1.5 border-t border-slate-100">
                                <HiOutlineLocationMarker className="w-3.5 h-3.5 text-slate-400 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="break-all leading-relaxed text-xs">{user.completeAddress}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Registered Date */}
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <div className="text-sm text-slate-700 mt-1">
                            {formatDate(user.created_at)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap text-right align-top">
                          <div className="flex items-center justify-end mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            <ActionButton 
                              onClick={() => handleDelete(user.id, user.name || `User #${user.id}`)}
                              disabled={loadingDeleteUsers.includes(user.id)}
                              variant="danger"
                              title="Delete Pending User"
                            >
                              {loadingDeleteUsers.includes(user.id) ? (
                                <FaSpinner className="animate-spin w-3.5 h-3.5" />
                              ) : (
                                <>
                                  <HiOutlineTrash className="w-3.5 h-3.5 mr-1.5" />
                                  Delete
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-500">
                    Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{' '}
                    <span className="font-semibold text-slate-900">{filteredData.length}</span> results
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg border transition-all ${
                        currentPage === 1 
                          ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-transparent' 
                          : 'border-slate-300 text-slate-600 hover:bg-white hover:shadow-sm hover:border-slate-400'
                      }`}
                      aria-label="Previous Page"
                    >
                      <HiOutlineChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[2.5rem] h-10 rounded-lg text-sm font-medium transition-all ${
                              currentPage === pageNum
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-200 scale-105'
                                : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'
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
                      className={`p-2 rounded-lg border transition-all ${
                        currentPage === totalPages
                          ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-transparent'
                          : 'border-slate-300 text-slate-600 hover:bg-white hover:shadow-sm hover:border-slate-400'
                      }`}
                      aria-label="Next Page"
                    >
                      <HiOutlineChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PendingUsers;