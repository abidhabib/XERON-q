import React, { useState, useEffect } from 'react';
import { Sidebar } from "../SideBarSection/Sidebar";
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
  HiOutlineCalendar
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

const RejectWithdraw = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingApproves, setLoadingApproves] = useState([]);
  const [isClearing, setIsClearing] = useState(false);

  // Fetch rejected withdrawals with search
  const fetchData = async (search = '') => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/withdrawalRequestsRejected`, {
        params: { search, limit: 50 }
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        // Sort by latest first
        const sortedData = response.data.data.sort((a, b) => 
          new Date(b.approved_time) - new Date(a.approved_time)
        );
        setData(sortedData);
      }
    } catch (error) {
      console.error('Error fetching rejected withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const handler = setTimeout(() => {
      fetchData(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleApprove = async (userId, requestId, amount) => {
    if (loadingApproves.includes(requestId)) return;
    
    if (!window.confirm("Are you sure you want to approve this rejected withdrawal?")) return;
    
    setLoadingApproves(prev => [...prev, requestId]);
    
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/approve-withdrawal`, { 
        userId, 
        requestId, 
        amount 
      });
      
      setData(prev => prev.filter(item => item.id !== requestId));
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Failed to approve withdrawal');
    } finally {
      setLoadingApproves(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL rejected withdrawal records?")) return;
    
    setIsClearing(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delete-rejected-withdrawals`);
      setData([]);
      alert("All rejected withdrawal records deleted successfully");
    } catch (error) {
      console.error("Error deleting records:", error);
      alert("Failed to delete records");
    } finally {
      setIsClearing(false);
    }
  };

  const formatDateAndTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      year: '2-digit', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('en-GB', options).replace(',', '');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-xl mr-4">
                <HiOutlineTrash className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Rejected Withdrawals</h1>
                <p className="text-gray-600">Recently rejected withdrawal requests</p>
              </div>
            </div>
            <button 
              onClick={() => fetchData(searchTerm)}
              className="flex items-center text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent"
                placeholder="Search by ID, account number, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isClearing 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <HiOutlineTrash className="mr-2" />
              Clear All Records
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-red-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Request ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Bank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Request Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Rejected At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <HiOutlineCreditCard className="mr-2 text-gray-500" />
                            {request.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <HiOutlineCurrencyDollar className="mr-2 text-gray-400" />
                            {request.amount}
                          </div>
                        </td>
                    
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.bank_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <HiOutlineCalendar className="mr-2 text-gray-400" />
                            {formatDateAndTime(request.request_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <HiOutlineCalendar className="mr-2 text-gray-400" />
                            {formatDateAndTime(request.approved_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <HiOutlineUser className="mr-2 text-gray-400" />
                            {request.user_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleApprove(request.user_id, request.id, request.amount)}
                            disabled={loadingApproves.includes(request.id)}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                              loadingApproves.includes(request.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {loadingApproves.includes(request.id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <HiOutlineCheckCircle className="mr-1" />
                            )}
                            Approve
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
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No rejected withdrawals found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'No matches for your search' : 'All withdrawal requests are processed'}
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

export default RejectWithdraw;