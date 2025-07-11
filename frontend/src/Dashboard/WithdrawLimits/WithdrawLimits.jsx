import { useEffect, useState } from 'react';
import {Sidebar} from '../SideBarSection/Sidebar';
import axios from 'axios';
import { FiRefreshCw, FiEdit, FiSave, FiXCircle } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';

export const WithdrawLimits = () => {
  const [levelsData, setLevelsData] = useState([]);
  const [error, setError] = useState(null);
  const [updateData, setUpdateData] = useState({ id: '', withdrawalAttempts: null, allow_limit: null });
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

   const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fetchLimitsData`);
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        setLevelsData(response.data.data); 
      } else {
        setError('Levels data is not in the expected format');
      }
    } catch (error) {
      console.error('Error fetching levels data:', error);
      setError('Error fetching data');
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
    try {
      setIsSaving(true);
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/updateWithdrawData`, updateData);
      if (response.data.status === 'success') {
        setShowModal(false);
        fetchData();
        setUpdateData({ id: '', withdrawalAttempts: null, allow_limit: null });
      } else {
        setError('Failed to update data');
      }
    } catch (error) {
      console.error('Error updating data:', error);
      setError('Failed to update data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Withdrawal Limits</h1>
          </div>
          <button 
            onClick={fetchData} 
            className="mt-3 md:mt-0 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg flex items-center transition-all"
          >
            <FiRefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
            <FiXCircle className="text-xl mr-3" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-3xl text-indigo-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Attempts
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allowed Limit
                    </th>
                
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {levelsData.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{item.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.withdrawalAttempts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.allow_limit}
                      </td>
                     
                      <td className="">
                        <button 
                          onClick={() => handleUpdate(item)}
                          className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg flex items-center transition-all"
                        >
                          <FiEdit className="mr-1" /> Edit
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Update Withdrawal Limits</h3>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiXCircle className="text-xl" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Withdrawal Attempts
                    </label>
                    <input
                      type="number"
                      name="withdrawalAttempts"
                      value={updateData.withdrawalAttempts || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowed Limit
                    </label>
                    <input
                      type="number"
                      name="allow_limit"
                      value={updateData.allow_limit || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center disabled:opacity-70"
                  >
                    {isSaving ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

