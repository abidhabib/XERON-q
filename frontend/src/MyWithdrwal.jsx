import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { RemoveTrailingZeros } from "../utils/utils";
import { format, subDays } from "date-fns";
import PaymentReceipt from "./new/PaymentReceipt";
import NavBar from "./NavBar";
import { CheckCircle, XCircle, Clock, ChevronRight, ArrowDownToLine, ArrowUpRight, Bell, CalendarDays, ShieldCheck, Users } from "lucide-react";
import { UserContext } from "./UserContext/UserContext";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "approved", label: "Completed" },
  { id: "pending", label: "Processing" },
  { id: "rejected", label: "Rejected" },
];

const dateRanges = [
  { id: "1d", label: "Today" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "all", label: "All" },
];

const statusData = (status) => {
  switch (status) {
    case "approved":
      return { label: "Completed", bar: "bg-[#2f9d69]", tile: "bg-[#e9f7ef]", icon: "text-[#2f9d69]", pill: "bg-[#e9f7ef] text-[#258356]", glyph: <CheckCircle size={16} strokeWidth={2} /> };
    case "pending":
      return { label: "Processing", bar: "bg-[#d6a800]", tile: "bg-[#fff8df]", icon: "text-[#c39400]", pill: "bg-[#fff8df] text-[#a87f00]", glyph: <Clock size={16} strokeWidth={2} /> };
    case "rejected":
      return { label: "Rejected", bar: "bg-[#d7515b]", tile: "bg-[#fff0f1]", icon: "text-[#d7515b]", pill: "bg-[#fff0f1] text-[#bd3f4a]", glyph: <XCircle size={16} strokeWidth={2} /> };
    default:
      return { label: "Unknown", bar: "bg-[#91a0b2]", tile: "bg-[#f0f3f6]", icon: "text-[#718195]", pill: "bg-[#f0f3f6] text-[#718195]", glyph: <XCircle size={16} strokeWidth={2} /> };
  }
};

const formatDate = (dateString) => format(new Date(dateString), "dd MMM yyyy");

/* ── Transaction row ── */
const TransactionCard = ({ request, setSelectedTransaction }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const s = statusData(request.approved);
  return (
    <button
      ref={ref}
      onClick={() => setSelectedTransaction(request)}
      className={`relative flex min-h-[72px] items-center gap-3 w-full text-left p-3.5 pl-4 rounded-xl bg-white shadow-[0_2px_5px_rgba(27,38,49,0.08)] ring-1 ring-black/[0.02] active:scale-[0.995] transition-all overflow-hidden ${
        inView ? "card-in" : "opacity-0"
      }`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${s.bar}`} />
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.tile} ${s.icon}`}>{s.glyph}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="fi text-[13.5px] font-semibold text-[#17212b] truncate">Withdrawal</p>
          <span className={`fi text-[9.5px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${s.pill}`}>{s.label}</span>
        </div>
        <p className="fi tnum text-[11px] text-[#7f91a7] mt-0.5">{formatDate(request.date ?? request.request_date)}</p>
      </div>
      <p className="tnum text-[14px] font-semibold text-[#17212b] flex-shrink-0">−${RemoveTrailingZeros(request.amount)}</p>
      <ChevronRight size={16} className="text-[#b3bdc9] flex-shrink-0" />
    </button>
  );
};
TransactionCard.propTypes = { request: () => null, setSelectedTransaction: () => null };

/* ── Skeleton ── */
const SkeletonCard = () => (
  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white shadow-[0_2px_5px_rgba(27,38,49,0.08)]">
    <div className="w-9 h-9 rounded-lg bg-[#edf1f5] animate-pulse flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-1/3 rounded bg-[#edf1f5] animate-pulse" />
      <div className="h-2 w-1/4 rounded bg-[#edf1f5] animate-pulse" />
    </div>
    <div className="h-3.5 w-14 rounded bg-[#edf1f5] animate-pulse flex-shrink-0" />
  </div>
);

export const WithdrawalHistory = () => {
  const { NewName, currBalance, total_withdrawal, backend_wallet } = useContext(UserContext);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/withdrawal-requests`, { withCredentials: true });
        setWithdrawalRequests(response.data);
      } catch (error) {
        console.error("Error fetching withdrawal history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    if (withdrawalRequests.length === 0) {
      setFilteredRequests([]);
      return;
    }
    let filtered = [...withdrawalRequests];
    if (statusFilter !== "all") filtered = filtered.filter((r) => r.approved === statusFilter);
    if (dateRange !== "all") {
      const now = new Date();
      const days = dateRange === "1d" ? 1 : dateRange === "7d" ? 7 : 30;
      const startDate = subDays(now, days);
      filtered = filtered.filter((r) => {
        const d = new Date(r.date ?? r.request_date);
        return d >= startDate && d <= now;
      });
    }
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredRequests(filtered);
  }, [withdrawalRequests, dateRange, statusFilter]);

  const isFiltered = statusFilter !== "all" || dateRange !== "all";
  const resetFilters = () => {
    setStatusFilter("all");
    setDateRange("all");
  };
  const total = filteredRequests.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const progress = backend_wallet ? Math.min(Math.round((Number(backend_wallet) / 3) * 100), 100) : 0;
  const available = Number(currBalance || 0).toFixed(1).replace(/\.0$/, "");
  const cashout = Number(total_withdrawal || 0).toFixed(1).replace(/\.0$/, "");

  return (
    <div className="min-h-dvh bg-[#f5f5f4]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .card-in { animation: cardIn 0.4s ease-out both; }
      `}</style>

      <div className="mx-auto min-h-dvh max-w-md overflow-hidden bg-[#f5f5f4]">
        <header className="min-h-[300px] rounded-b-[14px] bg-[#20262d] px-[25px] pt-[14px] shadow-[0_8px_20px_rgba(22,28,35,0.16)]">
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
            {[["Cashout", ArrowUpRight, "/cashout"], ["Salary", CalendarDays, "/salaryofMonth"], ["Team", Users, "/team"], ["Alert", Bell, "/alerts"]].map(([label, Icon, path]) => { const isCashout = label === "Cashout"; return <button key={label} type="button" onClick={() => { window.location.href = path; }} className={`flex min-w-0 flex-col items-center gap-1.5 ${isCashout ? "text-[#79e4c6]" : "text-[#93a1b3]"}`}><span className={`grid h-[42px] w-[42px] place-items-center rounded-xl transition-all active:scale-95 ${isCashout ? "bg-gradient-to-br from-[#20b889] to-[#07836a] text-white ring-1 ring-[#78e5c7]/60 shadow-[0_8px_20px_rgba(16,163,127,0.38)]" : "bg-[#303943]"}`}><Icon size={19} strokeWidth={isCashout ? 2.4 : 2} /></span><span className="text-[10px] font-semibold">{label}</span></button>; })}
          </div>
        </header>
      <main className="pb-8">
        <div className="relative mx-auto max-w-md px-4 pt-3">

          {/* Header + total */}
          <div className="rise relative flex items-end justify-between gap-4">
            <div>
              <h1 className="fi text-[20px] font-semibold text-[#17212b] leading-tight">Withdrawals</h1>
              <p className="fi text-[13px] text-[#7f91a7] mt-1">
                {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"}
              </p>
            </div>
            {!isLoading && total > 0 && (
              <div className="text-right flex-shrink-0">
                <p className="tnum text-[20px] font-semibold text-[#b58e00] leading-none">${RemoveTrailingZeros(total)}</p>
                <p className="fi text-[9px] font-medium uppercase tracking-[0.14em] text-[#7f91a7] mt-1.5">Total</p>
              </div>
            )}
          </div>

          {/* Inline filters */}
          <div className="rise relative mt-4" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {statusFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`fi flex-shrink-0 h-8 px-3.5 rounded-full text-[12px] font-medium transition-all ${
                    statusFilter === f.id
                      ? "bg-[#d6a800] text-[#20262d]"
                      : "bg-white text-[#64758a] shadow-[0_1px_3px_rgba(27,38,49,0.08)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center bg-white rounded-lg p-0.5 shadow-[0_1px_3px_rgba(27,38,49,0.08)] mt-3">
              {dateRanges.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setDateRange(r.id)}
                  className={`fi h-7 px-3 rounded-md text-[11px] font-medium transition-all ${
                    dateRange === r.id ? "bg-[#fff8df] text-[#a87f00]" : "text-[#7f91a7]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="relative flex flex-col gap-2 mt-4">
              {[0, 1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rise relative mt-10 text-center py-12 px-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#fff8df] flex items-center justify-center text-[#c39400] mb-3.5">
                <ArrowDownToLine size={22} strokeWidth={1.8} />
              </div>
              <h3 className="fi text-[14.5px] font-semibold text-[#17212b]">
                {isFiltered ? "No matching withdrawals" : "No withdrawals yet"}
              </h3>
              <p className="fi text-[12.5px] text-[#7f91a7] mt-1 max-w-[230px] mx-auto leading-relaxed">
                {isFiltered ? "Try adjusting your filters." : "Your withdrawal requests will appear here."}
              </p>
              {isFiltered && (
                <button onClick={resetFilters} className="fi mt-5 h-10 px-5 rounded-xl bg-[#d6a800] text-[#20262d] text-[13px] font-semibold transition-colors">
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="relative flex flex-col gap-2 mt-4">
              {filteredRequests.map((request, index) => (
                <TransactionCard key={`${request.id}-${index}`} request={request} setSelectedTransaction={setSelectedTransaction} />
              ))}
            </div>
          )}
        </div>
      </main>
      </div>

      {/* Receipt */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTransaction(null)} />
          <PaymentReceipt selectedTransaction={selectedTransaction} setSelectedTransaction={setSelectedTransaction} />
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistory;
