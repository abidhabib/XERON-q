import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await api.getProfile();
      if (userData) {
        setUser(userData);
        setError(null);
        return userData;
      } else {
        setUser(null);
        setError('Session expired. Please log in again.');
        return null;
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setUser(null);
      // Only show session expired if we actually had a session
      const errorMessage = error.response?.status === 401 
        ? 'Session expired. Please log in again.'
        : error.message || 'Failed to connect to the server. Please try again later.';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      const userData = await api.login(credentials);
      // After successful login, fetch the profile to ensure we have the latest data
      const profileData = await fetchProfile();
      setError(null);
      return profileData || userData;
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
