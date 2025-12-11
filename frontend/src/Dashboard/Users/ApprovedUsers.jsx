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
  HiOutlineLockOpen,
  HiOutlineExclamation,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlineFilter,
  HiOutlineDotsVertical
} from 'react-icons/hi';
import Modal from 'react-modal';
import { FaSpinner } from 'react-icons/fa';
import useBlockUser from '../Hooks/useBlockUser';
import { RemoveTrailingZeros } from '../../../utils/utils';

Modal.setAppElement('#root');

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

  // Block user with confirmation
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

  // Reject user with confirmation
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
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' 
      ? <HiOutlineChevronUp className="inline ml-1 w-3 h-3" /> 
      : <HiOutlineChevronDown className="inline ml-1 w-3 h-3" />;
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

  const toggleColumn = (column) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const visibleColumns = useMemo(() => {
    return Object.entries(selectedColumns).filter(([_, visible]) => visible).map(([key]) => key);
  }, [selectedColumns]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmationModal.isOpen}
        onRequestClose={closeConfirmation}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <HiOutlineExclamation className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">
              Confirm {confirmationModal.actionType}
            </h3>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Are you sure you want to {confirmationModal.actionType} user{' '}
              <span className="font-medium text-gray-900">{confirmationModal.userName}</span>?
            </p>
            {confirmationModal.actionType === 'reject' && (
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
                confirmationModal.actionType === 'reject' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              onClick={handleConfirmAction}
            >
              {confirmationModal.actionType === 'block' ? 'Block User' : 
               confirmationModal.actionType === 'unblock' ? 'Unblock User' : 
               'Reject User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-white shadow-sm border border-gray-200">
                <HiOutlineUserGroup className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Approved Users</h1>
                <p className="text-sm text-gray-600 mt-1">Manage approved user accounts</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <HiOutlineFilter className="w-4 h-4 mr-2" />
                  Columns
                </button>
                
                {filterMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setFilterMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-2">
                      {Object.keys(selectedColumns).map(column => (
                        column !== 'actions' && (
                          <label key={column} className="flex items-center px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedColumns[column]}
                              onChange={() => toggleColumn(column)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">
                              {column.replace('_', ' ')}
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
                className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin w-4 h-4" />
                ) : (
                  <>
                    <HiOutlineRefresh className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="Search users by name, email, or ID..."
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
              </div>
            </div>
            
            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{totalCount}</span> total users
                {searchTerm && (
                  <span className="ml-2">
                    • <span className="font-medium text-gray-900">{data.length}</span> results found
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
            <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.map(column => {
                      if (column === 'actions') {
                        return (
                          <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        );
                      }
                      
                      const labels = {
                        id: 'ID',
                        name: 'Name',
                        email: 'Email',
                        balance: 'Balance',
                        total_withdrawal: 'Withdrawal',
                        team: 'Team',
                        level: 'Level',
                        refer_by: 'Referrer'
                      };
                      
                      return (
                        <th 
                          key={column}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
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
                <tbody className="divide-y divide-gray-200">
                  {data.length > 0 ? data.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.map(column => {
                        if (column === 'actions') {
                          return (
                            <td key={column} className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                <button 
                                  onClick={() => handleEdit(user)}
                                  className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Edit user"
                                >
                                  <HiOutlinePencil className="w-4 h-4" />
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
                                  onClick={() => handleRejectClick(user.id, user.name)}
                                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Reject user"
                                >
                                  <HiOutlineX className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          );
                        }
                        
                        let cellContent;
                        switch (column) {
                          case 'id':
                            cellContent = <span className="font-medium text-gray-900">#{user.id}</span>;
                            break;
                          case 'balance':
                          case 'total_withdrawal':
                            cellContent = <span className="font-medium">${RemoveTrailingZeros(user[column])}</span>;
                            break;
                          case 'name':
                            cellContent = <div className="flex items-center">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                                <HiOutlineUser className="w-4 h-4 text-indigo-600" />
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>;
                            break;
                          default:
                            cellContent = <span className="text-gray-600">{user[column] || '-'}</span>;
                        }
                        
                        return (
                          <td key={column} className="px-6 py-4 whitespace-nowrap text-sm">
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={visibleColumns.length} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <HiOutlineUserGroup className="w-12 h-12 text-gray-400 mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                          <p className="text-gray-500 max-w-md">
                            {searchTerm ? 'Try adjusting your search criteria' : 'No approved users in the system'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
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
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span> of <span className="font-medium">{totalCount}</span> users
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
                                ? 'bg-indigo-600 text-white'
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
          </div>
        )}

        {/* Edit User Modal */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <div className="bg-white rounded-xl max-w-lg w-full mx-auto overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
                  <p className="text-sm text-gray-600 mt-1">Update user information</p>
                </div>
                <button 
                  onClick={() => setModalIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiOutlineX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name
                  </label>
                  <input 
                    type="text" 
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Balance ($)
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editingUser.balance || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, balance: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Team
                    </label>
                    <input 
                      type="number" 
                      value={editingUser.team || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, team: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setModalIsOpen(false)}
                  className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default ApprovedUsers;