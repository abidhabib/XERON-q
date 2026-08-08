import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineChevronUp, 
  HiOutlineChevronDown, 
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineExclamation,
  HiOutlinePencil,
  HiOutlineFilter,
  HiOutlineShieldCheck,
  HiOutlineBan
} from 'react-icons/hi';
import Modal from 'react-modal';
import { FaSpinner } from 'react-icons/fa';
import useBlockUser from '../Hooks/useBlockUser';
import { RemoveTrailingZeros } from '../../../utils/utils';
import { User } from 'lucide-react';

Modal.setAppElement('#root');

// --- Sub-components for cleaner code ---

const StatusBadge = ({ isBlocked }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    isBlocked 
      ? 'bg-red-100 text-red-800' 
      : 'bg-green-100 text-green-800'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
      isBlocked ? 'bg-red-500' : 'bg-green-500'
    }`} />
    {isBlocked ? 'Blocked' : 'Active'}
  </span>
);

const ActionButton = ({ onClick, variant = 'secondary', children, disabled, title }) => {
  const baseStyles = "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500 border border-transparent",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 shadow-sm",
    danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50 focus:ring-red-500 shadow-sm",
    warning: "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 focus:ring-amber-500 shadow-sm",
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

const ApprovedUsers = () => {
  const [data, setData] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({
    id: true,
    name: true,
    email: true,
    balance: true,
    total_withdrawal: true,
    team: true,
    level: true,
    refer_by: true,
    actions: true
  });
  const { toggleBlock, loading: loadingBlockUser } = useBlockUser();
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    actionType: null,
    userId: null,
    userName: '',
    actionCallback: null
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/approved-users`, {
        params: {
          page: currentPage,
          perPage: itemsPerPage,
          searchTerm: searchTerm,
          sortKey: sortConfig.key,
          sortDirection: sortConfig.direction
        }
      });
      
      if (response.data.success) {
        setData(response.data.approvedUsers);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching approved users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openConfirmation = (userId, userName, actionType, callback) => {
    setConfirmationModal({
      isOpen: true,
      userId,
      userName,
      actionType,
      actionCallback: callback
    });
  };

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

  const closeConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
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

  const handleRejectClick = (userId, userName) => {
    openConfirmation(
      userId, 
      userName,
      'reject',
      async (id) => {
        try {
          await axios.put(`${import.meta.env.VITE_API_BASE_URL}/rejectUserCurrMin/${id}`);
          fetchData();
        } catch (error) {
          console.error("Error rejecting user:", error);
        }
      }
    );
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setModalIsOpen(true);
  };

  const handleSave = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/updateUser`, editingUser);
      setModalIsOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) return <div className="w-3 h-3 ml-1 opacity-0" />; // Placeholder to prevent layout shift
    return sortConfig.direction === 'asc' 
      ? <HiOutlineChevronUp className="inline ml-1 w-3 h-3 text-indigo-600" /> 
      : <HiOutlineChevronDown className="inline ml-1 w-3 h-3 text-indigo-600" />;
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const toggleColumn = (column) => {
    setSelectedColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const visibleColumns = useMemo(() => {
    return Object.entries(selectedColumns).filter(([_, visible]) => visible).map(([key]) => key);
  }, [selectedColumns]);

  // Helper for consistent currency display
  const formatCurrency = (val) => `$${RemoveTrailingZeros(val || 0)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmationModal.isOpen}
        onRequestClose={closeConfirmation}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all">
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full ${
              confirmationModal.actionType === 'reject' ? 'bg-red-100' : 
              confirmationModal.actionType === 'block' ? 'bg-amber-100' : 'bg-green-100'
            }`}>
              {confirmationModal.actionType === 'reject' ? (
                <HiOutlineBan className="h-7 w-7 text-red-600" />
              ) : confirmationModal.actionType === 'block' ? (
                <HiOutlineLockClosed className="h-7 w-7 text-amber-600" />
              ) : (
                <HiOutlineLockOpen className="h-7 w-7 text-green-600" />
              )}
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900 capitalize">
              {confirmationModal.actionType} User
            </h3>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to <span className="font-semibold">{confirmationModal.actionType}</span> user{' '}
              <span className="font-bold text-slate-900">{confirmationModal.userName}</span>?
              {confirmationModal.actionType === 'reject' && (
                <span className="block mt-2 text-xs font-medium text-red-600 bg-red-50 py-1 px-2 rounded inline-block">
                  ⚠️ This action cannot be undone.
                </span>
              )}
            </p>
          </div>
          
          <div className="mt-8 flex justify-center space-x-3">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
              onClick={closeConfirmation}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-offset-2 ${
                confirmationModal.actionType === 'reject' 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : confirmationModal.actionType === 'block'
                  ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
              }`}
              onClick={handleConfirmAction}
            >
              Yes, {confirmationModal.actionType}
            </button>
          </div>
        </div>
      </Modal>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-amber-600 shadow-lg shadow-indigo-200">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight"> All Approved Users</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  className="flex items-center px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <HiOutlineFilter className="w-4 h-4 mr-2 text-slate-500" />
                  Columns
                </button>
                
                {filterMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-20 p-2 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Toggle Visibility</div>
                      {Object.keys(selectedColumns).map(column => (
                        column !== 'actions' && (
                          <label key={column} className="flex items-center px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedColumns[column]}
                              onChange={() => toggleColumn(column)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span className="ml-3 text-sm text-slate-700 capitalize font-medium">
                              {column.replace(/_/g, ' ')}
                            </span>
                          </label>
                        )
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <button 
                onClick={fetchData}
                className="flex items-center px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin w-4 h-4 text-indigo-600" />
                ) : (
                  <>
                    <HiOutlineRefresh className="w-4 h-4 mr-2 text-slate-500" />
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Search & Stats Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="w-full lg:w-96 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                placeholder="Search by name, email, or ID..."
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
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value={25}>25 Rows</option>
                  <option value={50}>50 Rows</option>
                  <option value={100}>100 Rows</option>
                </select>
              </div>
              
              <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>
              
              <div className="text-sm text-slate-600 font-medium">
                <span className="text-slate-900 font-bold">{totalCount.toLocaleString()}</span> Total Users
                {searchTerm && (
                  <span className="ml-2 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">
                    {data.length} Matches
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          {isLoading ? (
            // Skeleton Loading State
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
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                  <tr>
                    {visibleColumns.map(column => {
                      if (column === 'actions') {
                        return (
                          <th key={column} className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        );
                      }
                      
                      const labels = {
                        id: 'User ID',
                        name: 'Member',
                        email: 'Email Address',
                        balance: 'Balance',
                        total_withdrawal: 'Withdrawn',
                        team: 'Team Size',
                        level: 'Category',
                        refer_by: 'Referrer'
                      };
                      
                      return (
                        <th 
                          key={column}
                          className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 transition-colors group"
                          onClick={() => requestSort(column)}
                        >
                          <div className="flex items-center">
                            {labels[column]}
                            {renderSortIndicator(column)}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.length > 0 ? data.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                      {visibleColumns.map(column => {
                        if (column === 'actions') {
                          return (
                            <td key={column} className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                <ActionButton 
                                  onClick={() => handleEdit(user)} 
                                  variant="primary"
                                  title="Edit Details"
                                >
                                  <HiOutlinePencil className="w-3.5 h-3.5 mr-1.5" />
                                  Edit
                                </ActionButton>
                                
                                <ActionButton
                                  onClick={() => handleBlockClick(user.id, user.blocked ?? 0, user.name)}
                                  disabled={loadingBlockUser}
                                  variant={user.blocked ? "warning" : "secondary"}
                                  title={user.blocked ? 'Unblock User' : 'Block User'}
                                >
                                  {user.blocked ? (
                                    <>
                                      <HiOutlineLockOpen className="w-3.5 h-3.5 mr-1.5" />
                                      Unblock
                                    </>
                                  ) : (
                                    <>
                                      <HiOutlineLockClosed className="w-3.5 h-3.5 mr-1.5" />
                                      Block
                                    </>
                                  )}
                                </ActionButton>
                                
                                <ActionButton 
                                  onClick={() => handleRejectClick(user.id, user.name)}
                                  variant="danger"
                                  title="Reject Application"
                                >
                                  <HiOutlineX className="w-3.5 h-3.5 mr-1.5" />
                                  Reject
                                </ActionButton>
                              </div>
                            </td>
                          );
                        }
                        
                        let cellContent;
                        switch (column) {
                          case 'id':
                            cellContent = (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-xs font-mono font-medium text-slate-600">
                                #{user.id}
                              </span>
                            );
                            break;
                          case 'balance':
                          case 'total_withdrawal':
                            cellContent = (
                              <span className="font-mono font-medium text-slate-700">
                                {formatCurrency(user[column])}
                              </span>
                            );
                            break;
                          case 'name':
                            cellContent = (
                              <div className="flex items-center">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center ring-2 ring-white shadow-sm mr-3">
                                  <span className="text-indigo-700 font-bold text-sm">
                                    {(user.name || '?')[0].toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-900 text-sm">{user.name}</span>
                                  <StatusBadge isBlocked={!!user.blocked} />
                                </div>
                              </div>
                            );
                            break;
                          case 'email':
                            cellContent = <span className="text-slate-600 text-sm">{user.email}</span>;
                            break;
                          default:
                            cellContent = <span className="text-slate-600 text-sm">{user[column] ?? '-'}</span>;
                        }
                        
                        return (
                          <td key={column} className="px-6 py-4 whitespace-nowrap">
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={visibleColumns.length} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <HiOutlineUserGroup className="w-8 h-8 text-slate-300" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-1">No users found</h3>
                          <p className="text-slate-500 text-sm text-center">
                            {searchTerm 
                              ? `We couldn't find any users matching "${searchTerm}"` 
                              : 'There are no approved users in the system yet.'}
                          </p>
                          {searchTerm && (
                            <button 
                              onClick={() => setSearchTerm('')}
                              className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Footer */}
          {!isLoading && totalPages > 1 && (
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
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
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
        </div>

        {/* Edit User Modal */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full mx-auto overflow-hidden shadow-2xl transform transition-all">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit User Profile</h2>
                  <p className="text-sm text-slate-500 mt-1">Update account details for <span className="font-semibold text-slate-700">{editingUser.name}</span></p>
                </div>
                <button 
                  onClick={() => setModalIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Balance ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editingUser.balance || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, balance: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Team ID</label>
                    <input 
                      type="number" 
                      value={editingUser.team || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, team: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
              <button
                onClick={() => setModalIsOpen(false)}
                className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all hover:shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default ApprovedUsers;