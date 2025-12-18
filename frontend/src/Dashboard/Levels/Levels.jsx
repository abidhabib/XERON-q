import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '../SideBarSection/Sidebar';
import axios from 'axios';
import { FaEdit, FaSave, FaSpinner, FaTimes } from 'react-icons/fa';
import { RemoveTrailingZeros } from '../../../utils/utils';

const Levels = () => {
    const [levelsData, setLevelsData] = useState([]);
    const [error, setError] = useState('');
    const [updateData, setUpdateData] = useState({ 
        id: '', 
        threshold: '', 
        level: '' 

    });
 const [salaryData, setSalaryData] = useState({ 
    amount: '', 
    day: '0',
    weekly_recruitment: ''
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
    
    setSalaryData({
        amount: String(item.salary_amount),
        day: String(item.salary_day),
        weekly_recruitment: String(item.weekly_recruitment)
    });
    
    setHasChanges(false);
    setShowModal(true);
}, []);


 const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHasChanges(true);

    if (['amount', 'day', 'weekly_recruitment'].includes(name)) {
        setSalaryData(prev => ({ ...prev, [name]: value }));
    } else {
        setUpdateData(prev => ({ ...prev, [name]: value }));
    }
};


    const validateForm = () => {
        const thresholdValue = Number(updateData.threshold);
        const salaryAmount = Number(salaryData.amount);
        const salaryDay = Number(salaryData.day);
        
        
        const errors = [];
        
        if (isNaN(thresholdValue) || thresholdValue < 0) {
            errors.push('Threshold must be a non-negative number');
        }
        
        if (isNaN(salaryAmount) || salaryAmount < 0) {
            errors.push('Salary amount must be a non-negative number');
        }
        
        if (isNaN(salaryDay) || salaryDay < 0 || salaryDay > 6) {
            errors.push('Salary day must be between 0 (Sunday) and 6 (Saturday)');
        }
        
        if (errors.length > 0) {
            setError(errors.join('. '));
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
    salary_amount: Number(salaryData.amount),
    salary_day: Number(salaryData.day),
weekly_recruitment: Number(salaryData.weekly_recruitment)
};
        const response = await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/updateSalaryData`, 
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
        <td className="px-6 py-4 whitespace-nowrap">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100">
                <span className="text-sm font-medium text-indigo-800">{item.level}</span>
            </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
            {item.threshold} members
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
            {RemoveTrailingZeros(item.salary_amount)} <span className="text-xs text-blue-500">USDT</span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][item.salary_day]}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
 <span className='text-blue-500 font-semibold'> {item.weekly_recruitment}</span> new in/week
        </td>
        <td className="px-6 py-4 text-sm text-right">
            <button 
                onClick={() => handleUpdate(item)}
                className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end w-full"
                aria-label={`Edit level ${item.level}`}
            >
                <FaEdit className="mr-1" /> Edit
            </button>
        </td>
    </tr>
);



    return (
        <div className="   min-h-screen bg-gray-50">
      <div className="  p-4 ">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Stage Seeting</h1>
                          
                        </div>
                        <button 
                            onClick={fetchData}
                            className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <FaSpinner className="animate-spin mr-2" />
                            ) : (
                                'Refresh Data'
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex items-start">
                            <svg className="h-5 w-5 text-red-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
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
                ) : levelsData.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-8 text-center">
                        <p className="text-gray-600">No levels data available</p>
                        <button 
                            onClick={fetchData}
                            className="mt-4 text-indigo-600 hover:text-indigo-800"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-indigo-50">
    <tr>
        {["Stage", "Team Need", "Salary Amount", "Salary Day", "Weekly Join ?", "Actions"].map((header, idx) => (
            <th 
                key={idx}
                className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider"
            >
                {header}
            </th>
        ))}
    </tr>
</thead>

                                <tbody className="bg-white divide-y divide-gray-200">
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
                            className="bg-white rounded-xl shadow-lg w-full max-w-md animate-fade-in"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Level {updateData.level} Configuration
                                </h3>
                                <button 
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                    aria-label="Close modal"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            
                            <div className="px-6 py-4 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Team Size Threshold
                                    </label>
                                    <input
                                        type="number"
                                        name="threshold"
                                        value={updateData.threshold}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                                        min="0"
                                        placeholder="Enter minimum team size"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Weekly Salary Amount (USDT)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={salaryData.amount}
                                            onChange={handleInputChange}
                                            className="block w-full pl-8 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Salary Collection Day
                                    </label>
                                    <select
                                        name="day"
                                        value={salaryData.day}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                                    >
                                        <option value="0">Sunday</option>
                                        <option value="1">Monday</option>
                                        <option value="2">Tuesday</option>
                                        <option value="3">Wednesday</option>
                                        <option value="4">Thursday</option>
                                        <option value="5">Friday</option>
                                        <option value="6">Saturday</option>
                                    </select>
                                </div>
                                 <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            Weekly Recruitment Requirement
        </label>
        <input
            type="number"
            name="weekly_recruitment"
            value={salaryData.weekly_recruitment || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
            min="0"
            placeholder="Minimum new members required weekly"
        />
        <p className="text-xs text-gray-500 mt-1">
            Number of new members needed weekly to recollect salary at this level
        </p>
    </div>
                            </div>
                            
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