import axios from "axios";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import Lottie from "react-lottie-player";
import checkmarkAnimation from "./checkmark.json";
import RejectAnimation from "./reject.json";
import pendingAnimation from "./pendingAnimation.json";
import { GoEye, GoEyeClosed } from "react-icons/go";
import { RxCross2 } from "react-icons/rx";
import { RemoveTrailingZeros } from "../utils/utils";
import { ClipLoader } from "react-spinners";
import { IoCheckmarkOutline } from "react-icons/io5";
import { PiArrowsClockwiseLight, PiCalendarBlank, PiFunnelSimple } from "react-icons/pi";
import { format, subDays, isWithinInterval } from "date-fns";

export const WithdrwaHistory = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [hideNumber, setHideNumber] = useState(
    JSON.parse(localStorage.getItem("hideNumber")) || false
  );
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7d");
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
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.approved === statusFilter);
    }
    
    // Date range filter
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy, hh:mm a");
  };

  const statusData = (status) => {
    switch (status) {
      case "approved":
        return { label: "Completed", color: "bg-green-500", iconColor: "text-white" };
      case "pending":
        return { label: "Processing", color: "bg-yellow-500", iconColor: "text-white" };
      case "rejected":
        return { label: "Rejected", color: "bg-red-500", iconColor: "text-white" };
      default:
        return { label: "Unknown", color: "bg-gray-400", iconColor: "text-white" };
    }
  };

  const toggleHideNumber = () => {
    const newState = !hideNumber;
    setHideNumber(newState);
    localStorage.setItem("hideNumber", JSON.stringify(newState));
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-800 text-lg">Withdrawals</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <PiCalendarBlank className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">
                {getFilterSummary()} • {filteredRequests.length}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowFilters(true)}
            className="relative p-2 rounded-full bg-indigo-50 text-indigo-600"
          >
            <PiFunnelSimple className="w-5 h-5" />
            {isFiltered && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      <div className="px-2.5 pt-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <ClipLoader color="#6366f1" size={40} />
            <p className="mt-4 text-gray-500 text-sm">Loading transactions...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-20 h-20 mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-gray-600 font-medium mb-1">No transactions</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-[250px]">
              {isFiltered 
                ? "No transactions match your filters" 
                : "You haven't made any withdrawals yet"}
            </p>
            
            {isFiltered ? (
              <button
                onClick={resetFilters}
                className="w-full max-w-[200px] px-4 py-3 bg-indigo-500 text-white rounded-xl text-sm font-medium active:bg-indigo-600"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => setShowFilters(true)}
                className="w-full max-w-[200px] px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium active:bg-gray-200"
              >
                View Filters
              </button>
            )}
          </div>
        )}

        {/* Transaction List */}
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

      {/* Filter Modal - Bottom Sheet for Mobile */}
      {showFilters && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          
          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slideUp">
            {/* Drag Handle */}
            <div className="pt-3 flex justify-center">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="px-4 pt-6 pb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-800 text-lg">Filter Transactions</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-gray-500"
                >
                  <RxCross2 className="w-5 h-5" />
                </button>
              </div>
              
              {/* Status Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {statusFilters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`py-2 rounded-xl text-sm font-sm transition-all ${
                        statusFilter === filter.id
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Time Period</h3>
                <div className="grid grid-cols-2 gap-2">
                  {dateRanges.map(range => (
                    <button
                      key={range.id}
                      onClick={() => setDateRange(range.id)}
                      className={`py-2 rounded-xl text-sm font-medium transition-all ${
                        dateRange === range.id
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-2 bg-red-100 text-white-700 rounded-xl text-sm font-medium active:bg-gray-200"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium active:bg-indigo-600"
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
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedTransaction(null)}
          />
          
          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <div className="px-5 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800 text-lg">Transaction Details</h2>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="p-2 text-gray-500"
                  >
                    <RxCross2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-3 pb-8">
              {/* Status Icon */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 mb-4">
                  <Lottie
                    loop={false}
                    play={true}
                    animationData={selectedTransaction.approved === "approved" 
                      ? checkmarkAnimation 
                      : selectedTransaction.approved === "pending" 
                      ? pendingAnimation 
                      : RejectAnimation}
                    className="w-24 h-24"
                  />
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  selectedTransaction.approved === "approved" 
                    ? "bg-emerald-100 text-emerald-700"
                    : selectedTransaction.approved === "pending" 
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
                }`}>
                  {selectedTransaction.approved === "approved" ? "Completed" : 
                   selectedTransaction.approved === "pending" ? "Processing" : "Rejected"}
                </div>
              </div>

              {/* Details Card */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-4">
                  <DetailRow 
                    label="Transaction ID"
                    value={`${String(selectedTransaction.id).slice(0, 6)}-${String(selectedTransaction.uid)}`}
                    monospace
                  />
                  
                  <div className="h-px bg-gray-200"></div>
                  
                  <DetailRow 
                    label="Date & Time"
                    value={formatDateTime(selectedTransaction.date)}
                  />
                  
                  <DetailRow 
                    label="Amount"
                    value={`$${RemoveTrailingZeros(Number(selectedTransaction.amount))}`}
                    valueClass="text-indigo-600 font-semibold text-lg"
                  />
                  
                  <div className="h-px bg-gray-200"></div>
                  
                  <DetailRow 
                    label="Wallet"
                    value={selectedTransaction.bank_name || "Not specified"}
                  />
                  
                  <SecureDetailRow
                    label="Wallet Address"
                    value={selectedTransaction.account_number}
                    hidden={hideNumber}
                    onToggle={toggleHideNumber}
                    formatValue={v => v.replace(/(.{4})/g, '$1 ').trim()}
                  />
                  
                  <div className="h-px bg-gray-200"></div>
                  
                  <DetailRow 
                    label="Processing Fee"
                    value={`$${RemoveTrailingZeros(Number(selectedTransaction.fee))}`}
                    valueClass="text-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mobile-optimized Transaction Card
const TransactionCard = ({ request, formatDate, statusData, setSelectedTransaction }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { label } = statusData(request.approved);

  const statusColors = {
    approved: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-700',
      lightBg: 'bg-emerald-50',
    },
    pending: {
      bg: 'bg-amber-500',
      text: 'text-amber-700',
      lightBg: 'bg-amber-50',
    },
    rejected: {
      bg: 'bg-rose-500',
      text: 'text-rose-700',
      lightBg: 'bg-rose-50',
    },
  };

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl p-3 shadow-sm active:shadow-md active:scale-[0.998] transition-all ${
        inView ? "animate-fadeInUp" : "opacity-0"
      }`}
      onClick={() => setSelectedTransaction(request)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColors[request.approved].lightBg}`}>
          {request.approved === "approved" ? (
            <IoCheckmarkOutline className={`w-5 h-5 ${statusColors[request.approved].text}`} />
          ) : request.approved === "pending" ? (
            <PiArrowsClockwiseLight className={`w-5 h-5 ${statusColors[request.approved].text}`} />
          ) : (
            <RxCross2 className={`w-5 h-5 ${statusColors[request.approved].text}`} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${statusColors[request.approved].text}`}>
              {label}
            </span>
            <span className="text-sm font-semibold text-gray-800">
              ${RemoveTrailingZeros(request.amount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatDate(request.date)}
              </span>
              <span className={`w-2 h-2 rounded-full ${statusColors[request.approved].bg}`}></span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[request.approved].lightBg} ${statusColors[request.approved].text}`}>
              {request.approved}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized Detail Components
const DetailRow = ({ label, value, monospace = false, valueClass = "" }) => (
  <div className="flex justify-between items-start">
    <span className="text-sm text-gray-500 flex-shrink-0 mr-4">{label}</span>
    <span className={`text-sm text-gray-800 text-right break-all ${monospace ? 'font-mono' : ''} ${valueClass}`}>
      {value}
    </span>
  </div>
);

const SecureDetailRow = ({ label, value, hidden, onToggle, formatValue }) => (
  <div className="flex justify-between items-start">
    <span className="text-sm text-gray-500 flex-shrink-0 mr-4">{label}</span>
    <div className="flex items-center gap-2">
      <span className={`text-sm text-gray-800 font-mono text-right ${hidden ? 'tracking-widest' : ''}`}>
        {hidden 
          ? '•••• •••• •••• ••••' 
          : formatValue ? formatValue(value) : value}
      </span>
      <button
        onClick={onToggle}
        className="p-1 text-indigo-500 active:text-indigo-700 flex-shrink-0"
        aria-label={`${hidden ? 'Reveal' : 'Hide'} ${label}`}
      >
        {hidden ? (
          <GoEyeClosed className="w-4 h-4" />
        ) : (
          <GoEye className="w-4 h-4" />
        )}
      </button>
    </div>
  </div>
);

// Add mobile-specific animations
const styles = `
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideUp {
  animation: slideUp 0.3s ease-out;
}

.animate-fadeInUp {
  animation: fadeInUp 0.4s ease-out forwards;
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);