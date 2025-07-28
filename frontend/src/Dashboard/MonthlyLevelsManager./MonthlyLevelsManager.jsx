// src/components/Admin/MonthlyLevelsManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Sidebar } from "../SideBarSection/Sidebar";
import {
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineX
} from 'react-icons/hi';
import Modal from 'react-modal';
import { FaSpinner } from 'react-icons/fa';

Modal.setAppElement('#root'); // Ensure this matches your app's root ID

const MonthlyLevelsManager = () => {
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ month_level: '', required_joins: '', salary: '', salary_date: '' });

  // Modal state for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null); // null for create, object for edit
  const [formErrors, setFormErrors] = useState({});

  // Confirmation modal state for Delete
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    levelId: null,
    levelMonth: null
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Ensure this is set in your .env

  // Fetch data function
  const fetchLevels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/monthly-levels`);
      if (response.data.status === 'success') {
        setLevels(response.data.levels);
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error("Error fetching monthly levels:", err);
      setError(err.message || 'An error occurred while fetching data.');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  // Handle Refresh
  const handleRefresh = () => {
    fetchLevels();
  };

  // Handle Create/Edit Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    try {
      let response;
      if (editingLevel) {
        // Update existing level
        response = await axios.put(`${API_BASE_URL}/api/monthly-levels/${editingLevel.id}`, formData);
      } else {
        // Create new level
        response = await axios.post(`${API_BASE_URL}/api/monthly-levels`, formData);
      }

      if (response.data.status === 'success') {
        setIsModalOpen(false);
        setFormData({ month_level: '', required_joins: '', salary: '' }); // Reset form
        fetchLevels(); // Refresh list
      } else {
        // Handle validation errors from backend
        if (response.data.message) {
            setFormErrors({ general: response.data.message });
        }
      }
    } catch (err) {
       console.error("Error saving monthly level:", err);
       if (err.response?.data?.message) {
           setFormErrors({ general: err.response.data.message });
       } else if (err.response?.data?.error) { // More detailed error from backend
           setFormErrors({ general: err.response.data.error });
       } else {
            setFormErrors({ general: 'An error occurred while saving the level.' });
       }
    }
  };

  // Open Modal for Create
const openCreateModal = () => {
    setEditingLevel(null);
    // Reset form including salary_date
    setFormData({ month_level: '', required_joins: '', salary: '', salary_date: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Modal for Edit (populate salary_date, convert number to string for input)
  const openEditModal = (level) => {
    setEditingLevel(level);
    setFormData({
      month_level: level.month_level,
      required_joins: level.required_joins,
      salary: level.salary,
      // Convert potentially null/numeric salary_date from backend to string for input
      salary_date: level.salary_date ? level.salary_date.toString() : ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };
  // Handle Delete Confirmation
  const openDeleteConfirmation = (levelId, levelMonth) => {
    setDeleteConfirmation({ isOpen: true, levelId, levelMonth });
  };

  const handleConfirmDelete = async () => {
    const { levelId } = deleteConfirmation;
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/monthly-levels/${levelId}`);
      if (response.data.status === 'success') {
        fetchLevels(); // Refresh list
      } else {
        throw new Error(response.data.message || 'Failed to delete level');
      }
    } catch (err) {
      console.error("Error deleting monthly level:", err);
      alert(err.message || 'An error occurred while deleting the level.');
    } finally {
      setDeleteConfirmation({ isOpen: false, levelId: null, levelMonth: null });
    }
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({ isOpen: false, levelId: null, levelMonth: null });
  };


  // Handle form input changes
const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the field being edited
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
  console.log(levels);
  

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Monthly Level Rewards</h1>
              <p className="text-sm text-gray-600">Manage monthly performance reward tiers</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <HiOutlineRefresh className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <HiOutlinePlus className="mr-2" /> Add Level
              </button>
            </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Month Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Required Joins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Salary</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Salary Day</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {levels.length > 0 ? levels.map(level => (
                    <tr key={level.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{level.month_level}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{level.required_joins}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(level.salary).toFixed(2)}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {level.salary_date} date
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(level)}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md transition-colors flex items-center"
                          >
                            <HiOutlinePencilAlt className="mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => openDeleteConfirmation(level.id, level.month_level)}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors flex items-center"
                          >
                            <HiOutlineTrash className="mr-1" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No monthly levels found. Click "Add Level" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <div className="bg-white rounded-xl max-w-md w-full mx-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingLevel ? 'Edit Monthly Level' : 'Add New Monthly Level'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <HiOutlineX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              {formErrors.general && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                  {formErrors.general}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="month_level" className="block text-sm font-medium text-gray-700 mb-1">
                  Month Level *
                </label>
                <input
                  type="number"
                  id="month_level"
                  name="month_level"
                  value={formData.month_level}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  required
                  disabled={!!editingLevel} // Prevent changing level ID on edit if needed, or allow it
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    formErrors.month_level ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                 {formErrors.month_level && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.month_level}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="required_joins" className="block text-sm font-medium text-gray-700 mb-1">
                  Required Joins *
                </label>
                <input
                  type="number"
                  id="required_joins"
                  name="required_joins"
                  value={formData.required_joins}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    formErrors.required_joins ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                 {formErrors.required_joins && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.required_joins}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                  Salary *
                </label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01" // Allow cents
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    formErrors.salary ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                 {formErrors.salary && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.salary}</p>
                )}
              </div>
  <div className="mb-4">
                <label htmlFor="salary_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Date on Month
                </label>
                <input
                  type="number" 
                  id="salary_date"
                  name="salary_date"
                  required
                  value={formData.salary_date}
                  onChange={handleInputChange}
                  min="1"
                  max="31"
                  step="1"
                  placeholder="e.g., 3, 14, 28"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    formErrors.salary_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                 {formErrors.salary_date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.salary_date}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Enter the day of the month (1-31) for salary payout. Leave blank for default.</p>
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
                  {editingLevel ? 'Update Level' : 'Create Level'}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteConfirmation.isOpen}
          onRequestClose={closeDeleteConfirmation}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <HiOutlineTrash className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="ml-4 text-lg font-medium text-gray-900">
                Confirm Delete
              </h3>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete Monthly Level <span className="font-medium">{deleteConfirmation.levelMonth}</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={closeDeleteConfirmation}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default MonthlyLevelsManager;