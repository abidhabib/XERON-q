// components/PublicAdminCard.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams to get the token from the URL
import { MessageCircle, Camera, Send } from 'lucide-react';

const PublicAdminCard = () => {
  // Base64 encoded default avatar (fallback image)
  const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMzYjhmZjEiPjxwYXRoIGQ9Ik0xMiAxMmMxLjEgMCAyLS45IDItMnMtLjktMi0yLTItMiAuOS0yIDIgLjkgMiAyIDJ6bTYgOGgtMTJ2LTFjMC0yIDEtNCAzLTYuNSA5LjUtMiAzLTYuNSAzLTYuNXMyLjUgNC41IDYgNi41YzIgMS41IDMgMy41IDMgNS41djF6Ii8+PC9zdmc+";

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Get the token parameter from the URL path (e.g., /admin-profile/:token)
  const { token } = useParams();

  useEffect(() => {
    fetchPublicProfile();
  }, [retryCount, token]); // Re-fetch if token or retryCount changes

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error('API base URL not configured. Please check your environment variables.');
      }

      // --- Determine the API endpoint based on token presence ---
      let url;
      if (token) {
        // Use the new token-validated endpoint if a token is present in the URL
        console.log("Fetching profile using access token...");
        url = `${apiBaseUrl}/api/admin/public-profile/${encodeURIComponent(token)}`;
      } else {
        // Fallback to the general public endpoint if no token (optional, adjust as needed)
        console.warn("No access token provided, using general public endpoint.");
        url = `${apiBaseUrl}/api/public/admin-profile`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add a timeout for the request
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: `;
        switch (response.status) {
          case 401:
            // Specifically handle 401 for token issues
            errorMessage += token ? 'Invalid or expired access link.' : 'Unauthorized access.';
            break;
          case 404:
            errorMessage += 'Profile not found.';
            break;
          case 500:
            errorMessage += 'Server error. Please try again later.';
            break;
          case 503:
            errorMessage += 'Service unavailable. Please try again later.';
            break;
          default:
            errorMessage += response.statusText || 'Unknown error occurred.';
        }
        throw new Error(errorMessage);
      }

      // Validate response content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format. Expected JSON data.');
      }

      const data = await response.json();

      // Validate response data structure
      if (!data || (!data.profile && !data.socialLinks)) {
        throw new Error('Invalid profile data structure received from server.');
      }

      setProfileData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      
      // Construct user-friendly error message
      let errorMessage = 'Failed to load admin profile. ';
      
      if (err.name === 'AbortError') {
        errorMessage += 'Request timeout. Please check your connection.';
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please try again later.';
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const retryFetch = () => {
    setRetryCount(prev => prev + 1);
  };

  const getIconComponent = (iconName) => {
    const icons = { MessageCircle, Camera, Send };
    return icons[iconName] || MessageCircle;
  };

  // --- Render States ---

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            {token ? 'Verifying access link...' : 'Loading admin profile...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Profile</h3>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={retryFetch}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where profile data exists but is incomplete
  if (!profileData || (!profileData.profile && !profileData.socialLinks)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Profile Data Incomplete</h3>
          <p className="text-gray-600 mb-4">The admin profile data appears to be incomplete or missing.</p>
          <button 
            onClick={retryFetch}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Reload Profile
          </button>
        </div>
      </div>
    );
  }

  const { profile, socialLinks } = profileData;

  // Handle case where profile object itself is missing
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Profile Not Available</h3>
          <p className="text-gray-600">Admin profile information is not configured yet.</p>
        </div>
      </div>
    );
  }

  // --- Main Success Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Main Profile Card */}
        <div className="relative overflow-hidden rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl">
          {/* Gradient Header */}
          <div className="h-40 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          {/* Profile Content */}
          <div className="bg-white px-6 pb-8 -mt-16 relative z-10 rounded-b-3xl shadow-inner">
            {/* Profile Image */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                {/* --- CORRECTED IMAGE SRC LOGIC --- */}
                <img
                  // Use profile image URL if available, otherwise fallback. Prefix with API base URL if it's not an absolute URL or data URL.
                  src={
                    profile.profile_image_url
                      ? profile.profile_image_url.startsWith('http') || profile.profile_image_url.startsWith('data:')
                        ? profile.profile_image_url
                        : `${import.meta.env.VITE_API_BASE_URL || ''}${profile.profile_image_url}`
                      : DEFAULT_AVATAR
                  }
                  alt={`${profile.full_name || 'Admin'} Profile`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.warn('Profile image failed to load, using fallback');
                    e.target.src = DEFAULT_AVATAR;
                  }}
                  loading="lazy"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800 mb-1 truncate">
                {profile.full_name || 'Admin User'}
              </h1>
              <p className="text-sm text-gray-500 min-h-[20px]">
                {profile.title || 'System Administrator'}
              </p>
            </div>
          </div>
        </div>

        {/* Connect Section */}
        {socialLinks && socialLinks.length > 0 && (
          <>
            <div className="text-center mt-8 mb-6">
              <h2 className="text-lg font-semibold text-gray-700">Connect with Admin</h2>
              <p className="text-xs text-gray-500 mt-1">Choose your preferred contact method</p>
            </div>

            {/* Social Links */}
            <div className="flex justify-center gap-4 flex-wrap">
              {socialLinks.map((social, index) => {
                // --- REMOVED CONSOLE.LOG FOR PRODUCTION ---
                // console.log("Social Link:", social); 

                // Validate social link data before rendering
                if (!social.platform_name || !social.icon_name) {
                  console.warn('Skipping invalid social link at index:', index);
                  return null;
                }

                const IconComponent = getIconComponent(social.icon_name);
                
                return (
                  <a
                    key={`${social.platform_name}-${index}`} // Consider using a unique ID if available in your data
                    href={social.url || '#'}
                    target={social.url ? "_blank" : "_self"}
                    rel={social.url ? "noopener noreferrer" : ""}
                    className={`group flex flex-col items-center ${social.url ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    aria-label={`Connect via ${social.platform_name}`}
                    onClick={(e) => {
                      if (!social.url) {
                        e.preventDefault();
                        // Optionally show a tooltip or message for disabled links
                      }
                    }}
                  >
                    <div
                      className={`${social.color_class || 'bg-gray-500'} w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-200 group-hover:scale-110 group-active:scale-95 shadow-md hover:shadow-lg`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-gray-600 mt-2 font-medium text-center max-w-[70px] truncate">
                      {social.platform_name}
                    </span>
                  </a>
                );
              })}
            </div>
          </>
        )}

        {/* Empty state for social links */}
        {(!socialLinks || socialLinks.length === 0) && (
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">No contact methods available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicAdminCard;