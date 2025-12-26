import React, { useState, useEffect, useContext } from 'react';
import { Star, Phone, MessageCircle, BadgeCheck, AlertTriangle, Info } from 'lucide-react';
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
  const [isVerified, setIsVerified] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [userRating, setUserRating] = useState(0); // user’s given rating
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const API = import.meta.env.VITE_API_BASE_URL;

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };

  useEffect(() => {
    if (!Userid) return;

    const fetchContactInfo = async () => {
      try {
        const res = await axios.get(`${API}/api/contact-info`, { withCredentials: true });
        if (res.data.success) {
          setContactInfo(res.data.contact);
          setIsVerified(res.data.isVerified);
          setUserRating(res.data.userRating || 0);
          setSelectedRating(res.data.userRating || 0);
          setCanReview(res.data.canReview && !res.data.userRating); // disable if already reviewed
        }
      } catch {
        showToast('Failed to load mentor info');
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, [Userid, API]);

  const handleReviewSubmit = async () => {
    if (!selectedRating || !contactInfo) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API}/api/review`,
        { parentId: contactInfo.id, rating: selectedRating },
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast('Review submitted');
        setContactInfo(prev => ({ ...prev, average_rating: res.data.average_rating }));
        setUserRating(selectedRating);
        setSelectedRating(selectedRating);
        setCanReview(false); // prevent further reviews
      }
    } catch {
      showToast('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPhone = (number, code) => `${code} ${number}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="h-6 w-6 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827]">
      <BalanceCard />

      <div className="p-4 max-w-md mx-auto">
        {isVerified && (
          <div className="mb-3 flex items-center gap-2 bg-emerald-900/20 rounded-lg px-3 py-2">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">
              Verified Mentor
            </span>
          </div>
        )}

        {contactInfo ? (
          <div className="bg-[#19202a] rounded-xl p-4">
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#D4AF37]" />
              </div>

              <div className="flex-1">
                <h2 className="text-white font-semibold text-base">
                  {contactInfo.name}
                </h2>

                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= (contactInfo.average_rating || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-[#D4AF37]/30'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-[#D4AF37]/60 ml-1">
                    {contactInfo.average_rating
                      ? `${contactInfo.average_rating} / 5`
                      : 'No reviews yet'}
                  </span>
                </div>

                {userRating > 0 && (
                  <p className="text- text-[#D4AF37]/50 mt-1">
                    Your Gave: <span className='text-amber-400'>{userRating} / 5</span>
                  </p>
                )}
              </div>
            </div>

            {/* MENTOR DESCRIPTION */}
            <div className="bg-[#1c2a3a] rounded-lg px-4 py-3 mb-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#D4AF37] mt-0.5" />
                <p className="text-sm text-white/90 leading-relaxed">
                  {contactInfo.mentor_description ||
                    'This mentor provides guidance, onboarding help, and support related to your account growth and salary eligibility.'}
                </p>
              </div>
            </div>

            {/* CONTACT INFO */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#1c2a3a] rounded-lg px-4 py-3">
                <div>
                  <p className="text-xs text-[#D4AF37]/60">WhatsApp</p>
                  <p className="text-sm text-white">
                    {formatPhone(
                      contactInfo.whatsapp_number,
                      contactInfo.whatsapp_country_code
                    )}
                  </p>
                </div>

                <a
                  href={`https://wa.me/${contactInfo.whatsapp_country_code.replace(
                    '+',
                    ''
                  )}${contactInfo.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-900/30 text-emerald-400 rounded-md text-sm"
                >
                  Message
                </a>
              </div>

              {contactInfo.phone_number && (
                <div className="flex items-center bg-[#1c2a3a] rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-[#D4AF37]/60">Phone</p>
                    <p className="text-sm text-white">
                      {formatPhone(
                        contactInfo.phone_number,
                        contactInfo.phone_country_code
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* REVIEW */}
            {canReview && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-sm text-white mb-1">Rate mentor</p>
                <p className="text-xs text-[#D4AF37]/60 mb-3">
                  Rate based on guidance quality, availability, and honesty.
                </p>

                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setSelectedRating(star)}>
                      <Star
                        className={`w-5 h-5 ${
                          star <= selectedRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#D4AF37]/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {selectedRating > 0 && (
                  <p className="text-center text-xs text-[#D4AF37]/70 mb-2">
                    {ratingMeaning[selectedRating]}
                  </p>
                )}

                <button
                  onClick={handleReviewSubmit}
                  disabled={!selectedRating || submitting}
                  className="w-full py-2 rounded-lg text-sm font-medium
                    bg-[#1c2a3a] text-[#D4AF37]
                    disabled:opacity-40"
                >
                  {submitting ? 'Submitting...' : 'Submit review'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#19202a] rounded-xl p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400/50 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No Mentor Available</p>
            <p className="text-sm text-[#D4AF37]/60">
              Monthly salary not unlocked yet.
            </p>
          </div>
        )}
      </div>

      {toast.show && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto
          bg-[#c9a030]/30 backdrop-blur rounded-lg p-3 text-center text-white text-sm">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ContactPage;
