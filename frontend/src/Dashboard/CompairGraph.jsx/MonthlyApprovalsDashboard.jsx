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

const MonthlyApprovalsDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12');
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
          
          // Calculate total, avg, max
          const total = fetchedData.reduce((sum, item) => sum + item.approvals, 0);
          const avg = fetchedData.length > 0 ? Math.round(total / fetchedData.length) : 0;
          const max = fetchedData.reduce((max, item) =>
            item.approvals > max.approvals ? item : max, { approvals: 0 }
          );
          
          // Calculate average monthly growth rate
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
          
          // Calculate last period change
          let diffText = 'No previous data';
          let diff = 0;
          if (fetchedData.length > 1) {
            const lastMonth = fetchedData[fetchedData.length - 1];
            const prevMonth = fetchedData[fetchedData.length - 2];
            diff = lastMonth.approvals - prevMonth.approvals;
            diffText = diff >= 0 
              ? `${diff} increase from last period` 
              : `${Math.abs(diff)} decrease from last period`;
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
        } else {
          console.error('Failed to fetch approval data');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [timeRange]);

  // Calculate peak month's performance relative to average
  const peakPerformance = averageMonthly > 0
    ? Math.round(((maxMonth.approvals / averageMonthly) - 1) * 100)
    : maxMonth.approvals > 0 ? 100 : 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const diff = averageMonthly > 0 
        ? Math.round(((value / averageMonthly) - 1) * 100)
        : value > 0 ? 100 : 0;
        
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg">
          <p className="font-bold text-gray-800">{label}</p>
          <p className="text-blue-600">
            <span className="font-medium">Approvals:</span> {value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {diff >= 0 
              ? `${diff}% above average` 
              : `${Math.abs(diff)}% below average`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom bar shape for gradient effect
  const CustomBar = (props) => {
    const { fill, x, y, width, height } = props;
    return (
      <g>
        <defs>
          <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          rx="4" 
          ry="4" 
          fill="url(#colorBar)" 
        />
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 mt-6 rounded ">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Approvals Dashboard</h1>
          <p className="text-gray-600 mt-2">Monthly approval statistics and trends</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Approvals</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {totalApprovals.toLocaleString()}
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 mr-1 ${diffValue >= 0 ? 'text-green-500' : 'text-red-500'}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={diffValue >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 9l-7 7-7-7'} />
                </svg>
                <span>{lastPeriodChange}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Avg. Monthly</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {averageMonthly.toLocaleString()}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>Peak was {peakPerformance}% above average</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Peak Month</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {maxMonth.approvals > 0 ? maxMonth.approvals.toLocaleString() : 'N/A'}
                </h3>
                <p className="text-gray-600 mt-1 text-sm">
                  {maxMonth.month ? `in ${maxMonth.month}` : ''}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <span>Highest month in selected period</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Monthly Approvals</h2>
              <p className="text-gray-600">User approvals by month</p>
            </div>
            <div className="flex mt-4 md:mt-0">
              <button 
                onClick={() => setTimeRange('6')}
                className={`px-4 py-2 rounded-l-lg border border-r-0 text-sm font-medium ${
                  timeRange === '6' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                6 Months
              </button>
              <button 
                onClick={() => setTimeRange('12')}
                className={`px-4 py-2 border border-r-0 text-sm font-medium ${
                  timeRange === '12' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                12 Months
              </button>
              <button 
                onClick={() => setTimeRange('24')}
                className={`px-4 py-2 rounded-r-lg border text-sm font-medium ${
                  timeRange === '24' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No approval data available</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="approvals" 
                    name="Approvals" 
                    barSize={32}
                    shape={<CustomBar />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Trend Analysis */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Approval Trend</h3>
            <div className="h-64">
              {data.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No data available for trend analysis</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => (value/1000).toFixed(0) + 'K'}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="approvals" 
                      stroke="#4f46e5" 
                      fillOpacity={1} 
                      fill="url(#colorArea)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4">
              <div className={`flex items-center font-medium ${
                averageMonthlyGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {averageMonthlyGrowthRate >= 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span>
                  {averageMonthlyGrowthRate >= 0 ? '+' : ''}
                  {averageMonthlyGrowthRate}% average monthly growth
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Monthly Approval Data</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approvals
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => {
                  const prevValue = index > 0 ? data[index - 1].approvals : item.approvals;
                  const change = prevValue > 0 
                    ? Math.round(((item.approvals - prevValue) / prevValue) * 100)
                    : item.approvals > 0 ? 100 : 0;
                  
                  return (
                    <tr key={item.month} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.approvals.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {change >= 0 ? `+${change}%` : `${change}%`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {change >= 0 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyApprovalsDashboard;