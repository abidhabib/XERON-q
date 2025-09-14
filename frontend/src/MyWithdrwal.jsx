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
  const [dateFilter, setDateFilter] = useState("7d");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const dateFilters = [
    { id: "1d", label: "Last 24 hours" },
    { id: "7d", label: "Last 7 days" },
    { id: "30d", label: "Last 30 days" },
    { id: "mtd", label: "Month to date" },
    { id: "custom", label: "Custom range" }
  ];

  const statusFilters = [
    { id: "all", label: "All" },
    { id: "approved", label: "Completed" },
    { id: "pending", label: "Processing" },
    { id: "rejected", label: "Rejected" }
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
        const rawDate = request.date ?? request.request_date;
        const requestDate = new Date(rawDate);
        return isWithinInterval(requestDate, { start: startDate, end: endDate });
      });
    }
    
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
      setShowFilterModal(false);
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
      setShowFilterModal(false);
    }
  };

  const resetFilters = () => {
    setDateFilter("7d");
    setStatusFilter("all");
    setCustomDateRange({ start: "", end: "" });
    setShowFilterModal(false);
  };

  const getFilterSummary = () => {
    const dateFilterLabel = dateFilters.find(f => f.id === dateFilter)?.label || "";
    let summary = dateFilterLabel;
    
    if (statusFilter !== "all") {
      const statusFilterLabel = statusFilters.find(f => f.id === statusFilter)?.label || "";
      summary += ` • ${statusFilterLabel}`;
    }
    
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
      <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Withdrawal History</h2>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <PiFunnelSimple className="w-3.5 h-3.5" />
              Filter
            </button>
            <button 
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <PiArrowsClockwiseLight className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
          <PiCalendarBlank className="w-3.5 h-3.5" />
          <span>{getFilterSummary()}</span>
          <span className="ml-1 text-gray-400">
            • {filteredRequests.length} transactions
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-[150px]">
          <ClipLoader color="#6366f1" size={30} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-8">
          <div className="w-16 h-16 mb-4 text-indigo-500/20">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">No transactions found</h3>
          <p className="text-gray-400 text-xs max-w-[200px]">
            Try adjusting your filters or reset to see all transactions
          </p>
          <button
            onClick={resetFilters}
            className="mt-3 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs hover:bg-indigo-600 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Transaction List */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="grid gap-2.5">
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

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Filter Transactions</h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <RxCross2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Status Filter */}
              <div className="mb-5">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Status</h4>
                <div className="flex flex-wrap gap-1.5">
                  {statusFilters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-full text-xs ${
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
                <h4 className="text-xs font-medium text-gray-700 mb-2">Date Range</h4>
                <div className="flex flex-wrap gap-1.5">
                  {dateFilters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => handleDateFilterChange(filter.id)}
                      className={`px-2.5 py-1 rounded-full text-xs ${
                        dateFilter === filter.id
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                
                {dateFilter === "custom" && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <input
                          type="date"
                          value={customDateRange.start}
                          onChange={(e) => handleCustomDateChange(e, "start")}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={customDateRange.end}
                          onChange={(e) => handleCustomDateChange(e, "end")}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    <button
                      onClick={applyCustomDateRange}
                      disabled={!customDateRange.start || !customDateRange.end}
                      className={`w-full px-3 py-1.5 text-xs rounded ${
                        customDateRange.start && customDateRange.end
                          ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Apply Range
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Transaction Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <RxCross2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3">
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <Lottie
                    loop={false}
                    play={true}
                    animationData={selectedTransaction.approved === "approved" 
                      ? checkmarkAnimation 
                      : selectedTransaction.approved === "pending" 
                      ? pendingAnimation 
                      : RejectAnimation}
                    className="w-20 h-20"
                  />
                </div>
                <div className={`mt-3 w-full flex items-center justify-center px-3 py-1 rounded text-xs ${
                  selectedTransaction.approved === "approved" 
                    ? "bg-emerald-100 text-emerald-700"
                    : selectedTransaction.approved === "pending" 
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
                }`}>
                  {selectedTransaction.approved.charAt(0).toUpperCase() + selectedTransaction.approved.slice(1)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID</span>
                    <span className="text-gray-800 font-mono text-xs">
                    {String(selectedTransaction.id).slice(0, 6)}-{String(selectedTransaction.uid)}
                    </span>
                  </div>
                  
                  <div className="border-t border-dashed border-gray-200 my-2"></div>
                  
                  <DetailItem 
                    label="Date" 
                    value={formatDateTime(selectedTransaction.date)}
                    valueColor="text-gray-800"
                  />
                  
                  <DetailItem 
                    label="Amount" 
                    value={`$${RemoveTrailingZeros(Number(selectedTransaction.amount))}`}
                    monospace
                    valueColor="text-indigo-600 font-medium"
                  />
                  
                  <div className="border-t border-dashed border-gray-200 my-2"></div>

                  <div className="space-y-3">
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
                  
                  <div className="border-t border-dashed border-gray-200 my-2"></div>
                  
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-500">Fee</span>
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
      className={`p-2.5 rounded-lg transition-all cursor-pointer bg-white shadow-sm hover:shadow border border-gray-100 ${
        inView ? "animate-fadeInUp" : "opacity-0 translate-y-2"
      }`}
      onClick={() => setSelectedTransaction(request)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[request.approved].bg}`}>
          {request.approved === "approved" ? (
            <IoCheckmarkOutline className={`w-4 h-4 ${statusColors[request.approved].text}`} />
          ) : request.approved === "pending" ? (
            <PiArrowsClockwiseLight className={`w-4 h-4 ${statusColors[request.approved].text}`} />
          ) : (
            <RxCross2 className={`w-4 h-4 ${statusColors[request.approved].text}`} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-xs font-medium ${statusColors[request.approved].text}`}>
              {label}
            </h3>
            <span className="text-xs font-medium text-gray-800">
              ${RemoveTrailingZeros(request.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {formatDate(request.date)}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[request.approved].bg} ${statusColors[request.approved].text}`}>
              {request.approved}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, monospace = false, valueColor = "text-gray-800" }) => (
  <div className="flex justify-between items-center py-1.5">
    <span className="text-gray-500 text-xs">{label}</span>
    <span className={`${valueColor} ${monospace ? 'font-mono' : ''} text-xs`}>
      {value}
    </span>
  </div>
);

const SecureDetailItem = ({ label, value, hidden, onToggle, formatValue, valueColor }) => (
  <div className="flex justify-between items-center py-1.5">
    <span className="text-gray-500 text-xs">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className={`${valueColor} ${hidden ? 'tracking-widest' : ''} text-xs`}>
        {hidden 
          ? '•••• •••• •••• ••••' 
          : formatValue ? formatValue(value) : value}
      </span>
      <button
        onClick={onToggle}
        className="text-indigo-500 hover:text-indigo-700 p-0.5 rounded transition-colors"
        aria-label={`${hidden ? 'Reveal' : 'Hide'} ${label}`}
      >
        {hidden ? (
          <GoEyeClosed className="w-3.5 h-3.5" />
        ) : (
          <GoEye className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  </div>
);