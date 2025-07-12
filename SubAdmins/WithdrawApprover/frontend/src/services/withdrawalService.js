import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  },
});

// Add a request interceptor to include the token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const withdrawalService = {
  // Get all pending withdrawal requests
  getAllWithdrawalRequests: async () => {
    try {
      const response = await api.get('/withdrawal-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },

  // Approve a withdrawal request
  approveWithdrawal: async (userId, requestId, amount) => {
    try {
      const response = await api.post('/withdrawal-requests/approve', {
        userId,
        requestId,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      throw error;
    }
  },

  // Reject a withdrawal request
  rejectWithdrawal: async (userId, requestId, reason) => {
    try {
      const response = await api.post('/withdrawal-requests/reject', {
        userId,
        requestId,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      throw error;
    }
  },

  // Delete a withdrawal request
  deleteWithdrawal: async (userId, requestId) => {
    try {
      const response = await api.post('/withdrawal-requests/delete', {
        userId,
        requestId
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting withdrawal:', error);
      throw error;
    }
  }
};
