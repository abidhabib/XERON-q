import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CalendarDays, Home, LogOut, Mail, Menu, Settings, UserPlus, Users, X } from "lucide-react";
import { UserContext } from "./UserContext/UserContext";

const navItems = [
  { label: "Work", icon: BriefcaseBusiness, path: "/work" },
  { label: "Home", icon: Home, path: "/wallet-page" },
  { label: "Team", icon: Users, path: "/team" },
  { label: "Invite", icon: UserPlus, path: "/ReferralProgram" },
  { label: "Contact", icon: Mail, path: "/contact-us" },
  { label: "M/Salary", icon: CalendarDays, path: "/salaryofMonth" },
  { label: "Settings", icon: Settings, path: "/setting" },
];

const NavBar = () => {
  const [open, setOpen] = useState(false);
  const { logout } = useContext(UserContext);
  const navigate = useNavigate();
  const goTo = (path) => { setOpen(false); navigate(path); };
  const handleLogout = async () => { await logout(); setOpen(false); navigate("/"); };

  return (
    <>
      <div className="relative flex h-10 items-center justify-center">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="absolute left-0 grid h-[39px] w-[39px] place-items-center rounded-xl bg-[#303943] text-[#d7dee7] transition-transform active:scale-95"><Menu size={22} strokeWidth={2.25} /></button>
        <img src="/logo.png" alt="Rovexking" className="h-[47px] w-auto object-contain" />
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default" />
          <section className="relative z-10 min-h-[300px] w-full max-w-md rounded-b-[14px] bg-[#20262d] px-[25px] pb-[25px] pt-[14px] shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
            <div className="relative flex h-10 items-center justify-center">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute left-0 grid h-[39px] w-[39px] place-items-center rounded-xl bg-[#303943] text-[#d7dee7] transition-transform active:scale-95"><X size={22} strokeWidth={2.25} /></button>
              <img src="/logo.png" alt="Rovexking" className="h-[47px] w-auto object-contain" />
            </div>
            <nav className="mt-[59px] grid grid-cols-4 gap-x-6 gap-y-[25px]" aria-label="Account navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return <button key={item.label} type="button" onClick={() => goTo(item.path)} className="flex flex-col items-center gap-1.5"><span className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#303943] text-[#9ca9ba]"><Icon size={19} strokeWidth={2} /></span><span className="text-[10px] font-medium text-[#aeb9c8]">{item.label}</span></button>;
              })}
              <button type="button" onClick={handleLogout} className="flex flex-col items-center gap-1.5"><span className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#5e2024] text-[#ff6570]"><LogOut size={19} strokeWidth={2.2} /></span><span className="text-[10px] font-medium text-[#ff6570]">Logout</span></button>
            </nav>
          </section>
        </div>
      )}
    </>
  );
};

export default NavBar;
