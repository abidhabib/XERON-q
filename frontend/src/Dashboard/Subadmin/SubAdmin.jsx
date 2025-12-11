import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUserPlus, FiEdit, FiTrash2, FiUser, FiShield, FiDollarSign, FiEye, FiEyeOff, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { Sidebar } from '../SideBarSection/Sidebar';

const SubAdminsManagement = () => {
    const [subAdmins, setSubAdmins] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        username: '',
        password: '',
        task: 'ApproveUser'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState({});

    // Fetch sub-admins
    const fetchSubAdmins = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/subadmins`);
            setSubAdmins(response.data.data);
        } catch (err) {
            setError('Failed to fetch sub-admins');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubAdmins();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (isEditing) {
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/subadmins/${formData.id}`, formData);
                setSuccess('Sub-admin updated');
            } else {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/subadmins`, formData);
                setSuccess('Sub-admin created');
            }

            setFormData({ id: '', username: '', password: '', task: 'ApproveUser' });
            setIsEditing(false);
            fetchSubAdmins();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (admin) => {
        setFormData({
            id: admin.id,
            username: admin.username,
            password: '',
            task: admin.task
        });
        setIsEditing(true);
        setShowForm(true);  // Ensure form expands when editing
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this sub-admin?')) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/subadmins/${id}`);
            setSuccess('Sub-admin deleted');
            fetchSubAdmins();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Deletion failed');
        }
    };

    const togglePasswordVisibility = (id) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleForm = () => {
        setShowForm(prev => !prev);
        if (showForm) {
            // Reset form when collapsing
            setFormData({ id: '', username: '', password: '', task: 'ApproveUser' });
            setIsEditing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-start w-full  ">
            <div className="p-4">
            {/* Header */}
                <div className="mb-4 md:mb-6">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center">
                        <FiShield className="mr-2 text-indigo-600" />
                        Sub-Admins Management
                    </h1>
                
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm flex items-center">
                        <FiShield className="mr-2 min-w-[20px]" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded border border-green-200 text-sm flex items-center">
                        <FiShield className="mr-2 min-w-[20px]" />
                        <span>{success}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:gap-6">
                    {/* Add/Edit Form Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={toggleForm}
                            className={`w-full flex items-center justify-between px-4 py-3 font-medium transition-colors ${showForm ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
                        >
                            <span className="flex items-center">
                                <FiUserPlus className="mr-2" />
                                {isEditing ? 'Edit Sub-Admin' : 'Add Sub-Admin'}
                            </span>
                            <span>
                                {showForm ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                            </span>
                        </button>
                        
                        {showForm && (
                            <div className="p-3 md:p-4 border-t border-gray-100">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="w-full p-2 text-sm rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
                                            placeholder="Username"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                                            {isEditing ? 'New Password' : 'Password'}
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full p-2 text-sm rounded border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
                                            placeholder="Password"
                                            required={!isEditing}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Assign Task</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <label className={`flex items-start p-2 text-sm rounded border cursor-pointer ${formData.task === 'ApproveUser' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}>
                                                <input
                                                    type="radio"
                                                    name="task"
                                                    value="ApproveUser"
                                                    checked={formData.task === 'ApproveUser'}
                                                    onChange={handleInputChange}
                                                    className="mt-1 mr-2 text-indigo-600"
                                                />
                                                <div>
                                                    <div className="font-medium">Approve Users</div>
                                                    <p className="text-xs text-gray-600">Manage registrations</p>
                                                </div>
                                            </label>

                                            <label className={`flex items-start p-2 text-sm rounded border cursor-pointer ${formData.task === 'ApproveWithdrawal' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}>
                                                <input
                                                    type="radio"
                                                    name="task"
                                                    value="ApproveWithdrawal"
                                                    checked={formData.task === 'ApproveWithdrawal'}
                                                    onChange={handleInputChange}
                                                    className="mt-1 mr-2 text-indigo-600"
                                                />
                                                <div>
                                                    <div className="font-medium">Approve Withdrawals</div>
                                                    <p className="text-xs text-gray-600">Handle withdrawals</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({ id: '', username: '', password: '', task: 'ApproveUser' });
                                            }}
                                            className="flex-1 px-3 py-2 text-xs md:text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            type="submit"
                                            className={`flex-1 px-3 py-2 text-xs md:text-sm ${isEditing
                                                    ? 'bg-indigo-600 hover:bg-indigo-700'
                                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                                                } text-white rounded font-medium flex items-center justify-center`}
                                        >
                                            {isEditing ? (
                                                <>
                                                    <FiEdit className="mr-1" />
                                                    Update
                                                </>
                                            ) : (
                                                <>
                                                    <FiUserPlus className="mr-1" />
                                                    Add
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                    
                    {/* Sub-Admins List */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                        <div className="p-3 md:p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <FiUser className="mr-2 text-indigo-600" />
                                Sub-Admins
                            </h2>

                            {isLoading ? (
                                <div className="mt-4 flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : subAdmins.length === 0 ? (
                                <div className="mt-2 p-4 text-center bg-gray-50 rounded text-sm">
                                    <p className="text-gray-500">No sub-admins found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    {/* Desktop Table */}
                                    <table className="hidden md:table min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {subAdmins.map((admin) => (
                                                <tr key={admin.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="bg-indigo-100 p-1 rounded mr-2">
                                                                {admin.task === 'ApproveUser' ? (
                                                                    <FiUser className="text-indigo-600 text-sm" />
                                                                ) : (
                                                                    <FiDollarSign className="text-indigo-600 text-sm" />
                                                                )}
                                                            </div>
                                                            <span className="font-medium">{admin.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {showPassword[admin.id] ? (
                                                                <span className="font-mono bg-gray-100 px-1 rounded">{admin.password}</span>
                                                            ) : (
                                                                <span className="text-gray-400 font-mono">••••••••</span>
                                                            )}
                                                            <button
                                                                onClick={() => togglePasswordVisibility(admin.id)}
                                                                className="ml-2 text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                {showPassword[admin.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${admin.task === 'ApproveUser'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {admin.task}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleEdit(admin)}
                                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                                                title="Edit"
                                                            >
                                                                <FiEdit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(admin.id)}
                                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                                title="Delete"
                                                            >
                                                                <FiTrash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden space-y-2">
                                        {subAdmins.map((admin) => (
                                            <div key={admin.id} className="border rounded-lg p-3 hover:bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center mb-2">
                                                        <div className="bg-indigo-100 p-1 rounded mr-2">
                                                            {admin.task === 'ApproveUser' ? (
                                                                <FiUser className="text-indigo-600" />
                                                            ) : (
                                                                <FiDollarSign className="text-indigo-600" />
                                                            )}
                                                        </div>
                                                        <span className="font-medium">{admin.username}</span>
                                                    </div>
                                                    <div className="flex space-x-1">
                                                        <button
                                                            onClick={() => handleEdit(admin)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1"
                                                            title="Edit"
                                                        >
                                                            <FiEdit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(admin.id)}
                                                            className="text-red-600 hover:text-red-900 p-1"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center text-sm mt-1">
                                                    <span className="text-gray-600 mr-2">Password:</span>
                                                    <div className="flex items-center">
                                                        {showPassword[admin.id] ? (
                                                            <span className="font-mono bg-gray-100 px-1 rounded">••••••••</span>
                                                        ) : (
                                                            <span className="text-gray-400 font-mono">••••••••</span>
                                                        )}
                                                        <button
                                                            onClick={() => togglePasswordVisibility(admin.id)}
                                                            className="ml-1 text-indigo-600"
                                                        >
                                                            {showPassword[admin.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${admin.task === 'ApproveUser'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {admin.task}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 text-center">
                        <div className="text-xl font-bold text-indigo-700">{subAdmins.length}</div>
                        <div className="text-sm font-medium text-gray-800">Total Sub-Admins</div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-3 border border-green-100 text-center">
                        <div className="text-xl font-bold text-green-700">
                            {subAdmins.filter(a => a.task === 'ApproveUser').length}
                        </div>
                        <div className="text-sm font-medium text-gray-800">User Approvers</div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100 text-center">
                        <div className="text-xl font-bold text-purple-700">
                            {subAdmins.filter(a => a.task === 'ApproveWithdrawal').length}
                        </div>
                        <div className="text-sm font-medium text-gray-800">Withdrawal Approvers</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubAdminsManagement;