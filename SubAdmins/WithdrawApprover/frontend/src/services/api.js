import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
});

export default {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Update the default Authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      // Always remove the token from localStorage and clear the Authorization header
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  },
  
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
};