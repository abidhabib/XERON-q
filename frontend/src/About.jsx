import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ShieldCheck,
  Users,
} from "lucide-react";
import { UserContext } from "./UserContext/UserContext";
import NavBar from "./NavBar";

const featureCards = [
  { title: "Activity", description: "Track your transactions, interactions, and progress.", path: "/wallet" },
  { title: "Rewards", description: "Earn benefits based on your activities and contributions.", path: "/salaryofMonth" },
  { title: "About", description: "Secure platform for managing your financial progress.", path: "/setting" },
];

const About = () => {
  const { NewName, currBalance, total_withdrawal, backend_wallet } = useContext(UserContext);
  const navigate = useNavigate();
  const progress = backend_wallet ? Math.min(Math.round((Number(backend_wallet) / 3) * 100), 100) : 0;
  const available = Number(currBalance || 0).toFixed(1).replace(/\.0$/, "");
  const cashout = Number(total_withdrawal || 0).toFixed(1).replace(/\.0$/, "");

  return (
    <div className="min-h-dvh bg-[#f5f5f4] text-[#1d2631]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); .about-ui { font-family: 'Inter', sans-serif; }`}</style>

      <div className="about-ui mx-auto min-h-dvh max-w-md overflow-hidden bg-[#f5f5f4] shadow-[0_0_40px_rgba(19,25,32,0.06)]">
        <header className="relative min-h-[300px] overflow-hidden rounded-b-[14px] bg-[#20262d] px-[25px] pt-[14px] shadow-[0_8px_20px_rgba(22,28,35,0.16)]">
          <NavBar />
          <div className="mt-[25px] flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-1.5 truncate text-[15px] font-semibold text-white"><span className="truncate">{NewName || "Member"}</span><ShieldCheck size={17} className="shrink-0 text-[#e3b900]" /></p>
            <span className="shrink-0 rounded-full bg-[#4c4330] px-2.5 py-1 text-[10px] font-semibold text-[#f5c927]">{progress}% Progress</span>
          </div>
          <div className="mt-[18px] grid grid-cols-2">
            <div><p className="text-[27px] font-semibold leading-none tracking-[-0.04em] text-white"><span className="mr-0.5 text-[20px] text-[#dce4ee]">$</span>{available}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[#8191a5]">Available balance</p></div>
            <div className="pt-[8px] text-right"><p className="text-[19px] font-semibold leading-none tracking-[-0.03em] text-[#c7d1dc]"><span className="mr-0.5 text-[14px]">$</span>{cashout}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[#8191a5]">Total cashout</p></div>
          </div>
          <div className="mt-[31px] grid grid-cols-4 gap-5">
            {[
              ["Wallet", BriefcaseBusiness, "/wallet"], ["Salary", CalendarDays, "/salaryofMonth"], ["Team", Users, "/team"], ["Alert", Bell, "/alerts"],
            ].map(([label, Icon, path]) => <button key={label} type="button" onClick={() => navigate(path)} className="flex min-w-0 flex-col items-center gap-1.5 text-[#93a1b3]"><span className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#303943]"><Icon size={19} strokeWidth={2} /></span><span className="text-[10px] font-medium">{label}</span></button>)}
          </div>
        </header>

        <main className="px-4 py-4">
          <div className="space-y-3.5">
            {featureCards.map((item) => {
              return (
                <button key={item.title} type="button" onClick={() => navigate(item.path)} className="block w-full rounded-xl bg-white px-6 py-[20px] text-left shadow-[0_2px_5px_rgba(27,38,49,0.08)] ring-1 ring-black/[0.02] transition-transform active:scale-[0.99]">
                  <span className="block text-[15px] font-semibold text-[#17212b]">{item.title}</span>
                  <span className="mt-2 block text-[13px] leading-[1.7] text-[#7f91a7]">{item.description}</span>
                </button>
              );
            })}
          </div>
        </main>
      </div>

    </div>
  );
};

export default About;
