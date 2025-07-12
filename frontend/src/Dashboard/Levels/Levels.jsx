import { useEffect, useState } from 'react';
import { Sidebar } from '../SideBarSection/Sidebar';
import axios from 'axios';
import { FaEdit, FaSave, FaSpinner, FaTimes } from 'react-icons/fa';
const Levels = () => {
    const [levelsData, setLevelsData] = useState([]);
    const [error, setError] = useState(null);
    const [updateData, setUpdateData] = useState({ id: '', threshold: '', level: '' });
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fetchLevelsData`);
            if (response.data.status === 'success' && Array.isArray(response.data.data)) {
                // Sort by level ascending
                const sortedData = [...response.data.data].sort((a, b) => a.level - b.level);
                setLevelsData(sortedData);
            } else {
                setError('Levels data is not in the expected format');
            }
        } catch (error) {
            console.error('Error fetching levels data:', error);
            setError('Failed to fetch data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = (item) => {
        setUpdateData({ ...item });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdateData(prevData => ({ ...prevData, [name]: value }));
    };
const handleSave = async () => {
    // Clear previous errors
    setError(null);
    
    // Convert to numbers
    const currentThreshold = Number(updateData.threshold);
    
    // Basic validation
    if (isNaN(currentThreshold) || currentThreshold <= 0) {
        setError('Threshold must be a positive number');
        return;
    }

    try {
        setIsSaving(true);
        const payload = {
            id: updateData.id,
            threshold: currentThreshold
        };
        
        const response = await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/updateLevelData`, 
            payload
        );
        
        if (response.data.status === 'success') {
            setShowModal(false);
            fetchData();  // Refresh data
        } else {
            setError(response.data.message || 'Failed to update data');
        }
    } catch (error) {
        console.error('Update error:', error);
        setError(error.response?.data?.error || 'An error occurred while saving');
    } finally {
        setIsSaving(false);
    }
};
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            
            <div className="flex-1 p-4 md:p-6 ml-0 md:ml-64">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Levels Setting</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Team level is determined by team size reaching threshold values
                            </p>
                        </div>
                        <button 
                            onClick={fetchData}
                            className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Refresh Data
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <FaSpinner className="animate-spin text-4xl text-indigo-600" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-indigo-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Level</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Team Size Threshold</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-indigo-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {levelsData.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                                                        <span className="text-sm font-medium text-indigo-800">{item.level}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.threshold} members
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                <button 
                                                    onClick={() => handleUpdate(item)}
                                                    className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end w-full"
                                                >
                                                    <FaEdit className="mr-1" /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">Update Level Threshold</h3>
                                <button 
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            
                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="level"
                                            value={updateData.level}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                            disabled
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Team Size Threshold
                                        <span className="text-xs text-gray-500 ml-1">(minimum team size for this level)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="threshold"
                                        value={updateData.threshold}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
                                        min="1"
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => setShowModal(false)}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 flex items-center"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave className="mr-2" /> Save Changes
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