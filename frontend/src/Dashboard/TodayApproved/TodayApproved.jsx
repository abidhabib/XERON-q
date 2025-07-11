import React, { useEffect, useState } from 'react';
import { Sidebar } from "../SideBarSection/Sidebar";
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,

  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCreditCard
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

const TodayApproved = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRejectUsers, setLoadingRejectUsers] = useState([]);
  
  // Sort data to show biggest IDs first
  const sortedData = [...data].sort((a, b) => b.id - a.id);
  
  // Frontend search implementation
  const filteredData = sortedData.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.id && user.id.toString().includes(searchTerm)) ||
    (user.trx_id && user.trx_id.toString().includes(searchTerm))
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/todayApproved`);
        if (response.data && response.data.approvedUsers) {
          setData(response.data.approvedUsers);
        }
      } catch (error) {
        console.error("Error fetching today's approved users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleReject = async (userId) => {
    if (loadingRejectUsers.includes(userId)) return;
    
    setLoadingRejectUsers(prev => [...prev, userId]);
    
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/rejectUserCurrMin/${userId}`);
      setData(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setLoadingRejectUsers(prev => prev.filter(id => id !== userId));
    }
  };



  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <HiOutlineUser className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Today's Approved Users</h1>
                <p className="text-gray-600">Users approved in the last 24 hours</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <HiOutlineRefresh className="mr-2" /> Refresh
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                placeholder="Search by name, email, ID or TXID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
           
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        TXID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Referred By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <HiOutlineUser className="mr-2 text-gray-500" />
                            {user.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center max-w-xs truncate">
                            <HiOutlineMail className="mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          <div className="flex items-center max-w-xs truncate">
                            <HiOutlineCreditCard className="mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{user.trx_id || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.refer_by || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {user.balance || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                          {user.completeAddress || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleReject(user.id)}
                            disabled={loadingRejectUsers.includes(user.id)}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                              loadingRejectUsers.includes(user.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {loadingRejectUsers.includes(user.id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : 'Reject'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <HiOutlineUser className="w-16 h-16 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No approved users found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'No matches for your search' : 'No users approved today'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayApproved;