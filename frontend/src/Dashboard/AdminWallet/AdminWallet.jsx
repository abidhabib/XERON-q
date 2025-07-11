import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineQrcode,
  HiOutlineClipboardCopy,

} from 'react-icons/hi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Sidebar } from '../SideBarSection/Sidebar';

const Bep20Settings = () => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    bep20_address: '',
    qr_code_image: null,
    is_active: false
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Fetch BEP20 addresses
  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/bep20`);
      setAddresses(response.data);
    } catch (error) {
      toast.error('Failed to load addresses');
      console.error('Error fetching addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        toast.error('Please upload an image file (PNG, JPG, etc.)');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2MB limit');
        return;
      }
      
      setFormData(prev => ({ ...prev, qr_code_image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formPayload = new FormData();
      formPayload.append('bep20_address', formData.bep20_address);
      formPayload.append('is_active', formData.is_active);
      
      if (formData.qr_code_image) {
        formPayload.append('qr_code_image', formData.qr_code_image);
      }
      
      let response;
      if (formData.id) {
        // Update existing address
        response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/bep20/${formData.id}`, 
          formPayload,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Address updated successfully');
      } else {
        // Create new address
        response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/bep20`, 
          formPayload,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Address added successfully');
      }
      
      // Reset form and refresh data
      resetForm();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error(`Failed to save address: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id: null,
      bep20_address: '',
      qr_code_image: null,
      is_active: false
    });
    setPreviewImage(null);
    setShowForm(false);
  };

  // Edit an address
  const handleEdit = (address) => {
    setFormData({
      id: address.id,
      bep20_address: address.bep20_address,
      qr_code_image: null,
      is_active: address.is_active
    });
    setPreviewImage(address.qr_code_image);
    setShowForm(true);
  };

  // Delete an address
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/bep20/${id}`);
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  // Toggle activation status
  const toggleActivation = async (id) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/bep20/${id}/activate`);
      toast.success('Activation status updated');
      fetchAddresses();
    } catch (error) {
      console.error('Error toggling activation:', error);
      toast.error('Failed to update activation status');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info('Address copied to clipboard');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar sidebarMinimized={sidebarMinimized} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
     
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-2 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-xl mr-3">
                  <HiOutlineQrcode className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-800">BEP20 Addresses</h1>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={fetchAddresses}
                  className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-1 py-1 rounded-lg transition-colors"
                >
                  <HiOutlineRefresh className="mr-1" /> Refresh
                </button>
                <button 
                  onClick={() => setShowForm(true)}
                  className="flex items-center text-xs bg-blue-600 hover:bg-blue-700 text-white px-1 py-1 rounded-lg transition-colors"
                >
                  <HiOutlinePlus className="mr-1" /> Add Address
                </button>
              </div>
            </div>
          </div>
          
          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-sm p-2 mb-4">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                {formData.id ? 'Edit BEP20 Address' : 'Add New BEP20 Address'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      BEP20 Address
                    </label>
                    <input
                      type="text"
                      name="bep20_address"
                      value={formData.bep20_address}
                      onChange={handleInputChange}
                      className="w-full p-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-transparent"
                      placeholder="Enter BEP20 address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      QR Code Image
                    </label>
                    <div className="flex items-center">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        {previewImage ? (
                          <img 
                            src={previewImage} 
                            alt="QR Code Preview" 
                            className="h-20 w-20 object-cover object-contain p-1"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-4 pb-5">
                            <HiOutlineQrcode className="w-6 h-6 text-gray-400 mb-1" />
                            <p className="text-2xs text-gray-500">PNG, JPG up to 2MB</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-xs text-gray-700">
                    Set as active address (only one address can be active at a time)
                  </label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <HiOutlineRefresh className="animate-spin mr-1" /> Saving...
                      </>
                    ) : formData.id ? (
                      "Update Address"
                    ) : (
                      "Add Address"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Content */}
          <div className="bg-white rounded-xl shadow-sm p-2">
            <h2 className="text-md font-semibold text-gray-800 mb-3">Saved BEP20 Addresses</h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <HiOutlineRefresh className="animate-spin text-3xl text-blue-600" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="py-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <HiOutlineQrcode className="w-10 h-10 text-gray-400 mb-3" />
                  <h3 className="text-md font-medium text-gray-900 mb-1">No BEP20 addresses found</h3>
                  <p className="text-xs text-gray-500">
                    Add your first BEP20 address to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {addresses.map((address) => (
                  <div 
                    key={address.id} 
                    className={`border rounded-lg overflow-hidden transition-all ${
                      address.is_active 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                        <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(address.created_at).toLocaleDateString()}
                          </p>
                          <h3 className="font-medium text-sm break-all text-ellipsis text-blue-600 ">
                            {address.bep20_address}
                          </h3>
                         
                        </div>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => copyToClipboard(address.bep20_address)}
                            className="text-gray-500 hover:text-blue-600 text-sm"
                            title="Copy address"
                          >
                            <HiOutlineClipboardCopy />
                          </button>
                          <button 
                            onClick={() => handleEdit(address)}
                            className="text-gray-500 hover:text-blue-600 text-sm"
                            title="Edit"
                          >
                            <HiOutlinePencil />
                          </button>
                          <button 
                            onClick={() => handleDelete(address.id)}
                            className="text-gray-500 hover:text-red-600 text-sm"
                            title="Delete"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-center my-2">
                        {address.qr_code_image && (
                       <img 
                       src={`${import.meta.env.VITE_API_BASE_URL}/storage/${address.qr_code_image.replace('/uploads/', '')}`} 
                       alt="BEP20 QR Code" 
                     />
                     
                        )}
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {address.is_active ? (
                            <span className="flex items-center text-2xs text-green-600">
                              <HiOutlineCheckCircle className="mr-0.5" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center text-2xs text-gray-600">
                              <HiOutlineXCircle className="mr-0.5" /> Inactive
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => toggleActivation(address.id)}
                          className={`px-2 py-1 rounded text-2xs ${
                            address.is_active
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {address.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Bep20Settings;