// src/components/Admin/Commission.jsx (or your relevant path)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  HiOutlineRefresh,
  HiOutlinePencilAlt,
  HiOutlineX
} from 'react-icons/hi';
import Modal from 'react-modal';
import { FaSpinner } from 'react-icons/fa';

Modal.setAppElement('#root'); 

const Commission = () => {
  const [commissionData, setCommissionData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState({
  id: '',
  person: '',
  direct_bonus: '',
  indirect_bonus: '',
  week_backend: '',
  web_backend: ''
});
  const [formErrors, setFormErrors] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/fetchCommissionData`);
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        setCommissionData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Commission data is not in the expected format');
      }
    } catch (err) {
      console.error('Error fetching commission data:', err);
      setError(err.message || 'An error occurred while fetching data.');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleUpdateClick = (item) => {
    setEditingItem({ ...item });
    setFormErrors({}); 
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prevData => ({ ...prevData, [name]: value }));

    if (formErrors[name]) {
        setFormErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
    if (formErrors.general) {
         setFormErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.general;
            return newErrors;
        });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({}); 

 const errors = {};
if (editingItem.direct_bonus === '' || isNaN(Number(editingItem.direct_bonus))) {
  errors.direct_bonus = 'Direct Bonus must be a valid number.';
}
if (editingItem.indirect_bonus === '' || isNaN(Number(editingItem.indirect_bonus))) {
  errors.indirect_bonus = 'Indirect Bonus must be a valid number.';
}
if (editingItem.week_backend === '' || isNaN(Number(editingItem.week_backend))) {
  errors.week_backend = 'Week Backend must be a valid number.';
}
if (editingItem.web_backend === '' || isNaN(Number(editingItem.web_backend))) {
  errors.web_backend = 'Web Backend must be a valid number.';
}

    try {
      const response = await axios.put(`${API_BASE_URL}/updateCommissionData`, {
  id: editingItem.id,
  direct_bonus: Number(editingItem.direct_bonus),
  indirect_bonus: Number(editingItem.indirect_bonus),
  week_backend: Number(editingItem.week_backend),
  web_backend: Number(editingItem.web_backend),
});
      if (response.data.status === 'success') {
        setIsModalOpen(false); 
        fetchData();
      } else {
        throw new Error(response.data.message || 'Failed to update data');
      }
    } catch (err) {
      console.error('Error updating commission data:', err);
      setFormErrors({ general: err.message || 'An error occurred while saving the data.' });
    }
  };

  return (
    <div className="   min-h-screen">
      <div className="  p-4 ">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Commission Settings</h1>
              <p className="text-sm text-gray-600">Manage direct and indirect bonus percentages</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <HiOutlineRefresh className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Direct Bonus (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Indirect Bonus (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Week Backend (%)</th>
<th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Web Backend (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissionData.length > 0 ? (
                    commissionData.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.person}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.direct_bonus}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.indirect_bonus}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.week_backend}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.web_backend}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleUpdateClick(item)}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md transition-colors flex items-center"
                          >
                            <HiOutlinePencilAlt className="mr-1" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No commission data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Update Modal */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <div className="bg-white rounded-xl max-w-md w-full mx-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Update Commission for {editingItem.person}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <HiOutlineX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {formErrors.general && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                  {formErrors.general}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="direct_bonus" className="block text-sm font-medium text-gray-700 mb-1">
                  Direct Bonus (%)
                </label>
                <input
                  type="number"
                  id="direct_bonus"
                  name="direct_bonus"
                  value={editingItem.direct_bonus}
                  onChange={handleInputChange}
                  min="0"
                  step="any" // Allow decimals
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    formErrors.direct_bonus ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                {formErrors.direct_bonus && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.direct_bonus}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="indirect_bonus" className="block text-sm font-medium text-gray-700 mb-1">
                  Indirect Bonus (%)
                </label>
                <input
                  type="number"
                  id="indirect_bonus"
                  name="indirect_bonus"
                  value={editingItem.indirect_bonus}
                  onChange={handleInputChange}
                  min="0"
                  step="any" // Allow decimals
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    formErrors.indirect_bonus ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                {formErrors.indirect_bonus && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.indirect_bonus}</p>
                )}
              </div>
<div className="mb-4">
  <label htmlFor="week_backend" className="block text-sm font-medium text-gray-700 mb-1">
    Week Backend (%)
  </label>
  <input
    type="number"
    id="week_backend"
    name="week_backend"
    value={editingItem.week_backend}
    onChange={handleInputChange}
    min="0"
    step="any"
    required
    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
      formErrors.week_backend ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
    }`}
  />
  {formErrors.week_backend && (
    <p className="mt-1 text-sm text-red-600">{formErrors.week_backend}</p>
  )}
</div>

<div className="mb-4">
  <label htmlFor="web_backend" className="block text-sm font-medium text-gray-700 mb-1">
    Web Backend (%)
  </label>
  <input
    type="number"
    id="web_backend"
    name="web_backend"
    value={editingItem.web_backend}
    onChange={handleInputChange}
    min="0"
    step="any"
    required
    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
      formErrors.web_backend ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
    }`}
  />
  {formErrors.web_backend && (
    <p className="mt-1 text-sm text-red-600">{formErrors.web_backend}</p>
  )}
</div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Commission;