// components/AdminProfileManager.js
import React, { useState, useEffect } from 'react';
import { MessageCircle, Camera, Send, Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { Sidebar } from '../SideBarSection/Sidebar';

const AdminProfileManager = () => {
  const [profileData, setProfileData] = useState({
    fullName: 'Admin User',
    title: 'System Administrator',
    profileImage: null,
    profileImageUrl: '/uploads/default-admin.png'
  });

  const [socialLinks, setSocialLinks] = useState([
    { name: 'WhatsApp', icon: 'MessageCircle', color: 'bg-green-500', href: '' },
    { name: 'Email', icon: 'Send', color: 'bg-blue-500', href: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load existing data
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth system
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.profile) {
          setProfileData(prev => ({
            ...prev,
            fullName: data.profile.full_name || 'Admin User',
            title: data.profile.title || 'System Administrator',
            profileImageUrl: data.profile.profile_image_url || '/uploads/default-admin.png'
          }));
        }
        
        if (data.socialLinks && data.socialLinks.length > 0) {
          setSocialLinks(data.socialLinks.map(link => ({
            name: link.platform_name,
            icon: link.icon_name,
            color: link.color_class,
            href: link.url
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setInitialLoad(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profileImage: file,
          profileImageUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLinkChange = (index, field, value) => {
    const updatedLinks = [...socialLinks];
    updatedLinks[index][field] = value;
    setSocialLinks(updatedLinks);
  };

  const addSocialLink = () => {
    setSocialLinks(prev => [...prev, {
      name: '',
      icon: 'MessageCircle',
      color: 'bg-gray-500',
      href: ''
    }]);
  };

  const removeSocialLink = (index) => {
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
  };

  const resetToDefault = async () => {
    if (!window.confirm('Are you sure you want to reset to default settings?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ resetToDefault: true })
      });

      if (response.ok) {
        alert('Profile reset to default successfully!');
        fetchAdminProfile(); // Reload the default data
      } else {
        throw new Error('Failed to reset profile');
      }
    } catch (error) {
      console.error('Error resetting profile:', error);
      alert('Error resetting profile');
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      // Upload profile image if changed
      let imageUrl = profileData.profileImageUrl;
      if (profileData.profileImage) {
        const formData = new FormData();
        formData.append('profileImage', profileData.profileImage);
        
        const imageResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/profile/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl;
        }
      }

      // Save profile info and social links
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          title: profileData.title,
          profileImageUrl: imageUrl,
          socialLinks: socialLinks
        })
      });

      if (response.ok) {
        alert('Admin profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error updating profile');
    }
    setLoading(false);
  };

  const getIconComponent = (iconName) => {
    const icons = { MessageCircle, Camera, Send };
    return icons[iconName] || MessageCircle;
  };

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-24 flex overflow-hidden bg-gray-50 flex-col justify-between min-h-screen items-center ">
        <Sidebar/>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Public Admin Profile Manager</h1>
          <button
            onClick={resetToDefault}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </button>
        </div>
        
        {/* Profile Information Section */}
        <div className="bg-white rounded-lg shadow-md p-12  mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Admin Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={profileData.fullName}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Title/Position</label>
              <input
                type="text"
                name="title"
                value={profileData.title}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter title"
              />
            </div>
          </div>
          
          {/* Profile Image Upload */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">Profile Image</label>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}${profileData.profileImageUrl}`}
                  alt="Profile Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                />
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="bg-white rounded-lg shadow-md py-6 px-12 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Contact Links</h2>
            <button
              onClick={addSocialLink}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Link
            </button>
          </div>
          
          <div className="space-y-4">
            {socialLinks.map((link, index) => {
              const IconComponent = getIconComponent(link.icon);
              return (
                <div key={index} className="flex flex-col md:flex-row gap-4 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Platform Name</label>
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => handleSocialLinkChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., WhatsApp"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">URL</label>
                      <input
                        type="url"
                        value={link.href}
                        onChange={(e) => handleSocialLinkChange(index, 'href', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Icon</label>
                      <select
                        value={link.icon}
                        onChange={(e) => handleSocialLinkChange(index, 'icon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MessageCircle">Message Circle</option>
                        <option value="Camera">Camera</option>
                        <option value="Send">Send</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Color Class</label>
                      <input
                        type="text"
                        value={link.color}
                        onChange={(e) => handleSocialLinkChange(index, 'color', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., bg-green-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center md:justify-start">
                    <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => removeSocialLink(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={resetToDefault}
            disabled={loading}
            className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Reset to Default
          </button>
          <button
            onClick={saveProfile}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
    </div>
  );
};

export default AdminProfileManager;