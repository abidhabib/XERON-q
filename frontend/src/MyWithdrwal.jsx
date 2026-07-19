import axios from "axios";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { RemoveTrailingZeros } from "../utils/utils";
import { ClipLoader } from "react-spinners";
import { format, subDays } from "date-fns";
import PaymentReceipt from "./new/PaymentReceipt";

// Lucide Icons
import { CheckCircle, XCircle, Clock, Filter, Calendar, X, ChevronRight } from 'lucide-react';


export const WithdrawalHistory = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  const statusFilters = [
    { id: "all", label: "All Status" },
    { id: "approved", label: "Completed" },
    { id: "pending", label: "Processing" },
    { id: "rejected", label: "Rejected" }
  ];

  const dateRanges = [
    { id: "1d", label: "Today" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "all", label: "All Time" }
  ];

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/withdrawal-requests`,
          { withCredentials: true }
        );
        setWithdrawalRequests(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching withdrawal history:", error);
        setIsLoading(false);
      }
    };
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    if (withdrawalRequests.length === 0) return;

    let filtered = [...withdrawalRequests];

    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.approved === statusFilter);
    }

    if (dateRange !== "all") {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case "1d":
          startDate = subDays(now, 1);
          break;
        case "7d":
          startDate = subDays(now, 7);
          break;
        case "30d":
          startDate = subDays(now, 30);
          break;
        default:
          startDate = subDays(now, 7);
      }

      filtered = filtered.filter(request => {
        const rawDate = request.date ?? request.request_date;
        const requestDate = new Date(rawDate);
        return requestDate >= startDate && requestDate <= now;
      });
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredRequests(filtered);
    setIsFiltered(statusFilter !== "all" || dateRange !== "7d");
  }, [withdrawalRequests, dateRange, statusFilter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd-MM-yyyy");
  };

  const statusData = (status) => {
    switch (status) {
      case "approved":
        return { 
          label: "Completed", 
          color: "text-emerald-600", 
          dot: "bg-emerald-500",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          icon: <CheckCircle size={18} className="text-emerald-500" /> 
        };
      case "pending":
        return { 
          label: "Processing", 
          color: "text-amber-600", 
          dot: "bg-amber-500",
          bg: "bg-amber-50",
          border: "border-amber-200",
          icon: <Clock size={18} className="text-amber-500" /> 
        };
      case "rejected":
        return { 
          label: "Rejected", 
          color: "text-rose-600", 
          dot: "bg-rose-500",
          bg: "bg-rose-50",
          border: "border-rose-200",
          icon: <XCircle size={18} className="text-rose-500" /> 
        };
      default:
        return { 
          label: "Unknown", 
          color: "text-gray-500", 
          dot: "bg-gray-400",
          bg: "bg-gray-50",
          border: "border-gray-200",
          icon: <XCircle size={18} className="text-gray-400" /> 
        };
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setDateRange("7d");
    setShowFilters(false);
  };

  const applyFilters = () => {
    setShowFilters(false);
  };

  const getFilterSummary = () => {
    const dateLabel = dateRanges.find(f => f.id === dateRange)?.label || "";
    if (statusFilter === "all") {
      return dateLabel;
    }
    const statusLabel = statusFilters.find(f => f.id === statusFilter)?.label;
    return `${dateLabel} • ${statusLabel}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20 relative">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#E6E8EB] px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-[#1E2026] text-lg">Withdrawals</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar size={13} className="text-[#707A8A]" />
              <span className="text-xs text-[#707A8A]">
                {getFilterSummary()} • {filteredRequests.length} records
              </span>
            </div>
          </div>

          <button 
            onClick={() => setShowFilters(true)}
            className="relative p-2.5 rounded-lg bg-[#F5F5F5] border border-[#E6E8EB] text-[#1E2026] hover:bg-[#EBECF0] active:scale-95 transition-all"
          >
            <Filter size={18} />
            {isFiltered && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#F0B90B] rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
      </div>

      <div className="px-3 pt-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <ClipLoader color="#F0B90B" size={40} />
            <p className="mt-4 text-[#707A8A] text-sm">Loading transactions...</p>
          </div>
        )}

        {!isLoading && filteredRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-16 h-16 mb-4 text-[#C5C8CE]">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-[#1E2026] font-semibold text-base mb-1">No transactions</h3>
            <p className="text-[#707A8A] text-sm mb-6 max-w-[260px]">
              {isFiltered 
                ? "No transactions match your filters" 
                : "You haven't made any withdrawals yet"}
            </p>

            {isFiltered ? (
              <button
                onClick={resetFilters}
                className="w-full max-w-[220px] px-4 py-3 bg-[#F0B90B] text-[#1E2026] rounded-lg text-sm font-semibold hover:bg-[#E5AC00] active:scale-[0.98] transition-all shadow-sm"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => setShowFilters(true)}
                className="w-full max-w-[220px] px-4 py-3 bg-white border border-[#E6E8EB] text-[#1E2026] rounded-lg text-sm font-semibold hover:bg-[#F5F5F5] active:scale-[0.98] transition-all"
              >
                View Filters
              </button>
            )}
          </div>
        )}

        {!isLoading && filteredRequests.length > 0 && (
          <div className="space-y-2">
            {filteredRequests.map((request, index) => (
              <TransactionCard
                key={`${request.id}-${index}`}
                request={request}
                formatDate={formatDate}
                statusData={statusData}
                setSelectedTransaction={setSelectedTransaction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal - Bottom Sheet */}
      {showFilters && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slideUp">
            <div className="pt-3 flex justify-center">
              <div className="w-10 h-1 bg-[#C5C8CE] rounded-full"></div>
            </div>
            <div className="px-4 pt-5 pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-[#1E2026] text-lg">Filter Transactions</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-[#707A8A] hover:text-[#1E2026] hover:bg-[#F5F5F5] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#1E2026] mb-3">Status</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {statusFilters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-all border ${
                        statusFilter === filter.id
                          ? 'bg-[#F0B90B] text-[#1E2026] border-[#F0B90B] shadow-sm'
                          : 'bg-white text-[#707A8A] border-[#E6E8EB] hover:border-[#C5C8CE] active:bg-[#F5F5F5]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-[#1E2026] mb-3">Time Period</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {dateRanges.map(range => (
                    <button
                      key={range.id}
                      onClick={() => setDateRange(range.id)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-all border ${
                        dateRange === range.id
                          ? 'bg-[#F0B90B] text-[#1E2026] border-[#F0B90B] shadow-sm'
                          : 'bg-white text-[#707A8A] border-[#E6E8EB] hover:border-[#C5C8CE] active:bg-[#F5F5F5]'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-3 bg-white border border-[#E6E8EB] text-[#707A8A] rounded-lg text-sm font-semibold hover:bg-[#F5F5F5] active:scale-[0.98] transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 py-3 bg-[#F0B90B] text-[#1E2026] rounded-lg text-sm font-semibold hover:bg-[#E5AC00] active:scale-[0.98] transition-all shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedTransaction(null)}
          />
          <PaymentReceipt 
            selectedTransaction={selectedTransaction}
            setSelectedTransaction={setSelectedTransaction}
          />
        </div>
      )}
    </div>
  );
};

const TransactionCard = ({ request, formatDate, statusData, setSelectedTransaction }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { label, color, dot, bg, border, icon } = statusData(request.approved);

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl p-3.5 border border-[#E6E8EB] active:scale-[0.995] transition-all shadow-sm hover:shadow-md hover:border-[#D1D5DB] cursor-pointer ${
        inView ? "animate-fadeInUp" : "opacity-0"
      }`}
      onClick={() => setSelectedTransaction(request)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${border} border`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-semibold ${color}`}>
              {label}
            </span>
            <span className="text-sm font-bold text-[#1E2026]">
              ${RemoveTrailingZeros(request.amount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#707A8A]">
                {formatDate(request.date)}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${bg} ${color} ${border} border`}>
                {request.approved}
              </span>
              <ChevronRight size={14} className="text-[#C5C8CE]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WithdrawalHistory;
const styles = `
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);