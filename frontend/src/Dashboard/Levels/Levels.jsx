import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { FaEdit, FaSave, FaSpinner, FaTimes } from 'react-icons/fa';

const Levels = () => {
    const [levelsData, setLevelsData] = useState([]);
    const [error, setError] = useState('');
    const [updateData, setUpdateData] = useState({ 
        id: '', 
        threshold: '', 
        level: '' 
    });
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');
            
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/fetchLevelsData`,
                { timeout: 10000 }
            );
            
            if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
                const sortedData = [...response.data.data].sort((a, b) => a.level - b.level);
                setLevelsData(sortedData);
            } else {
                setError('Invalid levels data format');
            }
        } catch (error) {
            console.error('Levels fetch error:', error);
            setError(error.response?.data?.message || 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = useCallback((item) => {
        setUpdateData({
            id: item.id,
            threshold: item.threshold,
            level: item.level
        });
        setHasChanges(false);
        setShowModal(true);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setHasChanges(true);
        setUpdateData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const thresholdValue = Number(updateData.threshold);

        if (isNaN(thresholdValue) || thresholdValue < 0) {
            setError('Threshold must be a non-negative number');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        try {
            setIsSaving(true);
            setError('');
            const payload = {
                id: updateData.id,
                threshold: Number(updateData.threshold),
            };
            
            const response = await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/upDateLevelData`, 
                payload,
                { timeout: 15000 }
            );

            if (response.data?.status === 'success') {
                setShowModal(false);
                fetchData();
            } else {
                setError(response.data?.message || 'Update failed');
            }
        } catch (error) {
            console.error('Update error:', error);
            setError(error.response?.data?.error || 'Request failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseModal = () => {
        if (!hasChanges || window.confirm('You have unsaved changes. Close anyway?')) {
            setShowModal(false);
        }
    };

    const TableRow = ({ item }) => (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                    <span className="text-sm font-semibold text-indigo-800">{item.level}</span>
                </span>
            </td>

            <td className="px-4 py-3">
                <span className="text-sm font-medium text-gray-700">
                    {item.threshold} <span className="text-gray-500 text-xs">members</span>
                </span>
            </td>

            <td className="px-4 py-3">
                <button
                    onClick={() => handleUpdate(item)}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                >
                    <FaEdit className="mr-2 text-xs" /> Edit
                </button>
            </td>
        </tr>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Level Settings</h1>
                            <p className="text-sm text-gray-500 mt-1">Configure team size thresholds for each level</p>
                        </div>
                        <button 
                            onClick={fetchData}
                            className="inline-flex items-center justify-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <FaSpinner className="animate-spin mr-2" />
                            ) : (
                                'Refresh'
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <FaSpinner className="animate-spin text-3xl text-indigo-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">Loading levels...</p>
                        </div>
                    </div>
                ) : levelsData.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <p className="text-gray-500 mb-3">No levels available</p>
                        <button 
                            onClick={fetchData}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    /* Table Container */
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                                            Level
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Team Required
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {levelsData.map(item => (
                                        <TableRow key={`level-${item.id}`} item={item} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div 
                            className="bg-white rounded-xl shadow-lg w-full max-w-sm animate-fade-in"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Level {updateData.level}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Update threshold</p>
                                </div>
                                <button 
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-500 transition-colors p-1"
                                    aria-label="Close modal"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="px-6 py-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Team Size Threshold
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="threshold"
                                                value={updateData.threshold}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-transparent text-sm"
                                                min="0"
                                            />
                                           
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Minimum team size required to reach this level
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Modal Footer */}
                            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    onClick={handleCloseModal}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center transition-colors ${
                                        isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" /> Saving
                                        </>
                                    ) : (
                                        <>
                                            <FaSave className="mr-2" /> Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Levels;