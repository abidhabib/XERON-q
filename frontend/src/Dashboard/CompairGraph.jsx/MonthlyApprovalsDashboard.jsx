import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { 
  HiOutlineCheckCircle, 
  HiOutlineTrendingUp, 
  HiOutlineCalendar, 
  HiOutlineArrowSmUp, 
  HiOutlineArrowSmDown 
} from 'react-icons/hi';

const MonthlyApprovalsDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12');
  
  // Stats State
  const [totalApprovals, setTotalApprovals] = useState(0);
  const [averageMonthly, setAverageMonthly] = useState(0);
  const [maxMonth, setMaxMonth] = useState({ month: '', approvals: 0 });
  const [lastPeriodChange, setLastPeriodChange] = useState('');
  const [diffValue, setDiffValue] = useState(0);
  const [averageMonthlyGrowthRate, setAverageMonthlyGrowthRate] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/approvals/monthly?range=${timeRange}`);
        const result = await res.json();
  
        if (result.success) {
          const fetchedData = result.data;
          
          const total = fetchedData.reduce((sum, item) => sum + item.approvals, 0);
          const avg = fetchedData.length > 0 ? Math.round(total / fetchedData.length) : 0;
          const max = fetchedData.reduce((max, item) =>
            item.approvals > max.approvals ? item : max, { approvals: 0 }
          );
          
          let growthRate = 0;
          if (fetchedData.length > 1) {
            let sumGrowth = 0;
            for (let i = 1; i < fetchedData.length; i++) {
              const prev = fetchedData[i-1].approvals;
              const curr = fetchedData[i].approvals;
              if (prev > 0) {
                sumGrowth += ((curr - prev) / prev);
              }
            }
            growthRate = Math.round((sumGrowth / (fetchedData.length - 1)) * 100);
          }
          
          let diffText = 'No previous data';
          let diff = 0;
          if (fetchedData.length > 1) {
            const lastMonth = fetchedData[fetchedData.length - 1];
            const prevMonth = fetchedData[fetchedData.length - 2];
            diff = lastMonth.approvals - prevMonth.approvals;
            diffText = diff >= 0 
              ? `${diff.toLocaleString()} increase` 
              : `${Math.abs(diff).toLocaleString()} decrease`;
          } else if (fetchedData.length === 1) {
            diffText = 'First data point';
          }

          setData(fetchedData);
          setTotalApprovals(total);
          setAverageMonthly(avg);
          setMaxMonth(max);
          setLastPeriodChange(diffText);
          setDiffValue(diff);
          setAverageMonthlyGrowthRate(growthRate);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [timeRange]);

  const peakPerformance = averageMonthly > 0
    ? Math.round(((maxMonth.approvals / averageMonthly) - 1) * 100)
    : maxMonth.approvals > 0 ? 100 : 0;

  // Minimal Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-none">
          <p className="font-bold text-zinc-900 mb-1">{label}</p>
          <p className="text-zinc-600 font-medium">
            {payload[0].value.toLocaleString()} Approvals
          </p>
        </div>
      );
    }
    return null;
  };

  // Clean Bar Shape
  const CustomBar = (props) => {
    const { x, y, width, height } = props;
    return (
      <g>
        <defs>
          <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" /> {/* Zinc-900 */}
            <stop offset="100%" stopColor="#52525b" /> {/* Zinc-600 */}
          </linearGradient>
        </defs>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          rx="6" 
          ry="6" 
          fill="url(#colorBar)" 
        />
      </g>
    );
  };

  return (
    <div className="w-full space-y-6 px-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Approval Trends</h1>
          <p className="text-sm text-zinc-500 mt-1">Performance overview by month</p>
        </div>
        
        {/* Minimal Toggle Buttons */}
        <div className="flex bg-zinc-100 p-1 rounded-full">
          {['6', '12', '24'].map((range) => (
            <button 
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                timeRange === range 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {range === '24' ? 'All Time' : `${range} Mo`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
           {[1,2,3].map(i => <div key={i} className="h-32 bg-zinc-100 rounded-2xl"></div>)}
        </div>
      ) : (
        <>
          {/* Summary Cards - Borderless & Monochromatic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-zinc-50 p-2.5 rounded-xl text-zinc-600">
                  <HiOutlineCheckCircle className="w-6 h-6" />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${diffValue >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {diffValue >= 0 ? '+' : ''}{diffValue}
                </span>
              </div>
              <p className="text-sm font-semibold text-zinc-500">Total Approvals</p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-1 tracking-tight">
                {totalApprovals.toLocaleString()}
              </h3>
              <p className="text-xs text-zinc-400 mt-2">{lastPeriodChange}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-zinc-50 p-2.5 rounded-xl text-zinc-600">
                  <HiOutlineTrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-semibold text-zinc-500">Avg. Monthly</p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-1 tracking-tight">
                {averageMonthly.toLocaleString()}
              </h3>
              <p className="text-xs text-zinc-400 mt-2">Peak was {peakPerformance}% above avg</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-zinc-50 p-2.5 rounded-xl text-zinc-600">
                  <HiOutlineCalendar className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-semibold text-zinc-500">Best Month</p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-1 tracking-tight">
                {maxMonth.approvals > 0 ? maxMonth.approvals.toLocaleString() : '-'}
              </h3>
              <p className="text-xs text-zinc-400 mt-2">{maxMonth.month || 'N/A'}</p>
            </div>
          </div>

          {/* Main Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5' }} />
                  <Bar dataKey="approvals" shape={<CustomBar />} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Area Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-zinc-900">Growth Trajectory</h3>
                <div className={`flex items-center text-sm font-bold ${averageMonthlyGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {averageMonthlyGrowthRate >= 0 ? <HiOutlineArrowSmUp className="w-5 h-5 mr-1"/> : <HiOutlineArrowSmDown className="w-5 h-5 mr-1"/>}
                  {Math.abs(averageMonthlyGrowthRate)}% Avg Growth
                </div>
             </div>
             <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={false} />
                  <YAxis axisLine={false} tickLine={false} tick={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="approvals" 
                    stroke="#18181b" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorArea)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Minimal Data Table */}
          <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-6 py-4 text-sm font-semibold text-zinc-500">Month</th>
                    <th className="px-6 py-4 text-sm font-semibold text-zinc-500 text-right">Approvals</th>
                    <th className="px-6 py-4 text-sm font-semibold text-zinc-500 text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {data.map((item, index) => {
                    const prevValue = index > 0 ? data[index - 1].approvals : item.approvals;
                    const change = prevValue > 0 
                      ? Math.round(((item.approvals - prevValue) / prevValue) * 100)
                      : 0;
                    
                    return (
                      <tr key={item.month} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-zinc-900">{item.month}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600 text-right font-mono">{item.approvals.toLocaleString()}</td>
                        <td className={`px-6 py-4 text-sm text-right font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {index === 0 ? '-' : `${change > 0 ? '+' : ''}${change}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyApprovalsDashboard;