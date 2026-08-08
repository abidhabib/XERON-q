import React, { useState, useEffect, useContext } from 'react';
import { Star, BadgeCheck, AlertTriangle, Phone, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import { UserContext } from './UserContext/UserContext';
import NavBar from './NavBar';

const ratingMeaning = {
  1: 'Very poor guidance',
  2: 'Needs improvement',
  3: 'Average / acceptable',
  4: 'Good mentor',
  5: 'Excellent guidance',
};

const WHATSAPP_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

const SectionLabel = ({ children, className = '' }) => (
  <p className={`fd text-[18px] font-semibold uppercase tracking-[0.16em] text-white ${className}`}>{children}</p>
);

/* ── Star row (display) ── */
const Stars = ({ value, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        strokeWidth={1.5}
        className={s <= Math.round(value || 0) ? 'text-[#C6A15B] fill-[#C6A15B]' : 'text-[#3A3A40]'}
      />
    ))}
  </div>
);

const ContactPage = () => {
  const { Userid } = useContext(UserContext);
  const [contactInfo, setContactInfo] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
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
setParentId(res.data.contact?.id ?? null);
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
      const res = await axios.post(`${API}/api/review`, 
          {
    parentId: contactInfo.id,
    rating: selectedRating,
  },
        { withCredentials: true });
      if (res.data.success) {
        showToast('Review submitted', 'success');
        setContactInfo((prev) => ({ ...prev, average_rating: res.data.average_rating }));
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
  const initials = contactInfo
    ? (contactInfo.name || 'M').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'M';
  const avg = contactInfo ? parseFloat(contactInfo.average_rating) || 0 : 0;
  const activeRating = hoverRating || selectedRating;

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[300px] pb-28 lg:pb-12">
        <div className="relative max-w-2xl mx-auto px-3 sm:px-6 pt-3 lg:pt-10">

          <div className="pointer-events-none absolute inset-x-0 top-0 h-64"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }} />

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-7 h-7 border-2 border-[#2E2E33] border-t-[#C6A15B] rounded-full animate-spin" />
            </div>
          ) : contactInfo ? (
            <>
              {/* Profile hero */}
              <div className="rise relative">
                <SectionLabel>Your mentor</SectionLabel>
                <div className="flex items-center gap-4 mt-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-[#C6A15B]/[0.12] ring-1 ring-[#C6A15B]/20 flex items-center justify-center text-[#C6A15B] text-[21px] font-semibold">
                      {initials}
                    </div>
                    {isVerified && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#161618] flex items-center justify-center">
                        <BadgeCheck size={18} className="text-[#C6A15B]" strokeWidth={2} />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="fd text-[24px] sm:text-[26px] font-medium text-[#EDEDEE] leading-tight truncate">
                      {contactInfo.name}
                    </h1>
                    <p className="fi text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C6A15B] mt-1">
                      {isVerified ? 'Verified mentor' : 'Mentor'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating moment */}
              <div className="rise relative flex items-center gap-5 mt-6" style={{ animationDelay: '0.06s' }}>
                <div className="flex items-end gap-1">
                  <span className="tnum text-[42px] font-semibold text-[#C6A15B] leading-[0.8]">
                    {avg > 0 ? avg.toFixed(1) : '—'}
                  </span>
                  <span className="fi text-[13px] text-[#6F6F76] mb-1">/ 5</span>
                </div>
                <div className="pb-0.5">
                  <Stars value={avg} size={15} />
                  <p className="fi text-[11px] text-[#A0A0A6] mt-1.5">
                    {userRating > 0 ? (
                      <>You rated <span className="tnum font-semibold text-[#C6A15B]">{userRating}/5</span></>
                    ) : avg > 0 ? (
                      'Community rating'
                    ) : (
                      'No reviews yet'
                    )}
                  </p>
                </div>
              </div>

              {/* About — editorial quote */}
              <div className="rise relative mt-7 pl-4" style={{ animationDelay: '0.1s' }}>
                <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-[#C6A15B]/40" />
                <SectionLabel>About</SectionLabel>
                <p className="fi text-[13.5px] text-[#A0A0A6] leading-relaxed mt-2">
                  {contactInfo.mentor_description ||
                    'This mentor provides guidance, onboarding help, and support related to your account growth and salary eligibility.'}
                </p>
              </div>

              {/* Contact */}
              <div className="relative mt-7">
                <SectionLabel>Get in touch</SectionLabel>
                <div className="flex flex-col gap-0.5 mt-3">
                  <a
                    href={`https://wa.me/${contactInfo.whatsapp_country_code.replace('+', '')}${contactInfo.whatsapp_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rise group flex items-center gap-3 rounded-lg px-2 py-3 -mx-2 hover:bg-[#1B1B1E] transition-colors"
                    style={{ animationDelay: '0.14s' }}
                  >
                    <span className="w-10 h-10 rounded-lg bg-[#1E2A22] text-[#7FD8A0] flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={WHATSAPP_PATH} /></svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="fi text-[11px] text-[#6F6F76]">WhatsApp</p>
                      <p className="fi tnum text-[14px] font-semibold text-[#EDEDEE] truncate mt-0.5">
                        {formatPhone(contactInfo.whatsapp_number, contactInfo.whatsapp_country_code)}
                      </p>
                    </div>
                    <span className="fi flex items-center gap-1 text-[12px] font-semibold text-[#7FD8A0] group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                      Message <ArrowUpRight size={13} />
                    </span>
                  </a>

                  {contactInfo.phone_number && (
                    <div className="rise group flex items-center gap-3 rounded-lg px-2 py-3 -mx-2 hover:bg-[#1B1B1E] transition-colors" style={{ animationDelay: '0.18s' }}>
                      <span className="w-10 h-10 rounded-lg bg-[#212125] text-[#A0A0A6] flex items-center justify-center flex-shrink-0">
                        <Phone size={17} strokeWidth={2} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="fi text-[11px] text-[#6F6F76]">Phone</p>
                        <p className="fi tnum text-[14px] font-semibold text-[#EDEDEE] truncate mt-0.5">
                          {formatPhone(contactInfo.phone_number, contactInfo.phone_country_code)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Review */}
{canReview && contactInfo?.id && (
                  <div className="relative mt-8">
                  <SectionLabel>Rate your mentor</SectionLabel>
                  <p className="fi text-[12px] text-[#A0A0A6] mt-1.5">Based on guidance, availability, and honesty.</p>

                  <div className="flex items-center justify-center gap-2 mt-5" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="p-1 transition-transform duration-150 hover:scale-110 active:scale-95"
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={30}
                          strokeWidth={1.5}
                          className={`transition-colors duration-150 ${
                            star <= activeRating
                              ? 'text-[#C6A15B] fill-[#C6A15B] drop-shadow-[0_0_7px_rgba(198,161,91,0.35)]'
                              : 'text-[#3A3A40]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <p className={`fi text-center text-[12.5px] mt-3 h-4 transition-colors ${activeRating ? 'text-[#C6A15B]' : 'text-[#6F6F76]'}`}>
                    {activeRating ? ratingMeaning[activeRating] : 'Tap a star to rate'}
                  </p>

                  <button
                    onClick={handleReviewSubmit}
                    disabled={!selectedRating || submitting}
                    className={`fi w-full h-11 rounded-xl mt-4 text-[13.5px] font-semibold transition-all duration-200 ${
                      selectedRating && !submitting
                        ? 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] shadow-[0_10px_28px_rgba(198,161,91,0.14)] active:scale-[0.99]'
                        : 'bg-[#212125] text-[#57575D] cursor-not-allowed'
                    }`}
                  >
                    {submitting ? 'Submitting…' : 'Submit review'}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="rise relative mt-10 text-center py-12 px-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#212125] flex items-center justify-center text-[#C6A15B] mb-3.5">
                <AlertTriangle size={22} strokeWidth={1.8} />
              </div>
              <h3 className="fi text-[14.5px] font-semibold text-[#EDEDEE]">No mentor available</h3>
              <p className="fi text-[12.5px] text-[#A0A0A6] mt-1 max-w-[220px] mx-auto leading-relaxed">
                Your monthly salary isn't unlocked yet.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ring-1 shadow-[0_12px_32px_rgba(0,0,0,0.4)] ${
            toast.type === 'success' ? 'bg-[#1E2A22] ring-[#8FC7A0]/20' : 'bg-[#241619] ring-[#E2A896]/20'
          }`}>
            <span className={`w-5 h-5 flex items-center justify-center rounded-md text-[11px] font-bold ${
              toast.type === 'success' ? 'bg-[#8FC7A0]/15 text-[#8FC7A0]' : 'bg-[#E2A896]/15 text-[#E2A896]'
            }`}>
              {toast.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="fi text-[13px] text-[#EDEDEE] font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactPage;