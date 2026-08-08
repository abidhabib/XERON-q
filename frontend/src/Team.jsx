import React, { useContext, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from './UserContext/UserContext';
import NavBar from './NavBar';
import { Users, Calendar, Crown, UserPlus, ArrowUpRight } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const memberProgress = (m) => Math.min(parseFloat(m.backend_wallet || 0) * 100, 100);

/* ── Count-up number ── */
const CountUp = ({ value, duration = 900 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className="tnum">{display.toLocaleString()}</span>;
};

/* ── Progress ring (shared by hero + tiles + mini gauge) ── */
const Ring = ({ value, size, stroke, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = c - (Math.min(value, 100) / 100) * c;
  const [off, setOff] = useState(c);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOff(target));
    return () => cancelAnimationFrame(raf);
  }, [target, c]);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#232327" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#C6A15B" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

/* ── Ledger row: the one repeating structural unit — no card, just a hairline row ── */
const LedgerRow = ({ member, rank, isTop }) => {
  const progress = memberProgress(member);
  const initial = (member.name || 'U').charAt(0).toUpperCase();
  const first = (member.name || 'Member').split(' ')[0];

  return (
    <div
      className={`rise relative flex items-center gap-3 py-3.5 ${isTop ? 'pl-4 pr-3' : 'pl-4 pr-1'}`}
      style={{ animationDelay: `${Math.min(rank, 16) * 0.03}s` }}
    >
      {/* gold thread — the signature element, replaces boxed containers entirely */}
      <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${isTop ? 'bg-[#C6A15B]' : 'bg-[#232327]'}`} />

      <Ring value={progress} size={isTop ? 46 : 36} stroke={isTop ? 3 : 2.25}>
        <div
          className="rounded-full bg-[#1B1B1F] flex items-center justify-center font-semibold text-[#EDEDEE] fi"
          style={{ width: isTop ? 34 : 26, height: isTop ? 34 : 26, fontSize: isTop ? 14 : 11 }}
        >
          {initial}
        </div>
      </Ring>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isTop && <Crown size={12} strokeWidth={2} className="text-[#C6A15B] flex-shrink-0" />}
          <h3 className={`fi font-semibold text-[#F2F2F5] truncate leading-tight ${isTop ? 'text-[15.5px]' : 'text-[13.5px]'}`}>
            {member.name}
          </h3>
        </div>
        <div className="fi flex items-center gap-2.5 mt-1 text-[11px] text-[#5A5A65]">
          <span className="flex items-center gap-1">
            <Users size={10} strokeWidth={1.5} />
            <span className="tnum font-medium text-[#7A7A85]">{member.team || 0}</span> team
          </span>
          {isTop && (
            <span className="hidden xs:flex items-center gap-1">
              <Calendar size={10} strokeWidth={1.5} /> {formatDate(member.approved_at)}
            </span>
          )}
        </div>
      </div>

      <span className={`tnum font-semibold text-[#C6A15B] flex-shrink-0 ${isTop ? 'text-[17px]' : 'text-[13px]'}`}>
        {progress.toFixed(0)}%
      </span>

      <button
        onClick={() => window.open(`https://wa.me/${member.phoneNumber}`, '_blank')}
        aria-label={`Message ${first} on WhatsApp`}
        className={`flex-shrink-0 flex items-center justify-center rounded-full text-[#5A5A65] hover:text-[#7FD8A0] active:scale-90 transition-all duration-150 ${isTop ? 'w-9 h-9 bg-[#18181B] text-[#7FD8A0]' : 'w-8 h-8 hover:bg-[#1B1B1F]'}`}
      >
        <SiWhatsapp size={isTop ? 15 : 14} />
      </button>
    </div>
  );
};

/* ── Skyline sparkline — inline, not boxed ── */
const ProgressSkyline = ({ members }) => {
  const bars = members.slice(0, 20);
  return (
    <div className="flex items-end gap-[2.5px] h-9 mt-4">
      {bars.map((m, i) => {
        const p = memberProgress(m);
        return (
          <div
            key={m.id}
            className="bar-grow flex-1 max-w-[10px] rounded-[2px] bg-[#C6A15B]"
            style={{ height: `${Math.max(p, 6)}%`, opacity: 0.2 + (p / 100) * 0.8, animationDelay: `${i * 0.025}s` }}
          />
        );
      })}
    </div>
  );
};

/* ── Skeletons ── */
const SkeletonRow = ({ isTop }) => (
  <div className="flex items-center gap-3 py-3.5 pl-4 pr-1">
    <div className="rounded-full bg-[#1B1B1F] animate-pulse flex-shrink-0" style={{ width: isTop ? 46 : 36, height: isTop ? 46 : 36 }} />
    <div className="flex-1 space-y-2">
      <div className="h-3 rounded-md bg-[#1B1B1F] animate-pulse" style={{ width: isTop ? '55%' : '40%' }} />
      <div className="h-2 w-1/3 rounded-md bg-[#1B1B1F] animate-pulse" />
    </div>
    <div className="w-8 h-8 rounded-full bg-[#1B1B1F] animate-pulse flex-shrink-0" />
  </div>
);

/* ── Empty state — no box, just an invitation ── */
const EmptyState = () => (
  <div className="rise mt-10 text-center py-14 px-6">
    <div className="w-12 h-12 mx-auto rounded-full border border-[#232327] flex items-center justify-center text-[#C6A15B] mb-4">
      <Users size={20} strokeWidth={1.5} />
    </div>
    <h3 className="fi text-[15px] font-semibold text-[#F2F2F5]">No team members yet</h3>
    <p className="fi text-[13px] text-[#6B6B75] mt-1.5 max-w-[220px] mx-auto leading-relaxed">
      Invite people to start building your network.
    </p>
    <Link to="/ReferralProgram"
      className="fi inline-flex items-center gap-1.5 mt-6 text-[13px] font-semibold text-[#C6A15B] hover:text-[#D4B06E] transition-colors duration-200">
      <UserPlus size={14} strokeWidth={2.2} /> Invite members <ArrowUpRight size={13} strokeWidth={2.2} />
    </Link>
  </div>
);

/* ── Page ── */
const Team = () => {
  const { Userid } = useContext(UserContext);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/approvedUserNames/${Userid}`);
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setLoading(false);
      }
    };
    if (Userid) fetchTeamMembers();
  }, [Userid]);

  const ranked = useMemo(
    () => [...teamMembers].sort((a, b) => memberProgress(b) - memberProgress(a)),
    [teamMembers]
  );

  const stats = useMemo(() => {
    const count = teamMembers.length;
    const network = teamMembers.reduce((s, m) => s + (parseInt(m.team) || 0), 0);
    const avg = count ? Math.round(teamMembers.reduce((s, m) => s + memberProgress(m), 0) / count) : 0;
    return { count, network, avg };
  }, [teamMembers]);

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#EDEDEE] antialiased selection:bg-[#C6A15B]/20 selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes growBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .bar-grow { transform-origin: bottom; animation: growBar 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        @media (min-width: 380px) { .xs\\:flex { display: flex; } }
      `}</style>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C6A15B]/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <NavBar />

      <main className="lg:pl-[300px] pb-28 lg:pb-12 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-6 lg:pt-10">

          <div className="rise mb-1 flex items-end justify-between">
            <div>
              <h1 className="fd text-[30px] sm:text-[38px] font-medium text-[#F2F2F5] tracking-tight leading-none">My Team</h1>
              <p className="fi text-[13px] text-[#6B6B75] mt-2 leading-relaxed">The people growing alongside you.</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 divide-y divide-[#1B1B1F]">
              {[0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} isTop={i === 0} />)}
            </div>
          ) : teamMembers.length > 0 ? (
            <>
              {/* Single continuous ledger — stats strip as the header row, no separate box */}
              <div className="rise mt-7 flex items-center justify-between gap-4 pb-5 border-b border-[#1B1B1F]" style={{ animationDelay: '0.02s' }}>
                <div>
                  <p className="fi text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5A5A65]">Network reach</p>
                  <p className="tnum text-[36px] sm:text-[44px] font-semibold text-[#C6A15B] leading-none mt-2 tracking-tight">
                    <CountUp value={stats.network} />
                  </p>
                  <p className="fi text-[12px] text-[#6B6B75] mt-2">
                    <span className="tnum font-semibold text-[#B8B8C0]">{stats.count}</span> direct &middot; avg progress <span className="tnum font-semibold text-[#B8B8C0]">{stats.avg}%</span>
                  </p>
                </div>
                <Ring value={stats.avg} size={50} stroke={3}>
                  <span className="tnum text-[12px] font-semibold text-[#EDEDEE]">{stats.avg}%</span>
                </Ring>
              </div>

              {ranked.length > 0 && <ProgressSkyline members={ranked} />}

              <div className="rise mt-1 divide-y divide-[#1B1B1F]" style={{ animationDelay: '0.06s' }}>
                {ranked.map((m, i) => (
                  <LedgerRow key={m.id} member={m} rank={i} isTop={i === 0} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState />
          )}

        </div>
      </main>
    </div>
  );
};

export default Team;