import { useContext } from "react";
import NavBar from "./NavBar";
import BalanceCard from "./new/BalanceCard";
import { UserContext } from "./UserContext/UserContext";
import { Activity, Gift, ShieldCheck, ArrowUpRight, Lock } from "lucide-react";
import InviteCard from "./new/InviteCard";

/* ── Live "Live" indicator ── */
const LiveDot = () => (
  <span className="flex items-center gap-1 flex-shrink-0">
    <span className="relative flex w-1.5 h-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A15B] opacity-60" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C6A15B]" />
    </span>
    <span className="fi text-[8.5px] font-semibold uppercase tracking-[0.1em] text-[#C6A15B]">Live</span>
  </span>
);

/* ── Animated sparkline ── */
const Sparkline = () => (
  <svg width="64" height="28" viewBox="0 0 64 28" fill="none" className="hidden sm:block flex-shrink-0">
    <path
      className="spark-draw"
      d="M0 23 L10 19 L20 21 L30 13 L40 16 L50 8 L64 4"
      stroke="#C6A15B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Featured Activity row ── */
const ActivityFeature = () => (
  <div
    className="rise group relative flex items-center gap-4 p-4 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] hover:ring-[#C6A15B]/20 transition-all duration-200 overflow-hidden"
    style={{ animationDelay: "0.14s" }}
  >
    <div className="w-11 h-11 rounded-lg bg-[#C6A15B]/10 text-[#C6A15B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C6A15B]/15 transition-colors">
      <Activity size={18} strokeWidth={2} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2.5">
        <h3 className="fi text-[14.5px] font-semibold text-[#EDEDEE] leading-tight">Activity</h3>
      </div>
      <p className="fi text-[12px] text-[#A0A0A6] mt-1 leading-relaxed">
        Track your transactions, interactions, and progress.
      </p>
    </div>
    <Sparkline />
  </div>
);


const About = () => {
  const { NewName } = useContext(UserContext);
  const first = (NewName || "").split(" ")[0];

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes drawLine { to { stroke-dashoffset: 0; } }
        .spark-draw { stroke-dasharray: 90; stroke-dashoffset: 90; animation: drawLine 1.4s ease-out 0.5s forwards; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[300px] pb-28 lg:pb-12">
        <div className="relative max-w-2xl mx-auto px-3 sm:px-6 pt-3 lg:pt-10">

          {/* ambient light behind the opening */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-64"
            style={{ background: "radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)" }}
          />

          {/* Greeting */}
          <div className="rise relative">
            <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] leading-tight">
              {greeting}
              {first ? `, ${first}` : ""}
            </h1>
            <p className="fi text-[12.5px] text-[#A0A0A6] mt-0.5">{dateStr}</p>
          </div>

          {/* Balance hero */}
          <div className="relative mt-4">
            <BalanceCard />
          </div>
          {/* Features — asymmetric 1 + 2 */}
          <div className="relative mt-4">
            <ActivityFeature />
            <InviteCard/>

            
          </div>

         
        </div>
      </main>
    </div>
  );
};

export default About;