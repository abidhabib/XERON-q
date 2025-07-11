import  { useState, useEffect } from 'react';
import { Sidebar } from "../SideBarSection/Sidebar";
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCreditCard
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

const RejectedUsers = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingApproveUsers, setLoadingApproveUsers] = useState([]);
  const [isClearing, setIsClearing] = useState(false);

  // Fetch rejected users with pagination
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/rejectedUsers`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm
        }
      });
      
      if (response.data && response.data.approvedUsers) {
        setData(response.data.approvedUsers);
        setTotalCount(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching rejected users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleApprove = async (userId) => {
    if (loadingApproveUsers.includes(userId)) return;
    
    setLoadingApproveUsers(prev => [...prev, userId]);
    
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/approveUser/${userId}`, { 
        approved: 1, 
        approved_at: new Date() 
      });
      
      // Remove user from local state
      setData(prev => prev.filter(user => user.id !== userId));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setLoadingApproveUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleClearOldRecords = async () => {
    if (!window.confirm("Are you sure you want to delete records older than 7 days?")) return;
    
    setIsClearing(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delete-old-rejected-users`);
      fetchData();
      alert("Old rejected user records deleted successfully");
    } catch (error) {
      console.error("Error deleting old records", error);
      alert("Failed to delete old records");
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearAllRecords = async () => {
    if (!window.confirm("Are you sure you want to delete ALL rejected users?")) return;
    
    setIsClearing(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delete-rejected-users`);
      setData([]);
      setTotalCount(0);
      alert("All rejected users deleted successfully");
    } catch (error) {
      console.error("Error deleting rejected users", error);
      alert("Failed to delete rejected users");
    } finally {
      setIsClearing(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-xl mr-4">
                <HiOutlineUserGroup className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Rejected Users</h1>
              </div>
            </div>
            <button 
              onClick={fetchData}
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
                placeholder="Search by name, email, ID or TXID..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleClearOldRecords}
                disabled={isClearing}
                className={`flex items-center px-4 py- rounded-lg transition-colors ${
                  isClearing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                <HiOutlineCalendar className="mr-2" />
                Clear 7-Day Records
              </button>
              
              <button
                onClick={handleClearAllRecords}
                disabled={isClearing}
                className={`flex items-center px-4 py-2  rounded-lg transition-colors ${
                  isClearing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <HiOutlineTrash className="mr-2" />
                Clear All 
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-red-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          TXID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          Referred By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((user) => (
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
                            <div className="flex items-center">
                              <HiOutlineMail className="mr-2 text-gray-400" />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            <div className="flex items-center">
                              <HiOutlineCreditCard className="mr-2 text-gray-400" />
                              {user.trx_id || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.refer_by || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(user.id)}
                                disabled={loadingApproveUsers.includes(user.id)}
                                className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                                  loadingApproveUsers.includes(user.id)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {loadingApproveUsers.includes(user.id) ? (
                                  <FaSpinner className="animate-spin mr-1" />
                                ) : (
                                  <HiOutlineCheckCircle className="mr-1" />
                                )}
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="bg-red-50 px-6 py-3 flex flex-col md:flex-row items-center justify-between border-t border-red-100 gap-4">
                  <div className="text-sm text-red-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span> of <span className="font-medium">{totalCount}</span> users
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`flex items-center px-3 py-1 rounded-md ${
                        currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-red-700 bg-red-100 hover:bg-red-200'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center bg-white px-3 py-1 rounded-md border border-red-200">
                      <span className="text-sm font-medium text-red-700">Page {currentPage} of {totalPages}</span>
                    </div>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`flex items-center px-3 py-1 rounded-md ${
                        currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-red-700 bg-red-100 hover:bg-red-200'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <HiOutlineUserGroup className="w-16 h-16 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No rejected users found</h3>
                  <p className="text-gray-500">All rejected user records have been processed</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RejectedUsers;