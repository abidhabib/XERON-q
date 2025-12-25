// src/pages/admin/MonthlySalaryAdmin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RotateCw, AlertCircle, CheckCircle, X, Eye, User, FileText, Phone, MessageCircle } from 'lucide-react';

const MonthlySalaryAdmin = () => {
  const API = import.meta.env.VITE_API_BASE_URL;

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/api/admin/monthly-salary/applications?status=${filter}`, {
        withCredentials: true
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        setApplications(res.data.data);
      } else {
        throw new Error('Invalid data structure');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load applications. Please try again.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this application?')) return;
    try {
      await axios.patch(`${API}/api/admin/monthly-salary/application/${id}/approve`, {}, {
        withCredentials: true
      });
      setSuccess('Application approved successfully.');
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.error || 'Approval failed. Please try again.');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this application? This cannot be undone.')) return;
    try {
      await axios.patch(`${API}/api/admin/monthly-salary/application/${id}/reject`, {}, {
        withCredentials: true
      });
      setSuccess('Application rejected.');
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.error || 'Rejection failed. Please try again.');
    }
  };

  const viewDetails = (app) => {
    setSelectedApp(app);
    setIsDetailOpen(true);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (filename) => {
    if (!filename) return null;
    return `${API}/uploads/salary-apps/${filename}`;
  };

  // Status badge with consistent styling
  const StatusBadge = ({ status }) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    }[status || 'pending'];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Salary Verification</h1>
        <p className="text-gray-600 mt-1">
          Review and manage user salary applications
        </p>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No {filter} applications</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                There are no salary applications in the <span className="font-medium">{filter}</span> state.
              </p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{app.full_name}</h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-gray-600 text-sm">
                        ID: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{app.document_number}</span>
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Submitted {formatDateTime(app.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Contact & Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{app.phone_country_code} {app.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <MessageCircle className="w-4 h-4" />
                      <span>{app.whatsapp_country_code} {app.whatsapp_number}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 lg:mt-0">
                      <button
                        onClick={() => viewDetails(app)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      {(!app.status || app.status === 'pending') && (
                        <>
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
              <button onClick={() => setIsDetailOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DetailItem label="Full Name" value={selectedApp.full_name} icon={User} />
                <DetailItem label="User ID" value={`#${selectedApp.user_id}`} icon={User} />
                <DetailItem label="ID Type" value={selectedApp.document_type} icon={FileText} />
                <DetailItem label="ID Number" value={selectedApp.document_number} icon={FileText} />
                <DetailItem label="Phone" value={`${selectedApp.phone_country_code} ${selectedApp.phone_number}`} icon={Phone} />
                <DetailItem label="WhatsApp" value={`${selectedApp.whatsapp_country_code} ${selectedApp.whatsapp_number}`} icon={MessageCircle} />
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Submitted At</p>
                  <p className="font-medium">{formatDateTime(selectedApp.created_at)}</p>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">Uploaded Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {selectedApp.identity_front_url && (
                    <ImagePreview src={getImageUrl(selectedApp.identity_front_url)} label="ID Front" />
                  )}
                  {selectedApp.identity_back_url && (
                    <ImagePreview src={getImageUrl(selectedApp.identity_back_url)} label="ID Back" />
                  )}
                  {selectedApp.selfie_url && (
                    <ImagePreview src={getImageUrl(selectedApp.selfie_url)} label="Selfie" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Detail Item
const DetailItem = ({ label, value, icon: Icon }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </p>
    <p className="font-medium text-gray-900 break-words">{value}</p>
  </div>
);

// Image Preview with Fallback
const ImagePreview = ({ src, label }) => (
  <div>
    <p className="text-xs text-gray-500 mb-2 text-center">{label}</p>
    <div className="bg-gray-50 border border-gray-200 rounded-lg aspect-[4/3] overflow-hidden">
      <img
        src={src}
        alt={label}
        className="w-full h-full object-contain"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>';
        }}
      />
    </div>
  </div>
);

export default MonthlySalaryAdmin;