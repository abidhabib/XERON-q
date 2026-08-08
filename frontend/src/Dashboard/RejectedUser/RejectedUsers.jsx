import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineExclamation,
  HiOutlineEye,
  HiOutlineXCircle
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

// --- Reusable UI Components ---

const ActionButton = ({ onClick, variant = 'secondary', children, disabled, title, className = '' }) => {
  const baseStyles = "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500 border border-transparent",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500 shadow-sm",
    success: "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 focus:ring-emerald-500 shadow-sm",
    danger: "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 focus:ring-rose-500 shadow-sm",
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

const RejectedUsers = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingApproveUsers, setLoadingApproveUsers] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    actionType: '',
    message: '',
    onConfirm: null
  });
 
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/rejectedUsers`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm
        }
      });
      
      if (response.data && response.data.approvedUsers) {
        setData(response.data.approvedUsers);
        setTotalCount(response.data.total || response.data.approvedUsers.length);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching rejected users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openConfirmation = (actionType, message, onConfirm) => {
    setConfirmationModal({ isOpen: true, actionType, message, onConfirm });
  };

  const closeConfirmation = () => {
    setConfirmationModal({ isOpen: false, actionType: '', message: '', onConfirm: null });
  };

  const handleApprove = async (userId) => {
    if (loadingApproveUsers.includes(userId)) return;
    
    setLoadingApproveUsers(prev => [...prev, userId]);
    
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/approveUser/${userId}`, { 
        approved: 1, 
        approved_at: new Date() 
      });
      
      setData(prev => prev.filter(user => user.id !== userId));
      setTotalCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setLoadingApproveUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleClearOldRecords = async () => {
    openConfirmation(
      'clear_old',
      'Are you sure you want to delete rejected user records older than 7 days? This action cannot be undone.',
      async () => {
        setIsClearing(true);
        try {
          await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delete-old-rejected-users`);
          await fetchData();
        } catch (error) {
          console.error("Error deleting old records", error);
        } finally {
          setIsClearing(false);
          closeConfirmation();
        }
      }
    );
  };

  const handleClearAllRecords = async () => {
    openConfirmation(
      'clear_all',
      'Are you sure you want to delete ALL rejected users? This action cannot be undone and will permanently remove all rejected user records.',
      async () => {
        setIsClearing(true);
        try {
          await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delete-rejected-users`);
          setData([]);
          setTotalCount(0);
          setTotalPages(0);
        } catch (error) {
          console.error("Error deleting rejected users", error);
        } finally {
          setIsClearing(false);
          closeConfirmation();
        }
      }
    );
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
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
                {confirmationModal.actionType === 'clear_old' ? 'Clear Old Records' : 'Clear All Records'}
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

      {/* User Detail Modal (Simple View) */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">User Details</h2>
                <p className="text-sm text-slate-500 mt-0.5">Rejected Application</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <HiOutlineXCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</div>
                  <div className="font-medium text-slate-900">{selectedUser.name || 'N/A'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</div>
                  <div className="font-medium text-slate-900">{selectedUser.email || 'N/A'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Transaction ID</div>
                  <div className="font-mono text-sm text-indigo-600 break-all font-medium">{selectedUser.trx_id || 'N/A'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Referrer</div>
                  <div className="font-medium text-slate-900">{selectedUser.refer_by || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all"
              >
                Close
              </button>
              <ActionButton 
                onClick={() => {
                  handleApprove(selectedUser.id);
                  setSelectedUser(null);
                }}
                variant="success"
                className="!px-4 !py-2 !text-sm"
                disabled={loadingApproveUsers.includes(selectedUser.id)}
              >
                {loadingApproveUsers.includes(selectedUser.id) ? <FaSpinner className="animate-spin mr-2" /> : <HiOutlineCheckCircle className="mr-2" />}
                Approve User
              </ActionButton>
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
              <div className="p-3 rounded-xl bg-rose-600 shadow-lg shadow-rose-200">
                <HiOutlineUserGroup className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rejected Users</h1>
                <p className="text-sm text-slate-500 mt-0.5">Review and manage rejected verification requests</p>
              </div>
            </div>
            
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-70"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin w-4 h-4 text-rose-600 mr-2" />
              ) : (
                <HiOutlineRefresh className="w-4 h-4 text-slate-500 mr-2" />
              )}
              Refresh Data
            </button>
          </div>

          {/* Search and Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white transition-all"
                placeholder="Search name, email, TXID..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center text-sm text-slate-600">
                <span className="mr-2">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value={25}>25 Rows</option>
                  <option value={50}>50 Rows</option>
                  <option value={100}>100 Rows</option>
                </select>
              </div>
              
              <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>
              
              <div className="text-sm text-slate-600 font-medium">
                <span className="text-slate-900 font-bold">{totalCount.toLocaleString()}</span> Total Rejected
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500 italic">
              {searchTerm ? `Showing ${data.length} search results` : 'Manage bulk cleanup operations below'}
            </div>
            <div className="flex items-center space-x-2">
              <ActionButton
                onClick={handleClearOldRecords}
                disabled={isClearing || isLoading}
                variant="warning"
                className="!px-4 !py-2 !text-sm"
              >
                {isClearing ? <FaSpinner className="animate-spin mr-2" /> : <HiOutlineCalendar className="w-4 h-4 mr-2" />}
                Clear Old (&gt;7d)
              </ActionButton>
              
              <ActionButton
                onClick={handleClearAllRecords}
                disabled={isClearing || isLoading}
                variant="danger"
                className="!px-4 !py-2 !text-sm"
              >
                {isClearing ? <FaSpinner className="animate-spin mr-2" /> : <HiOutlineTrash className="w-4 h-4 mr-2" />}
                Clear All
              </ActionButton>
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
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <HiOutlineUserGroup className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No rejected users found</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                {searchTerm ? `No matches for "${searchTerm}"` : 'All rejected user records have been processed or cleared'}
              </p>
            </div>
          ) : (
            <>
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
                    {data.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center ring-2 ring-white shadow-sm mr-3">
                              <span className="text-rose-700 font-bold text-sm">
                                {(user.name || '?')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">{user.name || `User #${user.id}`}</div>
                              <div className="text-xs text-slate-500 flex items-center">
                                <HiOutlineMail className="w-3 h-3 mr-1" />
                                {user.email || 'No email provided'}
                              </div>
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
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200">
                            <HiOutlineClock className="w-3 h-3 mr-1.5" />
                            Rejected
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            <ActionButton 
                              onClick={() => setSelectedUser(user)} 
                              variant="primary" 
                              title="View Details"
                            >
                              <HiOutlineEye className="w-3.5 h-3.5 mr-1.5" />
                              Details
                            </ActionButton>
                            
                            <ActionButton 
                              onClick={() => handleApprove(user.id)}
                              disabled={loadingApproveUsers.includes(user.id)}
                              variant="success"
                              title="Reverse Rejection & Approve"
                            >
                              {loadingApproveUsers.includes(user.id) ? (
                                <FaSpinner className="animate-spin w-3.5 h-3.5" />
                              ) : (
                                <>
                                  <HiOutlineCheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                  Approve
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
                    Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                    <span className="font-semibold text-slate-900">{totalCount}</span> results
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
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-200 scale-105'
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

export default RejectedUsers;