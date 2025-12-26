import  { useState, useEffect } from 'react';
import { Sidebar } from "../SideBarSection/Sidebar";
import axios from 'axios';
import { 
  HiOutlineSearch, 
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCreditCard,
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';
import { RemoveTrailingZeros } from '../../../utils/utils';


const WithdrawRequests = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingActions, setLoadingActions] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const filteredData = data.filter(request =>
    request.id.toString().includes(searchTerm) ||
    request.account_number.toString().includes(searchTerm) ||
    request.user_id.toString().includes(searchTerm)
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/all-withdrawal-requests`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const openRejectModal = (request) => {
    setCurrentRequest(request);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setCustomReason('');
  };

  const handleReject = async () => {
    if (!rejectionReason && !customReason) {
      alert('Please select a reason or enter a custom message');
      return;
    }
    
    const reason = rejectionReason === 'custom' 
      ? customReason 
      : rejectionReason;
    
    await handleAction('reject', currentRequest.user_id, currentRequest.id, reason);
    closeRejectModal();
  };

  const handleAction = async (action, userId, requestId, extraData = null) => {
    const actionKey = `${action}-${requestId}`;
    
    if (loadingActions[actionKey]) return;
    
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      let endpoint = '';
      let payload = { userId, requestId };
      
      if (action === 'approve') {
        endpoint = '/approve-withdrawal';
        payload = { ...payload, amount: extraData };
      } else if (action === 'reject') {
        endpoint = '/reject-withdrawal';
        payload = { ...payload, reason: extraData }; // Add reason to payload
      } else if (action === 'delete') {
        endpoint = '/delete-withdrawal';
      }
      
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, payload);
      
      // Remove request from local state
      setData(prev => prev.filter(item => item.id !== requestId));
    } catch (error) {
      console.error(`Error with ${action} action:`, error);
      alert(`Failed to ${action} request`);
    } finally {
      // Clear loading state
      setLoadingActions(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  };


  return (
    <div className=" min-h-screen">
      <Sidebar />
      <Modal show={showRejectModal} onHide={closeRejectModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Rejection Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-3">
            <div>
              <label className="flex items-center space-x-3 mb-2">
                <input
                  type="radio"
                  name="rejectionReason"
                  value="Invalid BEP 20 Address"
                  checked={rejectionReason === 'Invalid BEP 20 Address'}
                  onChange={() => setRejectionReason('Invalid BEP 20 Address')}
                  className="form-radio text-purple-600"
                />
                <span>Invalid BEP 20 Address</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-3 mb-2">
                <input
                  type="radio"
                  name="rejectionReason"
                  value="Reject For Security Reason"
                  checked={rejectionReason === 'Reject For Security Reason'}
                  onChange={() => setRejectionReason('Reject For Security Reason')}
                  className="form-radio text-purple-600"
                />
                <span>Reject For Security Reason</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-3 mb-2">
                <input
                  type="radio"
                  name="rejectionReason"
                  value="custom"
                  checked={rejectionReason === 'custom'}
                  onChange={() => setRejectionReason('custom')}
                  className="form-radio text-purple-600"
                />
                <span>Custom Message</span>
              </label>
            </div>
            
            {rejectionReason === 'custom' && (
              <div className="mt-2">
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter your rejection reason"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-transparent"
                  rows={3}
                />
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeRejectModal}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleReject}
            disabled={loadingActions[`reject-${currentRequest?.id}`]}
          >
            {loadingActions[`reject-${currentRequest?.id}`] ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : null}
            Confirm Rejection
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="p-4 ">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-xl mr-4">
                <HiOutlineCreditCard  className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Withdrawal Requests</h1>
                <p className="text-gray-600">Manage user withdrawal requests</p>
              </div>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-transparent"
                placeholder="Search by ID, account number, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
           
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-purple-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Request ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Amount
                      </th>
                    
                    
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Total Withdrawn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {request.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {RemoveTrailingZeros(Number(request.amount))}
                          </div>
                        </td>
                    
                      
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {request.user_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.team}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.total_withdrawn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAction('approve', request.user_id, request.id, request.amount)}
                              disabled={loadingActions[`approve-${request.id}`]}
                              className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                                loadingActions[`approve-${request.id}`]
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {loadingActions[`approve-${request.id}`] ? (
                                <FaSpinner className="animate-spin mr-1" />
                              ) : (
                                <HiOutlineCheckCircle className="mr-1" />
                              )}
                              Approve
                            </button>
                            
                            <button
                  onClick={() => openRejectModal(request)}
                  className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                    loadingActions[`reject-${request.id}`]
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  {loadingActions[`reject-${request.id}`] ? (
                    <FaSpinner className="animate-spin mr-1" />
                  ) : (
                    <HiOutlineXCircle className="mr-1" />
                  )}
                  Reject
                </button>
                            
                            <button
                              onClick={() => handleAction('delete', request.user_id, request.id)}
                              disabled={loadingActions[`delete-${request.id}`]}
                              className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                                loadingActions[`delete-${request.id}`]
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {loadingActions[`delete-${request.id}`] ? (
                                <FaSpinner className="animate-spin mr-1" />
                              ) : (
                                <HiOutlineTrash className="mr-1" />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No withdrawal requests found</h3>
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

export default WithdrawRequests;