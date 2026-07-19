import React, { useState, useEffect, useContext } from 'react';
import { Star, MessageCircle, BadgeCheck, AlertTriangle, Info } from 'lucide-react';
import axios from 'axios';
import { UserContext } from './UserContext/UserContext';
import BalanceCard from './new/BalanceCard';

const ratingMeaning = {
  1: 'Very poor guidance',
  2: 'Needs improvement',
  3: 'Average / acceptable',
  4: 'Good mentor',
  5: 'Excellent guidance',
};

const ContactPage = () => {
  const { Userid } = useContext(UserContext);
  const [contactInfo, setContactInfo] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const API = import.meta.env.VITE_API_BASE_URL;

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
  };

  useEffect(() => {
    if (!Userid) return;
    const fetchContactInfo = async () => {
      try {
        const res = await axios.get(`${API}/api/contact-info`, { withCredentials: true });
        if (res.data.success) {
          setContactInfo(res.data.contact);
          setParentId(res.data.parentId);
          setIsVerified(res.data.isVerified);
          setUserRating(res.data.userRating || 0);
          setSelectedRating(res.data.userRating || 0);
          setCanReview(res.data.canReview);
        }
      } catch {
        showToast('Failed to load mentor info', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchContactInfo();
  }, [Userid, API]);

  const handleReviewSubmit = async () => {
    if (!selectedRating || !parentId) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API}/api/review`,
        { parentId, rating: selectedRating },
        { withCredentials: true }
      );
      if (res.data.success) {
        showToast('Review submitted', 'success');
        setContactInfo(prev => ({ ...prev, average_rating: res.data.average_rating }));
        setUserRating(selectedRating);
        setCanReview(false);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPhone = (number, code) => `${code} ${number}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-6 h-6 border-2 border-[#f0f0f0] border-t-[#f0b90b] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <BalanceCard />

      <div className="px-4 pb-6 pt-3">
        {isVerified && (
          <div className="mb-3 flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
            <BadgeCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-sm font-medium">Verified Mentor</span>
          </div>
        )}

        {contactInfo ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#fffbeb] flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#f0b90b]" />
              </div>
              <div className="flex-1">
                <h2 className="text-[#1e2329] font-semibold text-[15px]">{contactInfo.name}</h2>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= (contactInfo.average_rating || 0)
                          ? 'text-[#f0b90b] fill-[#f0b90b]'
                          : 'text-[#e5e7eb]'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] text-[#848e9c] ml-1">
                    {contactInfo.average_rating ? `${contactInfo.average_rating} / 5` : 'No reviews yet'}
                  </span>
                </div>
                {userRating > 0 && (
                  <p className="text-[#848e9c] mt-0.5 text-[11px]">
                    Your Rating: <span className="text-[#f0b90b] font-semibold">{userRating} / 5</span>
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#fafafa] rounded-xl px-3 py-3 mb-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#f0b90b] mt-0.5 flex-shrink-0" />
              <p className="text-[13px] text-[#374151] leading-relaxed">
                {contactInfo.mentor_description ||
                  'This mentor provides guidance, onboarding help, and support related to your account growth and salary eligibility.'}
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[#fafafa] rounded-xl px-3 py-3">
                <div>
                  <p className="text-[11px] font-medium text-[#848e9c] uppercase tracking-wider">WhatsApp</p>
                  <p className="text-sm text-[#1e2329] font-medium mt-0.5">
                    {formatPhone(contactInfo.whatsapp_number, contactInfo.whatsapp_country_code)}
                  </p>
                </div>
                <a
                  href={`https://wa.me/${contactInfo.whatsapp_country_code.replace('+', '')}${contactInfo.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  Message
                </a>
              </div>

              {contactInfo.phone_number && (
                <div className="flex items-center bg-[#fafafa] rounded-xl px-3 py-3">
                  <div>
                    <p className="text-[11px] font-medium text-[#848e9c] uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-[#1e2329] font-medium mt-0.5">
                      {formatPhone(contactInfo.phone_number, contactInfo.phone_country_code)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Review */}
            {canReview && parentId && (
              <div className="mt-4 pt-4 border-t border-[#f5f5f5]">
                <p className="text-sm text-[#1e2329] font-semibold mb-1">Rate your mentor</p>
                <p className="text-xs text-[#848e9c] mb-3">
                  Rate based on guidance quality, availability, and honesty.
                </p>

                <div className="flex justify-center gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setSelectedRating(star)} className="p-0.5">
                      <Star
                        className={`w-6 h-6 ${
                          star <= selectedRating
                            ? 'text-[#f0b90b] fill-[#f0b90b]'
                            : 'text-[#e5e7eb]'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {selectedRating > 0 && (
                  <p className="text-center text-xs text-[#848e9c] mb-3">
                    {ratingMeaning[selectedRating]}
                  </p>
                )}

                <button
                  onClick={handleReviewSubmit}
                  disabled={!selectedRating || submitting}
                  className={`w-full h-11 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
                    selectedRating
                      ? 'bg-[#f0b90b] text-[#0b0e11] active:opacity-90'
                      : 'bg-[#f5f5f5] text-[#c1c7cd] cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit review'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-[#fffbeb] rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="text-[#f0b90b] w-6 h-6" />
            </div>
            <p className="text-[#1e2329] font-medium text-sm mb-1">No Mentor Available</p>
            <p className="text-[13px] text-[#848e9c]">Monthly salary not unlocked yet.</p>
          </div>
        )}
      </div>

      {toast.show && (
        <div className="fixed bottom-4 left-4 right-4 flex justify-center z-50">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}>
            <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {toast.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="text-[#1e2329] text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactPage;