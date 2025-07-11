import  { useState, useEffect } from 'react';
import { Sidebar } from "../SideBarSection/Sidebar";
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

const PendingUsers = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDeleteUsers, setLoadingDeleteUsers] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  
  // Frontend search implementation
  const filteredData = data.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.id && user.id.toString().includes(searchTerm)) ||
    (user.phoneNumber && user.phoneNumber.toString().includes(searchTerm)) ||
    (user.completeAddress && user.completeAddress.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/pending-users`);
        if (response.data && response.data.pendingUsers) {
          setData(response.data.pendingUsers);
        }
      } catch (error) {
        console.error("Error fetching pending users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleDelete = async (userId) => {
    if (loadingDeleteUsers.includes(userId)) return;
    
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    setLoadingDeleteUsers(prev => [...prev, userId]);
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteUser/${userId}`);
      setData(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setLoadingDeleteUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleDelete7DaysOldUsers = async () => {
    if (!window.confirm("Are you sure you want to delete users pending for more than 7 days?")) return;
    
    setIsClearing(true);
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delete-7-days-old-users`);
      if (response.data.success) {
        // Remove deleted users from local state
        setData(prev => prev.filter(user => 
          !(user.payment_ok === 0 && 
            user.approved === 0 && 
            user.created_at && 
            Date.now() - new Date(user.created_at).getTime() > 7 * 24 * 60 * 60 * 1000)
        ));
        alert(`${response.data.deletedCount} users deleted successfully`);
      }
    } catch (error) {
      console.error("Error deleting old records", error);
      alert("Failed to delete old records");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-xl mr-4">
                <HiOutlineUser className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Pending Users</h1>
                <p className="text-gray-600">Users waiting for approval</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:border-transparent"
                placeholder="Search by name, email, ID, phone or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleDelete7DaysOldUsers}
                disabled={isClearing}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isClearing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <HiOutlineCalendar className="mr-2" />
                Delete 7-Day Records
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-yellow-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-yellow-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <HiOutlinePhone className="mr-2 text-gray-400" />
                            {user.phoneNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                          <div className="flex items-center">
                            <HiOutlineLocationMarker className="mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{user.completeAddress || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={loadingDeleteUsers.includes(user.id)}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                              loadingDeleteUsers.includes(user.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {loadingDeleteUsers.includes(user.id) ? (
                              <FaSpinner className="animate-spin mr-1" />
                            ) : 'Delete'}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No pending users found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'No matches for your search' : 'All users are processed'}
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

export default PendingUsers;