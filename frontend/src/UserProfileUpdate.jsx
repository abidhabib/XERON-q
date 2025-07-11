import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import { FiUser, FiMail, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Nav } from 'react-bootstrap';
import NavBar from './NavBAr';

const UserProfileUpdate = () => {
  const { userData, fetchUserData } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState(''); 
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      navigate('/'); 
    } else {
      setName(userData.name || '');
      setEmail(userData.email || '');
      setCity(userData.city || '');
      setLoading(false);
    }
  }, [userData, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/updateProfile`, {
        name,
        email,
        city
      },
      { withCredentials: true }
      );

      if (response.data.success) {
        setUpdateSuccess(true);
        fetchUserData();
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <NavBar />
     

      {/* Main Content */}
      <div className="max-w-4xl mx-auto ">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white  overflow-hidden "
        >
          
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Personal Information</h2>
            
            <form onSubmit={handleUpdate} className="space-y-6 mt-5">
              {/* Name Field */}
              <div className="relative">
                <div className="absolute left-3  top-3 text-gray-400">
                  <FiUser className="w-4 h-4 " />
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              
              {/* Email Field */}
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FiMail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  disabled
                  className="w-full pl-11 pr-4 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-500 cursor-not-allowed"
                />
              </div>
              
              {/* City Field */}
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FiMapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              
              {/* Update Button */}
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={updating || updateSuccess}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-2 text-sm rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      <span>Updating...</span>
                    </div>
                  ) : updateSuccess ? (
                    <div className="flex items-center justify-center gap-2">
                      <FiCheckCircle className="w-5 h-5" />
                      <span>Profile Updated</span>
                    </div>
                  ) : (
                    'Update Profile'
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
        
  
      </div>
    </div>
  );
};

export default UserProfileUpdate;