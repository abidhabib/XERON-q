// components/AdminProfileManager.js
import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Camera,
  Send,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Link as LinkIcon, // Import Link icon
  Copy // Import Copy icon
} from 'lucide-react';
import { Sidebar } from '../SideBarSection/Sidebar';

const AdminProfileManager = () => {
  const [profileData, setProfileData] = useState({
    fullName: 'Admin User',
    title: 'System Administrator',
    profileImage: null,
    // Use a more robust default or state for image URL
    profileImageUrl: null // Start with null, handle fallback in render
  });

  const [socialLinks, setSocialLinks] = useState([
    { name: 'WhatsApp', icon: 'MessageCircle', color: 'bg-green-500', href: '' },
    { name: 'Email', icon: 'Send', color: 'bg-blue-500', href: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  // --- NEW STATE FOR LINK GENERATION ---
  const [generatedLink, setGeneratedLink] = useState(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [apiErrors, setApiErrors] = useState({}); // State to hold API error messages
const [storedPublicLink, setStoredPublicLink] = useState(null); // New state

  // Load existing data
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    setApiErrors(prev => ({ ...prev, fetch: null })); // Clear previous fetch error
    try {
      const token = localStorage.getItem('adminToken');
      console.log("🚀 [PROD DEBUG] token:", token);
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      // Basic validation
      if (!token) {
        console.error('Authentication token not found.');
        setApiErrors(prev => ({ ...prev, fetch: 'Authentication required. Please log in.' }));
        setInitialLoad(false);
        return;
      }
      if (!apiBaseUrl) {
        console.error('API base URL not configured.');
        setApiErrors(prev => ({ ...prev, fetch: 'Application configuration error.' }));
        setInitialLoad(false);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Null/undefined checks for data structure
        if (data && typeof data === 'object') {
          if (data.profile && typeof data.profile === 'object') {
            setProfileData(prev => ({
              ...prev,
              fullName: data.profile.full_name ?? 'Admin User',
              title: data.profile.title ?? 'System Administrator',
              profileImageUrl: data.profile.profile_image_url ?? null // Keep as null if not present
            }));
          } else {
             console.warn('Profile data missing or invalid in response:', data);
             // Keep defaults or previous state
          }
          if (Array.isArray(data.socialLinks)) {
            setSocialLinks(data.socialLinks.map(link => ({
              name: link.platform_name ?? '',
              icon: link.icon_name ?? 'MessageCircle',
              color: link.color_class ?? 'bg-gray-500',
              href: link.url ?? ''
            })));
          } else {
             console.warn('Social links data missing or invalid array in response:', data);
             // Keep defaults or previous state
          }
        } else {
           console.error('Unexpected data structure received:', data);
           setApiErrors(prev => ({ ...prev, fetch: 'Received unexpected data format.' }));
        }
      } else {
        // Handle non-2xx responses
        let errorMsg = `Failed to load profile (HTTP ${response.status}). `;
        if (response.status === 401 || response.status === 403) {
            errorMsg += 'Please check your login status.';
            // Potentially redirect to login or show specific message
        } else if (response.status === 404) {
            errorMsg += 'Profile not found.';
        } else if (response.status >= 500) {
            errorMsg += 'Server error. Please try again later.';
        } else {
            errorMsg += response.statusText || 'Unknown error.';
        }
        console.error(errorMsg);
        setApiErrors(prev => ({ ...prev, fetch: errorMsg }));
      }
    } catch (error) {
      console.error('Network or parsing error fetching admin profile:', error);
      setApiErrors(prev => ({ ...prev, fetch: 'Network error or failed to process response. Please check your connection.' }));
    } finally {
      setInitialLoad(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    // Add basic validation if needed, e.g., max length
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]; // Safe navigation
    if (file) {
      // Optional: Add file type/size validation here
      if (!file.type.startsWith('image/')) {
         alert('Please select an image file.');
         return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
         alert('File size exceeds 5MB limit.');
         return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Check if reading was successful
        if (reader.error) {
            console.error('Error reading file:', reader.error);
            alert('Failed to read the selected image.');
            return;
        }
        setProfileData(prev => ({
          ...prev,
          profileImage: file,
          profileImageUrl: reader.result // This will be the data URL
        }));
      };
      reader.onerror = (err) => {
         console.error('FileReader error:', err);
         alert('An error occurred while reading the file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLinkChange = (index, field, value) => {
    // Prevent index out of bounds
    if (index < 0 || index >= socialLinks.length) {
        console.warn(`Invalid index ${index} for social link change`);
        return;
    }
    // Prevent invalid field names if necessary (basic check)
    const validFields = ['name', 'icon', 'color', 'href'];
    if (!validFields.includes(field)) {
        console.warn(`Invalid field name '${field}' for social link change`);
        return;
    }

    const updatedLinks = [...socialLinks];
    // Ensure the object at index exists before modifying
    if (updatedLinks[index]) {
        updatedLinks[index] = { ...updatedLinks[index], [field]: value };
        setSocialLinks(updatedLinks);
    } else {
        console.warn(`Social link at index ${index} is undefined.`);
    }
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
     // Prevent index out of bounds
    if (index < 0 || index >= socialLinks.length) {
        console.warn(`Invalid index ${index} for removing social link`);
        return;
    }
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
  };

  const resetToDefault = async () => {
    if (!window.confirm('Are you sure you want to reset to default settings?')) {
      return;
    }
    setApiErrors(prev => ({ ...prev, reset: null })); // Clear previous reset error
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      if (!token || !apiBaseUrl) {
        throw new Error('Missing authentication or configuration.');
      }

      const response = await fetch(`${apiBaseUrl}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resetToDefault: true })
      });

      if (response.ok) {
        alert('Profile reset to default successfully!');
        // Clear generated link on reset
        setGeneratedLink(null);
        setCopySuccess('');
        fetchAdminProfile(); // Reload the default data
      } else {
        let errorMsg = `Failed to reset profile (HTTP ${response.status}). `;
        if (response.status >= 500) {
            errorMsg += 'Server error. Please try again later.';
        } else {
            errorMsg += response.statusText || 'Unknown error.';
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error resetting profile:', error);
      const userMessage = error.message || 'Error resetting profile. Please try again.';
      setApiErrors(prev => ({ ...prev, reset: userMessage }));
      alert(userMessage); // Or display in UI
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Function to generate the public access link ---
  const generatePublicLink = async () => {
    setApiErrors(prev => ({ ...prev, generateLink: null })); // Clear previous link error
    setIsGeneratingLink(true);
    setGeneratedLink(null);
    setCopySuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      if (!token || !apiBaseUrl) {
        throw new Error('Missing authentication or configuration.');
      }

      const response = await fetch(`${apiBaseUrl}/api/admin/generate-public-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
        // No body needed for this request based on the backend code
      });

      const data = await response.json();

      if (response.ok && data && data.success) {
        setGeneratedLink(data.link);
      } else {
        let errorMsg = 'Failed to generate link. ';
        if (data && data.error) {
            errorMsg += data.error;
        } else if (response.status === 401 || response.status === 403) {
             errorMsg += 'Access denied. Please ensure you have admin privileges.';
        } else if (response.status >= 500) {
             errorMsg += 'Server error. Please try again later.';
        } else {
             errorMsg += `Server responded with status ${response.status}.`;
        }
        console.error('Generate link error details:', { status: response.status, data });
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error generating public link:', error);
      // Differentiate between network errors and application errors if possible
      const userMessage = error.message || 'Network error while generating link. Please check your connection.';
      setApiErrors(prev => ({ ...prev, generateLink: userMessage }));
      alert(userMessage); // Or display in UI
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // --- NEW: Function to copy the link to clipboard ---
  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink).then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      }).catch(err => {
        console.error('Failed to copy link: ', err);
        setCopySuccess('Failed to copy!');
        // Optionally, show user feedback for clipboard error
        setTimeout(() => setCopySuccess(''), 2000);
      });
    } else {
        console.warn('Attempted to copy but generatedLink is null/empty');
    }
  };

  const saveProfile = async () => {
     setApiErrors(prev => ({ ...prev, save: null })); // Clear previous save error
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      if (!token || !apiBaseUrl) {
        throw new Error('Missing authentication or configuration.');
      }

      // Upload profile image if changed
      let imageUrl = profileData.profileImageUrl; // Start with current URL or null
      if (profileData.profileImage) {
        const formData = new FormData();
        formData.append('profileImage', profileData.profileImage);
        const imageResponse = await fetch(`${apiBaseUrl}/api/admin/profile/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type for FormData, let browser set it
          },
          body: formData
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          // Check structure of image response
          if (imageData && imageData.imageUrl) {
             imageUrl = imageData.imageUrl;
          } else {
             console.warn('Unexpected image upload response structure:', imageData);
             // Decide whether to proceed with save or show error
             // For now, let's proceed with the old imageUrl or null
          }
        } else {
           let errorMsg = `Failed to upload image (HTTP ${imageResponse.status}). `;
           if (imageResponse.status >= 500) {
             errorMsg += 'Server error. Profile saved without new image.';
             // Decide if you want to abort the whole save or just warn
             // For now, let's warn and continue
             console.error(errorMsg);
             alert(errorMsg);
           } else {
             errorMsg += imageResponse.statusText || 'Unknown error.';
             throw new Error(errorMsg); // Stop save on client/4xx errors
           }
        }
      }

      // Prepare data for saving profile info and social links
      const saveData = {
        fullName: profileData.fullName ?? 'Admin User',
        title: profileData.title ?? 'System Administrator',
        profileImageUrl: imageUrl ?? '/uploads/default-admin.png', // Fallback if still null
        socialLinks: socialLinks.map(link => ({
            name: link.name ?? '',
            icon: link.icon ?? 'MessageCircle',
            color: link.color ?? 'bg-gray-500',
            href: link.href ?? ''
        }))
      };

      // Save profile info and social links
      const response = await fetch(`${apiBaseUrl}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        alert('Admin profile updated successfully!');
        // Clear generated link on save, as profile data might have changed
        setGeneratedLink(null);
        setCopySuccess('');
        // Optionally, re-fetch to ensure UI is in sync
        // fetchAdminProfile();
      } else {
        let errorMsg = `Failed to update profile (HTTP ${response.status}). `;
        if (response.status >= 500) {
            errorMsg += 'Server error. Please try again later.';
        } else {
            errorMsg += response.statusText || 'Unknown error.';
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      // Check if it's a specific field error or a general one
      const userMessage = error.message || 'Error updating profile. Please try again.';
      setApiErrors(prev => ({ ...prev, save: userMessage }));
      alert(userMessage); // Or display in UI
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName) => {
    // Handle potential null/undefined iconName
    if (!iconName) return MessageCircle;
    const icons = { MessageCircle, Camera, Send };
    return icons[iconName] || MessageCircle;
  };

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin profile...</p>
          {/* Display fetch errors if any during initial load */}
          {apiErrors.fetch && (
            <p className="mt-2 text-red-500 text-sm">{apiErrors.fetch}</p>
          )}
        </div>
      </div>
    );
  }

  // Define a fallback image source
  const DEFAULT_AVATAR = "image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMzYjhmZjEiPjxwYXRoIGQ9Ik0xMiAxMmMxLjEgMCAyLS45IDItMnMtLjktMi0yLTItMiAuOS0yIDIgLjkgMiAyIDJ6bTYgOGgtMTJ2LTFjMC0yIDEtNCAzLTYuNSA5LjUtMiAzLTYuNSAzLTYuNXMyLjUgNC41IDYgNi41YzIgMS41IDMgMy41IDMgNS41djF6Ii8+PC9zdmc+";
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-4">
          <div className="max-w-4xl mx-auto w-full">
            {/* Header with Generate Link and Reset buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Public Admin Profile Manager</h1>
              <div className="flex flex-wrap gap-2">
                {/* --- NEW: Generate Link Button --- */}
                <button
                  onClick={generatePublicLink}
                  disabled={isGeneratingLink || loading} // Disable during other operations too
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {isGeneratingLink ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Generate Public Link
                    </>
                  )}
                </button>
                <button
                  onClick={resetToDefault}
                  disabled={loading || isGeneratingLink}
                  className="flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </button>
              </div>
            </div>

            {/* --- NEW: Display Generated Link --- */}
            {generatedLink && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h2 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                  <LinkIcon className="w-5 h-5 mr-2" />
                  Your Public Link
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white truncate"
                    title={generatedLink}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors flex items-center whitespace-nowrap"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </button>
                </div>
                {copySuccess && <p className="mt-2 text-sm text-green-600">{copySuccess}</p>}
                <p className="mt-2 text-xs text-blue-600">
                  This link is valid  securely.
                </p>
                 {/* Display errors specifically for link generation if they occur after initial display */}
                {apiErrors.generateLink && (
                 <p className="mt-2 text-sm text-red-600">{apiErrors.generateLink}</p>
                )}
              </div>
            )}

            {/* Display general fetch errors if not in initial load */}
            {apiErrors.fetch && !initialLoad && (
             <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-700">{apiErrors.fetch}</p>
                <button
                 onClick={fetchAdminProfile}
                 className="mt-2 px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                 Retry
                </button>
             </div>
            )}

            {/* Profile Information Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Admin Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName ?? ''} // Handle potential null
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
                    value={profileData.title ?? ''} // Handle potential null
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
                    {/* Robust image source handling */}
                                    <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${profileData.profileImageUrl}`}
                    alt="Profile Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                    // The onError handler below logs the warning
                    onError={(e) => {
                      console.warn('Profile image failed to load, using fallback'); // <-- This is line 472 or similar
                      // Note: Your current code snippet doesn't show setting a fallback src here,
                      // but the warning message indicates one is intended or handled elsewhere.
                      // You should add logic to set a fallback image source.
                      // e.g., e.target.src = '/path/to/your/fallback-image.png';
                      // Or use the DEFAULT_AVATAR data URL from previous examples.
                    }}
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
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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
              {/* Display error for social links if needed (e.g., if data was corrupt) */}
              {/* {apiErrors.socialLinks && <p className="text-red-500 mb-2">{apiErrors.socialLinks}</p>} */}
              <div className="space-y-4">
                {socialLinks.length > 0 ? (
                  socialLinks.map((link, index) => {
                     // Additional safety check for link object
                     if (!link || typeof link !== 'object') {
                         console.error(`Invalid social link object at index ${index}:`, link);
                         return null; // Skip rendering invalid link
                     }
                    const IconComponent = getIconComponent(link.icon);
                    return (
                      <div key={`social-${index}`} className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Platform Name</label>
                            <input
                              type="text"
                              value={link.name ?? ''} // Handle potential null/undefined
                              onChange={(e) => handleSocialLinkChange(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., WhatsApp"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">URL</label>
                            <input
                              type="url" // Helps with validation
                              value={link.href ?? ''} // Handle potential null/undefined
                              onChange={(e) => handleSocialLinkChange(index, 'href', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Icon</label>
                            <select
                              value={link.icon ?? 'MessageCircle'} // Handle potential null/undefined
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
                              value={link.color ?? 'bg-gray-500'} // Handle potential null/undefined
                              onChange={(e) => handleSocialLinkChange(index, 'color', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., bg-green-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-center md:justify-start">
                          <div className={`${link.color ?? 'bg-gray-500'} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => removeSocialLink(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            aria-label={`Remove ${link.name ?? 'link'} link`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-4">No social links added yet.</p>
                )}
              </div>
            </div>

             {/* Display save/reset errors */}
            {(apiErrors.save || apiErrors.reset) && (
             <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                {apiErrors.save && <p className="text-red-700 mb-2">{apiErrors.save}</p>}
                {apiErrors.reset && <p className="text-red-700">{apiErrors.reset}</p>}
             </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={resetToDefault}
                disabled={loading || isGeneratingLink}
                className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Reset to Default
              </button>
              <button
                onClick={saveProfile}
                disabled={loading || isGeneratingLink}
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
        </main>
      </div>
    </div>
  );
};

export default AdminProfileManager;