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
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export const WithdrwaHistory = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [hideNumber, setHideNumber] = useState(
    JSON.parse(localStorage.getItem("hideNumber")) || false
  );
  const [dateFilter, setDateFilter] = useState("7d"); // Default to 7 days
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  // Date filter options
  const dateFilters = [
    { id: "1d", label: "Last 24 hours" },
    { id: "7d", label: "Last 7 days" },
    { id: "30d", label: "Last 30 days" },
    { id: "mtd", label: "Month to date" },
    { id: "custom", label: "Custom date range" }
  ];

  // Status filter options
  const statusFilters = [
    { id: "all", label: "All Statuses" },
    { id: "approved", label: "Completed" },
    { id: "pending", label: "Processing" },
    { id: "rejected", label: "Rejected" }
  ];
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch withdrawal history
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
console.log(withdrawalRequests);

  // Apply filters whenever data, date filter, status filter or custom dates change
  useEffect(() => {
    if (withdrawalRequests.length === 0) return;
    
    let filtered = [...withdrawalRequests];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.approved === statusFilter);
    }
    
    // Apply date filter
    const now = new Date();
    let startDate, endDate;
    
    switch (dateFilter) {
      case "1d":
        startDate = subDays(now, 1);
        endDate = now;
        break;
      case "7d":
        startDate = subDays(now, 7);
        endDate = now;
        break;
      case "30d":
        startDate = subDays(now, 30);
        endDate = now;
        break;
      case "mtd":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "custom":
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end);
        }
        break;
      default:
        startDate = subDays(now, 7);
        endDate = now;
    }
    
    if (startDate && endDate) {
      filtered = filtered.filter(request => {
        const rawDate = request.date ?? request.request_date; // use date if available, else request_date1
    const requestDate = new Date(rawDate);


        return isWithinInterval(requestDate, { start: startDate, end: endDate });
      });
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setFilteredRequests(filtered);
  }, [withdrawalRequests, dateFilter, statusFilter, customDateRange]);

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

  const handleDateFilterChange = (filterId) => {
    setDateFilter(filterId);
    if (filterId !== "custom") {
      setShowDatePicker(false);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleCustomDateChange = (e, type) => {
    setCustomDateRange(prev => ({
      ...prev,
      [type]: e.target.value
    }));
  };

  const applyCustomDateRange = () => {
    if (customDateRange.start && customDateRange.end) {
      setShowDatePicker(false);
      setDateFilter("custom");
    }
  };

  const resetFilters = () => {
    setDateFilter("7d");
    setStatusFilter("all");
    setCustomDateRange({ start: "", end: "" });
  };

  const getFilterSummary = () => {
    let summary = "";
    
    // Date filter summary
    const dateFilterLabel = dateFilters.find(f => f.id === dateFilter)?.label || "";
    summary += dateFilterLabel;
    
    // Status filter summary
    if (statusFilter !== "all") {
      const statusFilterLabel = statusFilters.find(f => f.id === statusFilter)?.label || "";
      summary += ` • ${statusFilterLabel}`;
    }
    
    // Custom date range
    if (dateFilter === "custom" && customDateRange.start && customDateRange.end) {
      const start = format(new Date(customDateRange.start), "MMM dd");
      const end = format(new Date(customDateRange.end), "MMM dd");
      summary = `Custom: ${start} - ${end}`;
    }
    
    return summary;
  };

  return (
    <div className="withdraw-history min-h-screen font-sans bg-gray-50">
      {/* Filter Header */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Recent Withdrawals</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <PiFunnelSimple className="w-4 h-4" />
              Filters
            </button>
            <button 
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <PiArrowsClockwiseLight className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 flex items-center gap-1">
          <PiCalendarBlank className="w-4 h-4" />
          <span className="font-medium">{getFilterSummary()}</span>
          <span className="ml-2 text-gray-400">
            • {filteredRequests.length} {filteredRequests.length === 1 ? "transaction" : "transactions"}
          </span>
        </div>
      </div>

      {/* Filter Options */}
      {showFilterOptions && (
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction Status</h3>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      statusFilter === filter.id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Date Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Date Range</h3>
              <div className="flex flex-wrap gap-2">
                {dateFilters.filter(f => f.id !== "custom").map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => handleDateFilterChange(filter.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      dateFilter === filter.id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
                
                <button
                  onClick={() => handleDateFilterChange("custom")}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    dateFilter === "custom"
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom
                </button>
              </div>
              
              {/* Custom Date Picker */}
              {showDatePicker && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) => handleCustomDateChange(e, "start")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                      <input
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) => handleCustomDateChange(e, "end")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={applyCustomDateRange}
                    disabled={!customDateRange.start || !customDateRange.end}
                    className={`px-4 py-2 text-sm rounded-lg ${
                      customDateRange.start && customDateRange.end
                        ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Apply Date Range
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-[200px]">
          <ClipLoader color="#6366f1" size={40} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-12">
          <div className="w-24 h-24 mb-6 text-indigo-500/20">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-gray-500 text-lg font-semibold mb-2">No transactions found</h3>
          <p className="text-gray-400 text-sm max-w-[240px]">
            Try adjusting your filters or select a different date range
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Transaction List */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="grid gap-3">
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

      {/* Transaction Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-2 z-50 animate-fadeIn">
          <div 
            className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                  Transaction Receipt
                </h2>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-1.5 -m-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <RxCross2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-2">
              {/* Status Indicator */}
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28">
                  <Lottie
                    loop={false}
                    play={true}
                    animationData={selectedTransaction.approved === "approved" 
                      ? checkmarkAnimation 
                      : selectedTransaction.approved === "pending" 
                      ? pendingAnimation 
                      : RejectAnimation}
                    className="w-28 h-28"
                  />
                </div>
                <div className={`mt-4 w-full flex items-center justify-center flex-col px-4 py-1.5 rounded-md text-sm  tracking-wide ${
                  selectedTransaction.approved === "approved" 
                    ? "bg-emerald-100 text-emerald-700"
                    : selectedTransaction.approved === "pending" 
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
                }`}>
                  
                  {selectedTransaction.approved.charAt(0).toUpperCase() + selectedTransaction.approved.slice(1)}
                  <p className="text-xs mt-1 font-mono ">{selectedTransaction.msg}</p>

                </div>
                
              </div>

              {/* Receipt Details */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 shadow-sm mt-4">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Transaction ID</span>
                    <span className="text-gray-800 font-mono text-xs">
                    {String(selectedTransaction.id).slice(0, 6)}-{String(selectedTransaction.uid)}
                    </span>
                  </div>
                  
                  <div className="border-t border-dashed border-gray-200 my-3"></div>
                  
                  <DetailItem 
                    label="Timestamp" 
                    value={formatDateTime(selectedTransaction.date)}
                    valueColor="text-gray-800"
                  />
                  
                  <DetailItem 
                    label="Amount" 
                    value={`$${RemoveTrailingZeros(Number(selectedTransaction.amount))}`}
                    monospace
                    valueColor="text-indigo-600 font-semibold"
                  />
                  
                  <DetailItem 
                    label="Currency" 
                    value={selectedTransaction.currency || "USDT"}
                    valueColor="text-gray-800"
                  />
                  
                  <div className="border-t border-dashed border-gray-200 my-3"></div>

                  <div className="space-y-4">
                    <DetailItem 
                      label="Wallet" 
                      value={selectedTransaction.bank_name}
                      valueColor="text-gray-800"
                    />
                    
                    <SecureDetailItem
                      label="Address"
                      value={selectedTransaction.account_number}
                      hidden={hideNumber}
                      onToggle={toggleHideNumber}
                      formatValue={v => v.replace(/(.{4})/g, '$1 ').trim()}
                      valueColor="text-gray-800 text-right font-mono"
                    />
                  </div>
                  
                  <div className="border-t border-dashed border-gray-200 my-3"></div>
                  
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-500 font-medium">Network Fee</span>
                    <span className="text-gray-800">${RemoveTrailingZeros(Number(selectedTransaction.fee))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionCard = ({ request, formatDate, statusData, setSelectedTransaction }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { label } = statusData(request.approved);

  const statusColors = {
    approved: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-600',
    },
    pending: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      iconBg: 'bg-amber-600',
    },
    rejected: {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      iconBg: 'bg-rose-600',
    },
  };

  return (
    <div
      ref={ref}
      className={`group p-3 rounded-xl transition-all duration-300 cursor-pointer bg-white shadow-sm hover:shadow-md border border-gray-100 ${
        inView ? "animate-fadeInUp" : "opacity-0 translate-y-4"
      }`}
      onClick={() => setSelectedTransaction(request)}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColors[request.approved].bg}`}>
          {request.approved === "approved" ? (
            <IoCheckmarkOutline className={`w-5 h-5 ${statusColors[request.approved].text}`} />
          ) : request.approved === "pending" ? (
            <PiArrowsClockwiseLight className={`w-5 h-5 ${statusColors[request.approved].text}`} />
          ) : (
            <RxCross2 className={`w-5 h-5 ${statusColors[request.approved].text}`} />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-medium ${statusColors[request.approved].text}`}>
              {label}
            </h3>
            <span className="text-sm font-medium text-gray-800">
              ${RemoveTrailingZeros(request.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {formatDate(request.date)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[request.approved].bg} ${statusColors[request.approved].text}`}>
              {request.approved}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, monospace = false, valueColor = "text-gray-800" }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className={`${valueColor} ${monospace ? 'font-mono' : 'font-medium'}`}>
      {value}
    </span>
  </div>
);

const SecureDetailItem = ({ label, value, hidden, onToggle, formatValue, valueColor }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-gray-500 font-medium">{label}</span>
    <div className="flex items-center gap-2">
      <span className={`${valueColor} ${hidden ? 'tracking-widest' : ''}`}>
        {hidden 
          ? '•••• •••• •••• ••••' 
          : formatValue ? formatValue(value) : value}
      </span>
      <button
        onClick={onToggle}
        className="text-indigo-500 hover:text-indigo-700 p-1 -m-1 rounded-lg transition-colors"
        aria-label={`${hidden ? 'Reveal' : 'Hide'} ${label}`}
      >
        {hidden ? (
          <GoEyeClosed className="w-5 h-5" />
        ) : (
          <GoEye className="w-5 h-5" />
        )}
      </button>
    </div>
  </div>
);