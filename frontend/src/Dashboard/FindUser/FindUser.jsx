import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    HiOutlineSearch,
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiOutlineX,
    HiOutlineRefresh,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineUserGroup,
    HiOutlineLockOpen,
    HiOutlineExclamation,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineFilter,
    HiOutlineUserCircle,
    HiOutlineMail,
    HiOutlinePhone,
    HiOutlineCurrencyDollar,
    HiOutlineKey,
    HiOutlineUserRemove,
    HiOutlinePencil,
    HiOutlineEye
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';
import useBlockUser from '../Hooks/useBlockUser';

const FindUser = () => {
    const [data, setData] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [editingUser, setEditingUser] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [inputTerm, setInputTerm] = useState('');
    const [refererSearch, setRefererSearch] = useState('');
    const [searchMode, setSearchMode] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState({
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        refer_by: true,
        team: true,
        balance: true,
        status: true,
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

    // Fetch user data
    const fetchData = useCallback(async () => {
        if (!searchMode) return;
        
        setIsLoading(true);
        try {
            let response;
            
            if (searchMode === 'general') {
                response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/find-users`, {
                    params: {
                        page: currentPage,
                        perPage: itemsPerPage,
                        searchTerm: searchTerm,
                        sortKey: sortConfig.key,
                        sortDirection: sortConfig.direction
                    }
                });
            } 
            else if (searchMode === 'referer') {
                response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/find-referer-users`, {
                    params: {
                        refererId: refererSearch,
                        page: currentPage,
                        perPage: itemsPerPage,
                        sortKey: sortConfig.key,
                        sortDirection: sortConfig.direction
                    }
                });
            }

            if (response?.data?.success) {
                setData(response.data.users);
                setTotalCount(response.data.totalCount);
                setTotalPages(response.data.totalPages);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchMode, searchTerm, refererSearch, currentPage, itemsPerPage, sortConfig]);

    // Refetch data based on current mode
    const refetchData = useCallback(() => {
        if (searchMode) {
            fetchData();
        }
    }, [fetchData, searchMode]);

    useEffect(() => {
        if (searchMode) {
            fetchData();
        }
    }, [fetchData, searchMode]);

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
            refetchData();
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

    // Determine user status
    const getUserStatus = (user) => {
        if (user.blocked === 1) {
            return {
                text: 'Blocked',
                color: 'bg-red-100 text-red-800 border border-red-200',
                icon: <HiOutlineLockOpen className="w-3 h-3" />
            };
        }

        if (user.payment_ok === 1 && user.approved === 1) {
            return {
                text: 'Active',
                color: 'bg-green-100 text-green-800 border border-green-200',
                icon: <HiOutlineCheckCircle className="w-3 h-3" />
            };
        }

        if (user.payment_ok === 1 && user.approved === 0) {
            return {
                text: 'Pending Approval',
                color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
                icon: <HiOutlineClock className="w-3 h-3" />
            };
        }

        if (user.payment_ok === 0 && user.approved === 0) {
            return {
                text: 'Pending',
                color: 'bg-blue-100 text-blue-800 border border-blue-200',
                icon: <HiOutlineClock className="w-3 h-3" />
            };
        }

        return {
            text: 'Unknown',
            color: 'bg-gray-100 text-gray-800 border border-gray-200',
            icon: <HiOutlineClock className="w-3 h-3" />
        };
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

    const handleApproveClick = (userId, userName) => {
        openConfirmation(
            userId,
            userName,
            'approve',
            async (id) => {
                try {
                    await axios.put(`${import.meta.env.VITE_API_BASE_URL}/approveUser/${id}`);
                    refetchData();
                } catch (error) {
                    console.error("Error approving user:", error);
                }
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
                    refetchData();
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
            refetchData();
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
            ? <HiOutlineChevronUp className="w-3 h-3 ml-1" />
            : <HiOutlineChevronDown className="w-3 h-3 ml-1" />;
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

    // General search handler
    const handleGeneralSearch = () => {
        if (!inputTerm.trim()) return;
        setSearchTerm(inputTerm);
        setCurrentPage(1);
        setSearchMode('general');
    };

    // Referer search handler
    const handleRefererSearch = () => {
        if (!refererSearch.trim()) return;
        setCurrentPage(1);
        setSearchMode('referer');
    };

    const toggleColumn = (column) => {
        setSelectedColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const handleKeyPress = (e, handler) => {
        if (e.key === 'Enter') {
            handler();
        }
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
                                <HiOutlineUserGroup className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Find Users</h1>
                                <p className="text-sm text-gray-600 mt-1">Search and manage users</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <div className="hidden sm:flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg">
                                <HiOutlineUserCircle className="w-4 h-4 text-indigo-600 mr-2" />
                                <span className="text-sm font-medium text-gray-900">{totalCount}</span>
                                <span className="text-sm text-gray-600 ml-1">users</span>
                            </div>
                            
                            <button
                                onClick={refetchData}
                                disabled={isLoading || !searchMode}
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

                    {/* Search Controls */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            {/* General Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    General Search
                                </label>
                                <div className="flex">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <HiOutlineSearch className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={inputTerm}
                                            onChange={(e) => setInputTerm(e.target.value)}
                                            onKeyPress={(e) => handleKeyPress(e, handleGeneralSearch)}
                                            placeholder="Search by ID, email, phone, or TXID..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                        />
                                    </div>
                                    <button
                                        disabled={!inputTerm.trim()}
                                        onClick={handleGeneralSearch}
                                        className={`px-4 py-2.5 rounded-r-lg transition-colors ${
                                            inputTerm.trim()
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>

                            {/* Referer Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search by Referer
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        placeholder="Enter Referer User ID..."
                                        value={refererSearch}
                                        onChange={(e) => setRefererSearch(e.target.value)}
                                        onKeyPress={(e) => handleKeyPress(e, handleRefererSearch)}
                                        className="w-full px-4 py-2.5 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    />
                                    <button
                                        disabled={!refererSearch.trim()}
                                        onClick={handleRefererSearch}
                                        className={`px-4 py-2.5 rounded-r-lg transition-colors ${
                                            refererSearch.trim()
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Find Referer
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-4 border-t border-gray-200">
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
                                        <option value={200}>200</option>
                                    </select>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        const menu = document.getElementById('columnMenu');
                                        if (menu) menu.classList.toggle('hidden');
                                    }}
                                    className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <HiOutlineFilter className="w-4 h-4 mr-2" />
                                    Columns
                                </button>
                                
                                <div id="columnMenu" className="hidden absolute mt-32 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
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
                            </div>
                            
                            {searchMode && (
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-900">{data.length}</span> users found
                                    {searchMode === 'general' && searchTerm && (
                                        <span className="ml-2">• Searching for "{searchTerm}"</span>
                                    )}
                                    {searchMode === 'referer' && (
                                        <span className="ml-2">• Referer ID: {refererSearch}</span>
                                    )}
                                </div>
                            )}
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
                        {!searchMode ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                    <HiOutlineSearch className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Search for users</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Enter a search term above to find users by ID, email, phone, TXID, or search by referer
                                </p>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                    <HiOutlineUserGroup className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    {searchMode === 'general' 
                                        ? `No users found for "${searchTerm}"`
                                        : `No users found for referer ID "${refererSearch}"`
                                    }
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {Object.entries(selectedColumns).map(([column, visible]) => {
                                                    if (!visible) return null;
                                                    
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
                                                        phoneNumber: 'Phone',
                                                        refer_by: 'Referrer',
                                                        team: 'Team',
                                                        balance: 'Balance',
                                                        status: 'Status'
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
                                            {data.map(user => {
                                                const status = getUserStatus(user);
                                                return (
                                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                        {selectedColumns.id && (
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    #{user.id}
                                                                </div>
                                                            </td>
                                                        )}
                                                        
                                                        {selectedColumns.name && (
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center">
                                                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                                        <HiOutlineUserCircle className="w-4 h-4 text-indigo-600" />
                                                                    </div>
                                                                    <span className="font-medium">{user.name}</span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        
                                                        {selectedColumns.email && (
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900 flex items-center">
                                                                    <HiOutlineMail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                                                    <span className="truncate">{user.email}</span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        
                                                        {selectedColumns.phoneNumber && (
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900 flex items-center">
                                                                    <HiOutlinePhone className="w-4 h-4 text-gray-400 mr-2" />
                                                                    {user.phoneNumber || 'N/A'}
                                                                </div>
                                                            </td>
                                                        )}
                                                        
                                                        {selectedColumns.refer_by && (
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900">
                                                                    {user.refer_by || 'N/A'}
                                                                </div>
                                                            </td>
                                                        )}
                                                        
                                                        {selectedColumns.team && (
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900">
                                                                    {user.team || 'N/A'}
                                                                </div>
                                                            </td>
                                                        )}
                                                        
                                                        {selectedColumns.balance && (
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900 flex items-center">
                                                                    <HiOutlineCurrencyDollar className="w-4 h-4 text-gray-400 mr-2" />
                                                                    ${user.balance}
                                                                </div>
                                                            </td>
                                                        )}
                                                        
                                                        {selectedColumns.status && (
                                                            <td className="px-6 py-4">
                                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                                    {status.icon}
                                                                    <span className="ml-1.5">{status.text}</span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        
                                                        {selectedColumns.actions && (
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center space-x-1">
                                                                    <button
                                                                        onClick={() => handleEdit(user)}
                                                                        className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                                        title="Edit user"
                                                                    >
                                                                        <HiOutlinePencil className="w-4 h-4" />
                                                                    </button>
                                                                    
                                                                    <button
                                                                        onClick={() => handleApproveClick(user.id, user.name)}
                                                                        className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                        title="Approve user"
                                                                    >
                                                                        <HiOutlineCheckCircle className="w-4 h-4" />
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
                                                                        <HiOutlineUserRemove className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
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
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* Edit User Modal */}
            {modalIsOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full animate-fadeIn max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
                                    <p className="text-sm text-gray-600 mt-1">ID: #{editingUser.id}</p>
                                </div>
                                <button
                                    onClick={() => setModalIsOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <HiOutlineX className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={editingUser.phoneNumber || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    />
                                </div>
                                
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
                                        TXID
                                    </label>
                                    <input
                                        type="text"
                                        value={editingUser.trx_id || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, trx_id: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors font-mono"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Total Withdrawal ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editingUser.total_withdrawal || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, total_withdrawal: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    />
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
                </div>
            )}
        </div>
    );
};

export default FindUser;