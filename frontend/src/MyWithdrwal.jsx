import axios from "axios";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { RemoveTrailingZeros } from "../utils/utils";
import { format, subDays } from "date-fns";
import PaymentReceipt from "./new/PaymentReceipt";
import NavBar from "./NavBar";
import { CheckCircle, XCircle, Clock, ChevronRight, ArrowDownToLine } from "lucide-react";

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
      return { label: "Completed", bar: "bg-[#8FC7A0]", tile: "bg-[#1E2A22]", icon: "text-[#8FC7A0]", pill: "bg-[#8FC7A0]/12 text-[#8FC7A0]", glyph: <CheckCircle size={16} strokeWidth={2} /> };
    case "pending":
      return { label: "Processing", bar: "bg-[#C6A15B]", tile: "bg-[#C6A15B]/10", icon: "text-[#C6A15B]", pill: "bg-[#C6A15B]/12 text-[#C6A15B]", glyph: <Clock size={16} strokeWidth={2} /> };
    case "rejected":
      return { label: "Rejected", bar: "bg-[#E2A896]", tile: "bg-[#241619]", icon: "text-[#E2A896]", pill: "bg-[#E2A896]/12 text-[#E2A896]", glyph: <XCircle size={16} strokeWidth={2} /> };
    default:
      return { label: "Unknown", bar: "bg-[#6F6F76]", tile: "bg-[#212125]", icon: "text-[#A0A0A6]", pill: "bg-[#212125] text-[#A0A0A6]", glyph: <XCircle size={16} strokeWidth={2} /> };
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
      className={`relative flex items-center gap-3 w-full text-left p-3.5 pl-4 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] hover:ring-[#C6A15B]/15 active:scale-[0.995] transition-all overflow-hidden ${
        inView ? "card-in" : "opacity-0"
      }`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${s.bar}`} />
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.tile} ${s.icon}`}>{s.glyph}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="fi text-[13.5px] font-semibold text-[#EDEDEE] truncate">Withdrawal</p>
          <span className={`fi text-[9.5px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${s.pill}`}>{s.label}</span>
        </div>
        <p className="fi tnum text-[11px] text-[#6F6F76] mt-0.5">{formatDate(request.date ?? request.request_date)}</p>
      </div>
      <p className="tnum text-[14px] font-semibold text-[#EDEDEE] flex-shrink-0">−${RemoveTrailingZeros(request.amount)}</p>
      <ChevronRight size={16} className="text-[#6F6F76] flex-shrink-0" />
    </button>
  );
};

/* ── Skeleton ── */
const SkeletonCard = () => (
  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04]">
    <div className="w-9 h-9 rounded-lg bg-[#212125] animate-pulse flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-1/3 rounded bg-[#212125] animate-pulse" />
      <div className="h-2 w-1/4 rounded bg-[#212125] animate-pulse" />
    </div>
    <div className="h-3.5 w-14 rounded bg-[#212125] animate-pulse flex-shrink-0" />
  </div>
);

export const WithdrawalHistory = () => {
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

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        .tnum { font-variant-numeric: tabular-nums; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .card-in { animation: cardIn 0.4s ease-out both; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[300px] pb-28 lg:pb-12">
        <div className="relative max-w-2xl mx-auto px-3 sm:px-6 pt-3 lg:pt-10">

          <div className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{ background: "radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)" }} />

          {/* Header + total */}
          <div className="rise relative flex items-end justify-between gap-4">
            <div>
              <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] leading-tight">Withdrawals</h1>
              <p className="fi text-[13px] text-[#A0A0A6] mt-0.5">
                {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"}
              </p>
            </div>
            {!isLoading && total > 0 && (
              <div className="text-right flex-shrink-0">
                <p className="tnum text-[20px] font-semibold text-[#C6A15B] leading-none">${RemoveTrailingZeros(total)}</p>
                <p className="fi text-[9px] font-medium uppercase tracking-[0.14em] text-[#6F6F76] mt-1.5">Total</p>
              </div>
            )}
          </div>

          {/* Inline filters */}
          <div className="rise relative mt-4" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
              {statusFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`fi flex-shrink-0 h-8 px-3.5 rounded-full text-[12px] font-medium transition-all ${
                    statusFilter === f.id
                      ? "bg-[#C6A15B] text-[#161618]"
                      : "bg-[#1B1B1E] text-[#A0A0A6] ring-1 ring-white/[0.05] hover:text-[#EDEDEE]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center bg-[#1B1B1E] rounded-lg p-0.5 ring-1 ring-white/[0.05] mt-3">
              {dateRanges.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setDateRange(r.id)}
                  className={`fi h-7 px-3 rounded-md text-[11px] font-medium transition-all ${
                    dateRange === r.id ? "bg-[#C6A15B]/15 text-[#C6A15B]" : "text-[#6F6F76] hover:text-[#A0A0A6]"
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
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#212125] flex items-center justify-center text-[#C6A15B] mb-3.5">
                <ArrowDownToLine size={22} strokeWidth={1.8} />
              </div>
              <h3 className="fi text-[14.5px] font-semibold text-[#EDEDEE]">
                {isFiltered ? "No matching withdrawals" : "No withdrawals yet"}
              </h3>
              <p className="fi text-[12.5px] text-[#A0A0A6] mt-1 max-w-[230px] mx-auto leading-relaxed">
                {isFiltered ? "Try adjusting your filters." : "Your withdrawal requests will appear here."}
              </p>
              {isFiltered && (
                <button onClick={resetFilters} className="fi mt-5 h-10 px-5 rounded-xl bg-[#C6A15B] text-[#161618] text-[13px] font-semibold hover:bg-[#D8BA7C] transition-colors">
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