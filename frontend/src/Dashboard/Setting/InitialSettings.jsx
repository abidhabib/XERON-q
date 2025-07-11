import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from '../SideBarSection/Sidebar';
import { 
  HiOutlineGift,
  HiOutlineUserAdd,
  HiOutlineCreditCard
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

const Settings = () => {
  const [settings, setSettings] = useState({
    fee: "",
    usdRate: 0.0,
    offer: "",
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({
    fee: false,
    usdRate: false,
    offer: false,
    percentage: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const [
          feeRes, 
          offerRes, 
          percentageRes
        ] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-fee`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-offer`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/get-percentage`)
        ]);
        console.log(feeRes);

        setSettings({
          fee: feeRes.data.fee,
          offer: offerRes.data.offer,
          percentage: percentageRes.data.initial_percent
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
        
      }
    };

    fetchSettings();
  }, []);

  const handleUpdate = async (type) => {
    setUpdating(prev => ({ ...prev, [type]: true }));
    
    try {
      const endpointMap = {
        fee: '/update-fee',
        offer: '/update-offer',
        percentage: '/update-percentage'
      };
      
      const payload = { newFeeValue: settings[type] };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}${endpointMap[type]}`, payload);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      alert(`Failed to update ${type}`);
    } finally {
      setUpdating(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleChange = (type, value) => {
    setSettings(prev => ({ ...prev, [type]: value }));
  };
console.log(settings.fee);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600">Manage platform configuration</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-indigo-600" />
          </div>
        ) : (
            // responsive for all screen
          <div className="grid  md:gap-8">
            {/* Joining Fee Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                  <HiOutlineCreditCard className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800">Joining Fee</h3>
              </div>
              
              <div className="flex">
                <input
                  type="number"
                  className="flex-1 py-2 px-4 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
                  value={settings.fee}
                  onChange={(e) => handleChange('fee', e.target.value)}
                />
                <button
                  onClick={() => handleUpdate('fee')}
                  disabled={updating.fee}
                  className={`px-4 py-2 rounded-r-lg text-white font-medium ${
                    updating.fee 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {updating.fee ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    'Save')}
                </button>
              </div>
            </div>

            {/* New User Bonus Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <HiOutlineUserAdd className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800">Givein To New User
                </h3>
              </div>
              
              <div className="flex">
                <input
                  type="number"
                  className="flex-1 py-2 px-4 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-transparent"
                  value={settings.percentage}
                  onChange={(e) => handleChange('percentage', e.target.value)}
                />
                <button
                  onClick={() => handleUpdate('percentage')}
                  disabled={updating.percentage}
                  className={`px-4 py-2 rounded-r-lg text-white font-medium ${
                    updating.percentage 
                      ? 'bg-green-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {updating.percentage ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
'Save'                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Percentage bonus given to new users
              </p>
            </div>


            {/* Special Offer Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                  <HiOutlineGift className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800">Special Offer</h3>
              </div>
              
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 py-2 px-4 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:border-transparent"
                  value={settings.offer}
                  onChange={(e) => handleChange('offer', e.target.value)}
                  placeholder="Enter special offer text"
                />
                <button
                  onClick={() => handleUpdate('offer')}
                  disabled={updating.offer}
                  className={`px-4 py-2 rounded-r-lg text-white font-medium ${
                    updating.offer 
                      ? 'bg-yellow-400 cursor-not-allowed' 
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {updating.offer ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    'Save')}
                </button>
              </div>
            
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;