import { useState, useEffect, useCallback, useRef } from 'react';
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
    HiOutlineLockClosed,
    HiOutlineLockOpen,
    HiOutlineExclamation,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineFilter,
    HiOutlineMail,
    HiOutlinePhone,
    HiOutlineCurrencyDollar,
    HiOutlineUserRemove,
    HiOutlinePencil,
    HiOutlineBan,
    HiOutlineShieldCheck
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';
import useBlockUser from '../Hooks/useBlockUser';

// --- Reusable UI Components ---

const ActionButton = ({ onClick, variant = 'secondary', children, disabled, title, className = '' }) => {
    const baseStyles = "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500 border border-transparent",
        secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500 shadow-sm",
        success: "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 focus:ring-emerald-500 shadow-sm",
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

const StatusBadge = ({ user }) => {
    let config;
    
    if (user.blocked === 1) {
        config = { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: HiOutlineBan, label: 'Blocked' };
    } else if (user.payment_ok === 1 && user.approved === 1) {
        config = { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: HiOutlineShieldCheck, label: 'Active' };
    } else if (user.payment_ok === 1 && user.approved === 0) {
        config = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: HiOutlineClock, label: 'Pending Approval' };
    } else if (user.payment_ok === 0 && user.approved === 0) {
        config = { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: HiOutlineClock, label: 'Pending Payment' };
    } else {
        config = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: HiOutlineClock, label: 'Unknown' };
    }

    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.bg} ${config.text} ${config.border}`}>
            <Icon className="w-2.5 h-2.5 mr-1" />
            {config.label}
        </span>
    );
};

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
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef(null);

    const [selectedColumns, setSelectedColumns] = useState({
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        refer_by: true,
        team: true,
        balance: true,
        actions: true
    });

    const { toggleBlock, loading: loadingBlockUser } = useBlockUser();

    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        actionType: null,
        userId: null,
        userName: '',
        actionCallback: null
    });

    // Close column menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
                setColumnMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            } else if (searchMode === 'referer') {
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

    const refetchData = useCallback(() => {
        if (searchMode) fetchData();
    }, [fetchData, searchMode]);

    useEffect(() => {
        if (searchMode) fetchData();
    }, [fetchData, searchMode]);

    const openConfirmation = (userId, userName, actionType, callback) => {
        setConfirmationModal({ isOpen: true, userId, userName, actionType, actionCallback: callback });
    };

    const handleConfirmAction = async () => {
        if (confirmationModal.actionCallback) {
            await confirmationModal.actionCallback(confirmationModal.userId);
            refetchData();
        }
        setConfirmationModal({ isOpen: false, actionType: null, userId: null, userName: '', actionCallback: null });
    };

    const closeConfirmation = () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleBlockClick = (userId, blockedStatus, userName) => {
        openConfirmation(userId, userName, blockedStatus ? 'unblock' : 'block', async (id) => {
            await toggleBlock(id, blockedStatus, (id, newStatus) => {
                setData(prev => prev.map(u => u.id === id ? { ...u, blocked: newStatus } : u));
            });
        });
    };

    const handleApproveClick = (userId, userName) => {
        openConfirmation(userId, userName, 'approve', async (id) => {
            try {
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/approveUser/${id}`);
                refetchData();
            } catch (error) {
                console.error("Error approving user:", error);
            }
        });
    };

    const handleRejectClick = (userId, userName) => {
        openConfirmation(userId, userName, 'reject', async (id) => {
            try {
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/rejectUserCurrMin/${id}`);
                refetchData();
            } catch (error) {
                console.error("Error rejecting user:", error);
            }
        });
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
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const renderSortIndicator = (key) => {
        if (sortConfig.key !== key) return <div className="w-3 h-3 ml-1 opacity-0" />;
        return sortConfig.direction === 'asc'
            ? <HiOutlineChevronUp className="w-3 h-3 ml-1 text-indigo-600" />
            : <HiOutlineChevronDown className="w-3 h-3 ml-1 text-indigo-600" />;
    };

    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
    const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

    const handleGeneralSearch = () => {
        if (!inputTerm.trim()) return;
        setSearchTerm(inputTerm);
        setCurrentPage(1);
        setSearchMode('general');
    };

    const handleRefererSearch = () => {
        if (!refererSearch.trim()) return;
        setCurrentPage(1);
        setSearchMode('referer');
    };

    const toggleColumn = (column) => {
        setSelectedColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    const handleKeyPress = (e, handler) => { if (e.key === 'Enter') handler(); };

    const visibleColumns = Object.entries(selectedColumns).filter(([_, visible]) => visible);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Confirmation Modal */}
            {confirmationModal.isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
                        <div className="text-center">
                            <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full ${
                                confirmationModal.actionType === 'reject' ? 'bg-rose-100' :
                                confirmationModal.actionType === 'block' ? 'bg-amber-100' :
                                confirmationModal.actionType === 'approve' ? 'bg-emerald-100' : 'bg-indigo-100'
                            }`}>
                                {confirmationModal.actionType === 'reject' ? <HiOutlineUserRemove className="h-7 w-7 text-rose-600" /> :
                                 confirmationModal.actionType === 'block' ? <HiOutlineLockClosed className="h-7 w-7 text-amber-600" /> :
                                 confirmationModal.actionType === 'approve' ? <HiOutlineCheckCircle className="h-7 w-7 text-emerald-600" /> :
                                 <HiOutlineLockOpen className="h-7 w-7 text-indigo-600" />}
                            </div>
                            <h3 className="mt-4 text-xl font-bold text-slate-900 capitalize">{confirmationModal.actionType} User</h3>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                                Are you sure you want to {confirmationModal.actionType} user{' '}
                                <span className="font-semibold text-slate-900">{confirmationModal.userName}</span>?
                            </p>
                        </div>
                        <div className="mt-8 flex justify-center space-x-3">
                            <button onClick={closeConfirmation} className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={handleConfirmAction} className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-md transition-all hover:shadow-lg ${
                                confirmationModal.actionType === 'reject' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' :
                                confirmationModal.actionType === 'block' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' :
                                confirmationModal.actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                                'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            }`}>Yes, {confirmationModal.actionType}</button>
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
                            <div className="p-3 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
                                <HiOutlineUserGroup className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Find Users</h1>
                                <p className="text-sm text-slate-500 mt-0.5">Global user search and management</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {searchMode && (
                                <div className="hidden sm:flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <span className="text-sm font-bold text-slate-900">{totalCount.toLocaleString()}</span>
                                    <span className="text-sm text-slate-500 ml-1">results</span>
                                </div>
                            )}
                            
                            <button
                                onClick={refetchData}
                                disabled={isLoading || !searchMode}
                                className="flex items-center px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
                            >
                                {isLoading ? <FaSpinner className="animate-spin w-4 h-4 text-indigo-600 mr-2" /> : <HiOutlineRefresh className="w-4 h-4 text-slate-500 mr-2" />}
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Search Controls Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
                        {/* Search Type Tabs */}
                        <div className="flex space-x-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
                            <button
                                onClick={() => { setSearchMode(null); setData([]); setTotalCount(0); }}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${!searchMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                New Search
                            </button>
                            <button
                                onClick={() => setSearchMode(searchMode === 'general' ? 'general' : null)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${searchMode === 'general' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                General
                            </button>
                            <button
                                onClick={() => setSearchMode(searchMode === 'referer' ? 'referer' : null)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${searchMode === 'referer' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                By Referer
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            {/* General Search */}
                            <div className={`transition-opacity duration-200 ${searchMode === 'referer' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">General Search</label>
                                <div className="flex">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <HiOutlineSearch className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={inputTerm}
                                            onChange={(e) => setInputTerm(e.target.value)}
                                            onKeyPress={(e) => handleKeyPress(e, handleGeneralSearch)}
                                            placeholder="ID, email, phone, or TXID..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-l-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                        />
                                    </div>
                                    <button
                                        disabled={!inputTerm.trim()}
                                        onClick={handleGeneralSearch}
                                        className={`px-5 py-2.5 rounded-r-lg text-sm font-medium transition-all ${
                                            inputTerm.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>

                            {/* Referer Search */}
                            <div className={`transition-opacity duration-200 ${searchMode === 'general' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Search by Referer ID</label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        placeholder="Enter Referer User ID..."
                                        value={refererSearch}
                                        onChange={(e) => setRefererSearch(e.target.value)}
                                        onKeyPress={(e) => handleKeyPress(e, handleRefererSearch)}
                                        className="flex-1 px-4 py-2.5 rounded-l-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono"
                                    />
                                    <button
                                        disabled={!refererSearch.trim()}
                                        onClick={handleRefererSearch}
                                        className={`px-5 py-2.5 rounded-r-lg text-sm font-medium transition-all ${
                                            refererSearch.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Find
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Controls Bar */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                    <label className="text-xs font-medium text-slate-500 mr-2">Rows:</label>
                                    <select 
                                        value={itemsPerPage} 
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                        <option value={200}>200</option>
                                    </select>
                                </div>
                                
                                <div className="relative" ref={columnMenuRef}>
                                    <button
                                        onClick={() => setColumnMenuOpen(!columnMenuOpen)}
                                        className="flex items-center px-3 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                    >
                                        <HiOutlineFilter className="w-4 h-4 mr-2 text-slate-500" />
                                        Columns
                                    </button>
                                    
                                    {columnMenuOpen && (
                                        <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-30 p-2 animate-in fade-in zoom-in-95 duration-100">
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
                                    )}
                                </div>
                            </div>
                            
                            {searchMode && (
                                <div className="text-sm text-slate-500">
                                    <span className="font-bold text-slate-900">{totalCount.toLocaleString()}</span> users found
                                    {searchMode === 'general' && searchTerm && (
                                        <span className="ml-1">for "<span className="font-medium text-indigo-600">{searchTerm}</span>"</span>
                                    )}
                                    {searchMode === 'referer' && (
                                        <span className="ml-1">• Referer: <span className="font-mono font-medium text-indigo-600">{refererSearch}</span></span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results Table */}
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
                    ) : !searchMode ? (
                        <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5">
                                <HiOutlineSearch className="w-10 h-10 text-indigo-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Search for Users</h3>
                            <p className="text-slate-500 max-w-md text-sm leading-relaxed">
                                Use the search controls above to find users by ID, email, phone, TXID, or search for all users under a specific referer.
                            </p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <HiOutlineUserGroup className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No users found</h3>
                            <p className="text-slate-500 text-sm max-w-xs">
                                {searchMode === 'general' 
                                    ? `No matches for "${searchTerm}"`
                                    : `No users found for referer ID "${refererSearch}"`
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto flex-1">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                                        <tr>
                                            {visibleColumns.map(([column]) => {
                                                if (column === 'actions') {
                                                    return <th key={column} className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>;
                                                }
                                                
                                                const labels = {
                                                    id: 'ID', name: 'User', email: 'Email', phoneNumber: 'Phone',
                                                    refer_by: 'Referrer', team: 'Team', balance: 'Balance'
                                                };
                                                
                                                return (
                                                    <th 
                                                        key={column}
                                                        className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 transition-colors group"
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
                                        {data.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                                {selectedColumns.id && (
                                                    <td className="px-4 py-3 whitespace-nowrap align-top">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-mono font-medium text-slate-600">#{user.id}</span>
                                                    </td>
                                                )}
                                                
                                                {selectedColumns.name && (
                                                    <td className="px-4 py-3 align-top">
                                                        <div className="flex items-start">
                                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center ring-2 ring-white shadow-sm mr-3 mt-0.5 flex-shrink-0">
                                                                <span className="text-indigo-700 font-bold text-xs">{(user.name || '?')[0].toUpperCase()}</span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-slate-900 text-sm">{user.name || 'N/A'}</div>
                                                                <div className="mt-1"><StatusBadge user={user} /></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                
                                                {selectedColumns.email && (
                                                    <td className="px-4 py-3 align-top">
                                                        <div className="flex items-start text-sm text-slate-600">
                                                            <HiOutlineMail className="w-3.5 h-3.5 text-slate-400 mr-2 mt-0.5 flex-shrink-0" />
                                                            <span className="break-all leading-relaxed">{user.email || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                
                                                {selectedColumns.phoneNumber && (
                                                    <td className="px-4 py-3 whitespace-nowrap align-top">
                                                        <div className="flex items-center text-sm text-slate-600 mt-1">
                                                            <HiOutlinePhone className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
                                                            <span className="font-mono">{user.phoneNumber || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                
                                                {selectedColumns.refer_by && (
                                                    <td className="px-4 py-3 whitespace-nowrap align-top">
                                                        <span className="text-sm text-slate-600 mt-1 inline-block">{user.refer_by || '-'}</span>
                                                    </td>
                                                )}
                                                
                                                {selectedColumns.team && (
                                                    <td className="px-4 py-3 whitespace-nowrap align-top">
                                                        <span className="text-sm text-slate-600 mt-1 inline-block">{user.team || '-'}</span>
                                                    </td>
                                                )}
                                                
                                                {selectedColumns.balance && (
                                                    <td className="px-4 py-3 whitespace-nowrap align-top">
                                                        <div className="flex items-center mt-1">
                                                            <div className="p-1 bg-emerald-50 rounded mr-2">
                                                                <HiOutlineCurrencyDollar className="w-3.5 h-3.5 text-emerald-600" />
                                                            </div>
                                                            <span className="font-mono font-medium text-sm text-slate-900">${user.balance || '0'}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                
                                                {selectedColumns.actions && (
                                                    <td className="px-4 py-3 whitespace-nowrap text-right align-top">
                                                        <div className="flex items-center justify-end space-x-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 mt-0.5">
                                                            <ActionButton onClick={() => handleEdit(user)} variant="primary" title="Edit User">
                                                                <HiOutlinePencil className="w-3.5 h-3.5 mr-1.5" />Edit
                                                            </ActionButton>
                                                            
                                                            {user.approved !== 1 && (
                                                                <ActionButton onClick={() => handleApproveClick(user.id, user.name)} variant="success" title="Approve User">
                                                                    <HiOutlineCheckCircle className="w-3.5 h-3.5 mr-1.5" />Approve
                                                                </ActionButton>
                                                            )}
                                                            
                                                            <ActionButton
                                                                onClick={() => handleBlockClick(user.id, user.blocked ?? 0, user.name)}
                                                                disabled={loadingBlockUser}
                                                                variant={user.blocked ? "warning" : "secondary"}
                                                                title={user.blocked ? 'Unblock' : 'Block'}
                                                            >
                                                                {user.blocked 
                                                                    ? <><HiOutlineLockOpen className="w-3.5 h-3.5 mr-1.5" />Unblock</>
                                                                    : <><HiOutlineLockClosed className="w-3.5 h-3.5 mr-1.5" />Block</>
                                                                }
                                                            </ActionButton>
                                                            
                                                            <ActionButton onClick={() => handleRejectClick(user.id, user.name)} variant="danger" title="Reject User">
                                                                <HiOutlineUserRemove className="w-3.5 h-3.5 mr-1.5" />Reject
                                                            </ActionButton>
                                                        </div>
                                                    </td>
                                                )}
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
                                        <span className="font-semibold text-slate-900">{totalCount.toLocaleString()}</span> results
                                    </div>
                                    
                                    <div className="flex items-center space-x-1">
                                        <button onClick={handlePreviousPage} disabled={currentPage === 1}
                                            className={`p-2 rounded-lg border transition-all ${currentPage === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:bg-white hover:shadow-sm hover:border-slate-400'}`}>
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
                                                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                                                        className={`min-w-[2.5rem] h-10 rounded-lg text-sm font-medium transition-all ${
                                                            currentPage === pageNum ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'
                                                        }`}>
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        <button onClick={handleNextPage} disabled={currentPage === totalPages}
                                            className={`p-2 rounded-lg border transition-all ${currentPage === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:bg-white hover:shadow-sm hover:border-slate-400'}`}>
                                            <HiOutlineChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Edit User Modal */}
            {modalIsOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Edit User</h2>
                                <p className="text-sm text-slate-500 mt-0.5">ID: <span className="font-mono text-slate-700">#{editingUser.id}</span></p>
                            </div>
                            <button onClick={() => setModalIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[
                                    { key: 'name', label: 'Full Name', type: 'text' },
                                    { key: 'email', label: 'Email Address', type: 'email' },
                                    { key: 'phoneNumber', label: 'Phone Number', type: 'text' },
                                    { key: 'balance', label: 'Balance ($)', type: 'number', step: '0.01', mono: true },
                                    { key: 'trx_id', label: 'Transaction ID', type: 'text', mono: true },
                                    { key: 'total_withdrawal', label: 'Total Withdrawal ($)', type: 'number', step: '0.01', mono: true },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.label}</label>
                                        <input
                                            type={field.type}
                                            step={field.step}
                                            value={editingUser[field.key] || ''}
                                            onChange={(e) => setEditingUser({ ...editingUser, [field.key]: e.target.value })}
                                            className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${field.mono ? 'font-mono text-sm' : ''}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
                            <button onClick={() => setModalIsOpen(false)} className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all">Cancel</button>
                            <button onClick={handleSave} className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all hover:shadow-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindUser;