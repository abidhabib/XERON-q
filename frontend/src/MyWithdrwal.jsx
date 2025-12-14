import axios from "axios";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { RemoveTrailingZeros } from "../utils/utils";
import { ClipLoader } from "react-spinners";
import { format, subDays } from "date-fns";
import PaymentReceipt from "./new/PaymentReceipt";

// Lucide Icons (only what's used)
import { CheckCircle, XCircle, Clock, Filter, Calendar, Cross, CrossIcon, X } from 'lucide-react';
import { CropSquareSharp } from "@mui/icons-material";
import { BiCross } from "react-icons/bi";

export const WithdrwaHistory = () => {
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
        return { label: "Completed", color: "text-emerald-400", dot: "bg-emerald-400", icon: <CheckCircle size={18} className="text-emerald-400" /> };
      case "pending":
        return { label: "Processing", color: "text-[#D4AF37]", dot: "bg-[#D4AF37]", icon: <Clock size={18} className="text-[#D4AF37]" /> };
      case "rejected":
        return { label: "Rejected", color: "text-rose-400", dot: "bg-rose-400", icon: <XCircle size={18} className="text-rose-400" /> };
      default:
        return { label: "Unknown", color: "text-gray-400", dot: "bg-gray-400", icon: <XCircle size={18} className="text-gray-400" /> };
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
<div className="min-h-screen bg-[#111827]  pb-20 relative z-0 ">      {/* Fixed Header */}
      <div className="sticky top-10 z-10  px-4 py-6 mt-">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-white text-lg">Withdrawals</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500">
                {getFilterSummary()} • {filteredRequests.length}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowFilters(true)}
            className="relative p-2 rounded-full bg-[#26303b] text-[#D4AF37]"
          >
            <Filter size={20} />
            {isFiltered && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4AF37] rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      <div className="px-2.5 ">
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <ClipLoader color="#D4AF37" size={40} />
            <p className="mt-4 text-gray-500 text-sm">Loading transactions...</p>
          </div>
        )}

        {!isLoading && filteredRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-20 h-20 mb-4 text-gray-700">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-gray-400 font-medium mb-1">No transactions</h3>
            <p className="text-gray-600 text-sm mb-6 max-w-[250px]">
              {isFiltered 
                ? "No transactions match your filters" 
                : "You haven't made any withdrawals yet"}
            </p>
            
            {isFiltered ? (
              <button
                onClick={resetFilters}
                className="w-full max-w-[200px] px-4 py-3 bg-[#D4AF37] text-gray-900 rounded-xl text-sm font-medium active:bg-[#c69c2e]"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => setShowFilters(true)}
                className="w-full max-w-[200px] px-4 py-3 bg-[#26303b] text-gray-300 rounded-xl text-sm font-medium active:bg-[#36404b]"
              >
                View Filters
              </button>
            )}
          </div>
        )}

        {!isLoading && filteredRequests.length > 0 && (
          <div className="space-y-2.5">
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
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#1c232d] rounded-t-2xl shadow-2xl animate-slideUp border-t border-[#26303b]">
            <div className="pt-3 flex justify-center">
              <div className="w-12 h-1.5 bg-gray-700 rounded-full"></div>
            </div>
            <div className="px-4 pt-6 pb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-white text-lg">Filter Transactions</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {statusFilters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`py-2 rounded-xl text-sm font-medium transition-all ${
                        statusFilter === filter.id
                          ? 'bg-[#D4AF37] text-gray-900'
                          : 'bg-[#26303b] text-gray-300 active:bg-[#36404b]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Time Period</h3>
                <div className="grid grid-cols-2 gap-2">
                  {dateRanges.map(range => (
                    <button
                      key={range.id}
                      onClick={() => setDateRange(range.id)}
                      className={`py-2 rounded-xl text-sm font-medium transition-all ${
                        dateRange === range.id
                          ? 'bg-[#D4AF37] text-gray-900'
                          : 'bg-[#26303b] text-gray-300 active:bg-[#36404b]'
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
                  className="flex-1 py-2 bg-rose-900/50 text-rose-300 rounded-xl text-sm font-medium active:bg-rose-800/50"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 py-2 bg-[#D4AF37] text-gray-900 rounded-xl text-sm font-medium active:bg-[#c69c2e]"
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
            className="absolute inset-0 bg-black/50"
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
  const { label, color, dot, icon } = statusData(request.approved);

  return (
    <div
      ref={ref}
      className={`bg-[#1c232d] rounded-xl p-3 active:scale-[0.998] transition-all ${
        inView ? "animate-fadeInUp" : "opacity-0"
      }`}
      onClick={() => setSelectedTransaction(request)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#26303b]">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${color}`}>
              {label}
            </span>
            <span className="text-sm font-semibold text-white">
              ${RemoveTrailingZeros(request.amount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatDate(request.date)}
              </span>
              <span className={`w-2 h-2 rounded-full ${dot}`}></span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-[#26303b] ${color}`}>
              {request.approved}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = `
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slideUp { animation: slideUp 0.3s ease-out; }
.animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);