// components/AdminProfileManager.js
import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Camera,
  Send,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Link as LinkIcon,
  Copy,
  User,
  Briefcase,
  Globe,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

const AdminProfileManager = () => {
  const [profileData, setProfileData] = useState({
    fullName: 'Admin User',
    title: 'System Administrator',
    profileImageUrl: null
  });

  const [socialLinks, setSocialLinks] = useState([
    { name: 'WhatsApp', icon: 'MessageCircle', color: 'bg-green-500', href: '' },
    { name: 'Email', icon: 'Send', color: 'bg-blue-500', href: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [apiErrors, setApiErrors] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Add notification helper
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Load existing data
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    setApiErrors(prev => ({ ...prev, fetch: null }));
    try {
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      if (!token) {
        addNotification('Authentication required. Please log in.', 'error');
        setInitialLoad(false);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/admin/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.profile) {
          setProfileData(prev => ({
            ...prev,
            fullName: data.profile.full_name || 'Admin User',
            title: data.profile.title || 'System Administrator',
            profileImageUrl: data.profile.profile_image_url || null
          }));
        }
        if (Array.isArray(data.socialLinks)) {
          setSocialLinks(data.socialLinks.map(link => ({
            name: link.platform_name || '',
            icon: link.icon_name || 'MessageCircle',
            color: link.color_class || 'bg-gray-500',
            href: link.url || ''
          })));
        }
        addNotification('Profile loaded successfully', 'success');
      } else {
        addNotification(`Failed to load profile (HTTP ${response.status})`, 'error');
      }
    } catch (error) {
      addNotification('Network error loading profile', 'error');
    } finally {
      setInitialLoad(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addNotification('Please select an image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        addNotification('File size exceeds 5MB limit', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profileImage: file
        }));
        setImagePreview(reader.result);
        addNotification('Image selected successfully', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLinkChange = (index, field, value) => {
    const updatedLinks = [...socialLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setSocialLinks(updatedLinks);
  };

  const addSocialLink = () => {
    setSocialLinks(prev => [...prev, {
      name: '',
      icon: 'MessageCircle',
      color: 'bg-gray-500',
      href: ''
    }]);
    addNotification('New social link field added', 'info');
  };

  const removeSocialLink = (index) => {
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
    addNotification('Social link removed', 'info');
  };

  const resetToDefault = async () => {
    if (!window.confirm('Reset to default settings?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${apiBaseUrl}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resetToDefault: true })
      });

      if (response.ok) {
        setGeneratedLink(null);
        setCopySuccess('');
        setImagePreview(null);
        fetchAdminProfile();
        addNotification('Profile reset to default', 'success');
      }
    } catch (error) {
      addNotification('Error resetting profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generatePublicLink = async () => {
    setIsGeneratingLink(true);
    setGeneratedLink(null);
    setCopySuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${apiBaseUrl}/api/admin/generate-public-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        setGeneratedLink(data.link);
        addNotification('Public link generated', 'success');
      }
    } catch (error) {
      addNotification('Error generating link', 'error');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink).then(() => {
        setCopySuccess('Copied!');
        addNotification('Link copied to clipboard', 'success');
        setTimeout(() => setCopySuccess(''), 2000);
      }).catch(err => {
        addNotification('Failed to copy link', 'error');
      });
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      let imageUrl = profileData.profileImageUrl;
      if (profileData.profileImage) {
        const formData = new FormData();
        formData.append('profileImage', profileData.profileImage);
        const imageResponse = await fetch(`${apiBaseUrl}/api/admin/profile/image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData?.imageUrl) imageUrl = imageData.imageUrl;
        }
      }

      const saveData = {
        fullName: profileData.fullName || 'Admin User',
        title: profileData.title || 'System Administrator',
        profileImageUrl: imageUrl || '/uploads/default-admin.png',
        socialLinks: socialLinks.map(link => ({
          name: link.name || '',
          icon: link.icon || 'MessageCircle',
          color: link.color || 'bg-gray-500',
          href: link.href || ''
        }))
      };

      const response = await fetch(`${apiBaseUrl}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        setGeneratedLink(null);
        setCopySuccess('');
        setImagePreview(null);
        addNotification('Profile saved successfully', 'success');
      }
    } catch (error) {
      addNotification('Error saving profile', 'error');
    } finally {
      setLoading(false);
    }
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
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const DEFAULT_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMzYjhmZjEiPjxwYXRoIGQ9Ik0xMiAxMmMxLjEgMCAyLS45IDItMnMtLjktMi0yLTItMiAuOS0yIDIgLjkgMiAyIDJ6bTYgOGgtMTJ2LTFjMC0yIDEtNCAzLTYuNSA5LjUtMiAzLTYuNSAzLTYuNXMyLjUgNC41IDYgNi41YzIgMS41IDMgMy41IDMgNS41djF6Ii8+PC9zdmc+`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(({ id, message, type }) => (
          <div
            key={id}
            className={`flex items-center px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
              type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
              type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            {type === 'success' ? (
              <Check className="w-5 h-5 mr-2" />
            ) : type === 'error' ? (
              <AlertCircle className="w-5 h-5 mr-2" />
            ) : (
              <Globe className="w-5 h-5 mr-2" />
            )}
            <span className="text-sm">{message}</span>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Manager</h1>
              <p className="text-gray-600 mt-1">Manage your public profile and contact links</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={generatePublicLink}
                disabled={isGeneratingLink || loading}
                className="flex items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isGeneratingLink ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Public Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Link */}
          {generatedLink && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 mb-1">Public Link</div>
                  <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                    <LinkIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="truncate text-sm font-mono">{generatedLink}</span>
                  </div>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center whitespace-nowrap"
                >
                  {copySuccess ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copySuccess || 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image Upload */}
                <div className="lg:w-1/3">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full mx-auto bg-gray-100 border-4 border-white shadow-lg overflow-hidden">
                      {imagePreview || profileData.profileImageUrl ? (
                        <img
                          src={imagePreview || `${import.meta.env.VITE_API_BASE_URL}${profileData.profileImageUrl}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = DEFAULT_AVATAR;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <User className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 sm:right-auto sm:bottom-0 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
                    >
                      <Camera className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-8">
                    Click the camera icon to upload a profile image
                  </p>
                </div>

                {/* Profile Info */}
                <div className="lg:w-2/3">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="fullName"
                          value={profileData.fullName}
                          onChange={handleProfileChange}
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Title / Position
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="title"
                          value={profileData.title}
                          onChange={handleProfileChange}
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                          placeholder="Enter your position"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Contact Links</h2>
                <button
                  onClick={addSocialLink}
                  className="flex items-center px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Link
                </button>
              </div>
            </div>

            <div className="p-6">
              {socialLinks.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No contact links added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {socialLinks.map((link, index) => {
                    const IconComponent = getIconComponent(link.icon);
                    return (
                      <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                              Platform Name
                            </label>
                            <input
                              type="text"
                              value={link.name}
                              onChange={(e) => handleSocialLinkChange(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="WhatsApp, Email, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                              URL
                            </label>
                            <input
                              type="url"
                              value={link.href}
                              onChange={(e) => handleSocialLinkChange(index, 'href', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`${link.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <button
                            onClick={() => removeSocialLink(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={resetToDefault}
              disabled={loading}
              className="flex items-center px-4 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Defaults
            </button>
            
            <button
              onClick={saveProfile}
              disabled={loading}
              className="flex items-center px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileManager;