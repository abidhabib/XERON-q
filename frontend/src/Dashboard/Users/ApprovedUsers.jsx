import  { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Sidebar } from "../SideBarSection/Sidebar";
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
  HiOutlineExclamation
} from 'react-icons/hi';
import Modal from 'react-modal';
import { FaSpinner } from 'react-icons/fa';
import useBlockUser from '../Hooks/useBlockUser';

Modal.setAppElement('#root');

const ApprovedUsers = () => {
  const [data, setData] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toggleBlock, loading: loadingBlockUser } = useBlockUser();
  console.log(data);
  
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
      ? <HiOutlineChevronUp className="inline ml-1" /> 
      : <HiOutlineChevronDown className="inline ml-1" />;
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmationModal.isOpen}
        onRequestClose={closeConfirmation}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className=" mb-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <HiOutlineExclamation className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="ml-4 text-lg font-medium text-gray-900 text-center mt-2">
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
      </Modal>
      
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-xl mr-4">
                <HiOutlineUserGroup className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Approved Users</h1>
              </div>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <HiOutlineRefresh className="mr-2" /> Refresh
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
                placeholder="Search by name, email or ID..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3">
              <label className="text-sm text-gray-600 mr-2">Per Page:</label>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-transparent py-2 focus:outline-none"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-indigo-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('id')}
                    >
                      <div className="flex items-center">
                        ID {renderSortIndicator('id')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        Name {renderSortIndicator('name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('email')}
                    >
                      <div className="flex items-center">
                        Email {renderSortIndicator('email')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('refer_by')}
                    >
                      <div className="flex items-center">
                        Referrer {renderSortIndicator('refer_by')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('password')}
                    >
                      <div className="flex items-center">
                        Password {renderSortIndicator('password')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('balance')}
                    >
                      <div className="flex items-center">
                        Balance {renderSortIndicator('balance')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('trx_id')}
                    >
                      <div className="flex items-center">
                        TXID {renderSortIndicator('trx_id')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('total_withdrawal')}
                    >
                      <div className="flex items-center">
                        Withdrawal {renderSortIndicator('total_withdrawal')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('team')}
                    >
                      <div className="flex items-center">
                        Team {renderSortIndicator('team')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.length > 0 ? data.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.refer_by}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.password}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.balance}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.trx_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.total_withdrawal}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.team}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          
                          {/* Block/Unblock Button */}
                          <button
                            onClick={() => handleBlockClick(user.id, user.blocked ?? 0, user.name)}
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
                            onClick={() => handleRejectClick(user.id, user.name)}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <HiOutlineUser className="w-12 h-12 text-gray-400 mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No approved users found</h3>
                          <p className="text-gray-500">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-indigo-50 px-6 py-3 flex flex-col md:flex-row items-center justify-between border-t border-indigo-100 gap-4">
                <div className="text-sm text-indigo-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                  </span> of <span className="font-medium">{totalCount}</span> users
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`flex items-center px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'}`}
                  >
                    <HiOutlineChevronLeft className="mr-1" /> Previous
                  </button>
                  
                  <div className="flex items-center bg-white px-3 py-1 rounded-md border border-indigo-200">
                    <span className="text-sm font-medium text-indigo-700">Page {currentPage} of {totalPages}</span>
                  </div>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-3 py-1 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'}`}
                  >
                    Next <HiOutlineChevronRight className="ml-1" />
                  </button>
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
          <div className="bg-white rounded-xl max-w-2xl w-full mx-auto p-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Edit User: {editingUser.name}</h2>
              <button 
                onClick={() => setModalIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <HiOutlineX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input 
                  type="text" 
                  value={editingUser.id || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="text" 
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                <input 
                  type="number" 
                  value={editingUser.balance || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, balance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <input 
                  type="number" 
                  value={editingUser.team || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, team: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TXID</label>
                <input 
                  type="text" 
                  value={editingUser.trx_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, trx_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Withdrawal</label>
                <input 
                  type="number" 
                  value={editingUser.total_withdrawal || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, total_withdrawal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setModalIsOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ApprovedUsers;