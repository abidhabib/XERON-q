import  { useState, useEffect } from 'react';
import { Sidebar } from "../SideBarSection/Sidebar";
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineXCircle,
  HiOutlineCreditCard,
  HiOutlineCalendar
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';
import { RemoveTrailingZeros } from '../../../utils/utils';

const ApprovedWithdraw = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRejects, setLoadingRejects] = useState([]);

  // Fetch approved withdrawals with search
  const fetchData = async (search = '') => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/withdrawalRequestsApproved`, {
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
      console.error('Error fetching approved withdrawals:', error);
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

  const handleReject = async (userId, requestId) => {
    if (loadingRejects.includes(requestId)) return;
    
    if (!window.confirm("Are you sure you want to reject this approved withdrawal?")) return;
    
    setLoadingRejects(prev => [...prev, requestId]);
    
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/reject-withdrawal`, { 
        userId, 
        requestId 
      });
      
      setData(prev => prev.filter(item => item.id !== requestId));
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Failed to reject withdrawal');
    } finally {
      setLoadingRejects(prev => prev.filter(id => id !== requestId));
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
              <div className="bg-green-100 p-3 rounded-xl mr-4">
                <HiOutlineCreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Approved Withdrawals</h1>
                <p className="text-gray-600">Recently approved withdrawal requests</p>
              </div>
            </div>
            <button 
              onClick={() => fetchData(searchTerm)}
              className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-transparent"
                placeholder="Search by ID, account number, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
           
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-green-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Request ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Bank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Request Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Approved Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {request.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {RemoveTrailingZeros(request.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div className="text-gray-400 font-mono">{request.account_number}</div>
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
                            {request.user_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleReject(request.user_id, request.id)}
                            disabled={loadingRejects.includes(request.id)}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                              loadingRejects.includes(request.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {loadingRejects.includes(request.id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : (
                              <HiOutlineXCircle className="mr-1" />
                            )}
                            Reject
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
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No approved withdrawals found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'No matches for your search' : 'All withdrawal requests are pending'}
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

export default ApprovedWithdraw;