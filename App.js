import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Main App Component
const App = () => {
  // State for user inputs
  const [investmentPeriod, setInvestmentPeriod] = useState(10); // years
  const [monthlyDeposit, setMonthlyDeposit] = useState(100); // GBP
  const [annualInterestRate, setAnnualInterestRate] = useState(7); // percentage
  const [marketVariance, setMarketVariance] = useState('Medium'); // Low, Medium, High

  // State for calculated data to be displayed in the chart
  const [chartData, setChartData] = useState([]);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State for new metrics: Total Interest Earned and Average Annual Growth Rate
  const [totalInterestEarned, setTotalInterestEarned] = useState(0);
  const [averageAnnualGrowthRate, setAverageAnnualGrowthRate] = useState(0);

  // Function to simulate market events based on variance
  const applyMarketEvent = useCallback((monthIndex, currentFund, variance, eventType) => {
    let impact = 0;
    // Simplified market event simulation.
    // In a real application, these would be more complex models or historical data.

    if (eventType === 'tariff') {
      // Simulate a tariff event occurring around month 24-36 (2-3 years in)
      if (monthIndex >= 24 && monthIndex <= 36) {
        switch (variance) {
          case 'Low':
            impact = -0.005; // -0.5%
            break;
          case 'Medium':
            impact = -0.015; // -1.5%
            break;
          case 'High':
            impact = -0.03; // -3%
            break;
          default:
            break;
        }
      }
    } else if (eventType === 'covid') {
      // Simulate a COVID-19 like event occurring around month 48-60 (4-5 years in)
      if (monthIndex >= 48 && monthIndex <= 60) {
        switch (variance) {
          case 'Low':
            if (monthIndex === 48) impact = -0.05; // -5% initial dip
            else if (monthIndex > 48 && monthIndex <= 51) impact = 0.02; // +2% recovery for 3 months
            break;
          case 'Medium':
            if (monthIndex >= 48 && monthIndex <= 49) impact = -0.10; // -10% for 2 months
            else if (monthIndex > 49 && monthIndex <= 53) impact = 0.03; // +3% recovery for 4 months
            break;
          case 'High':
            if (monthIndex >= 48 && monthIndex <= 50) impact = -0.20; // -20% for 3 months
            else if (monthIndex > 50 && monthIndex <= 56) impact = 0.05; // +5% recovery for 6 months
            break;
          default:
            break;
        }
      }
    }
    return currentFund * (1 + impact);
  }, []);

  // Function to calculate investment growth and generate chart data
  const calculateGrowth = useCallback(() => {
    // Input validation
    if (investmentPeriod <= 0 || monthlyDeposit < 0 || annualInterestRate < 0) {
      setErrorMessage('Please enter a positive value for Investment Period, and non-negative values for Monthly Deposit and Annual Interest Rate.');
      setShowError(true);
      setChartData([]);
      setTotalInterestEarned(0);
      setAverageAnnualGrowthRate(0);
      return;
    }
    setShowError(false);
    setErrorMessage('');

    const data = [];
    let currentFundValue = 0;
    let accumulatedDeposits = 0;
    let prevFundValue = 0; // To calculate monthly growth percentage
    const totalMonths = investmentPeriod * 12;
    const monthlyInterestRate = annualInterestRate / 100 / 12;

    for (let i = 1; i <= totalMonths; i++) {
      // Store fund value before current month's deposit and interest for monthly growth calculation
      prevFundValue = currentFundValue;

      // Add monthly deposit
      currentFundValue += monthlyDeposit;
      accumulatedDeposits += monthlyDeposit;

      // Apply monthly interest
      currentFundValue *= (1 + monthlyInterestRate);

      // Apply market events
      currentFundValue = applyMarketEvent(i, currentFundValue, marketVariance, 'tariff');
      currentFundValue = applyMarketEvent(i, currentFundValue, marketVariance, 'covid');

      // Calculate monthly interest gained (difference between fund with interest and accumulated deposits for this month)
      const monthlyInterestGained = currentFundValue - accumulatedDeposits;

      // Calculate monthly fund growth percentage
      let monthlyFundGrowthPercentage = 0;
      if (i > 1 && prevFundValue > 0) {
        monthlyFundGrowthPercentage = ((currentFundValue - prevFundValue) / prevFundValue) * 100;
      } else if (i === 1 && monthlyDeposit > 0) {
        // For the first month, if there's a deposit, consider initial growth from deposit
        monthlyFundGrowthPercentage = (currentFundValue / monthlyDeposit - 1) * 100;
      }


      data.push({
        month: i,
        'Accumulated Deposits': parseFloat(accumulatedDeposits.toFixed(2)),
        'Fund with Interest & Events': parseFloat(currentFundValue.toFixed(2)),
        'Interest Gained (Month)': parseFloat(monthlyInterestGained.toFixed(2)),
        'Monthly Fund Growth (%)': parseFloat(monthlyFundGrowthPercentage.toFixed(2))
      });
    }
    setChartData(data);

    // Calculate Total Interest Earned and Average Annual Growth Rate
    if (data.length > 0) {
      const finalFundValue = data[data.length - 1]['Fund with Interest & Events'];
      const finalAccumulatedDeposits = data[data.length - 1]['Accumulated Deposits'];

      const interestEarned = finalFundValue - finalAccumulatedDeposits;
      setTotalInterestEarned(parseFloat(interestEarned.toFixed(2)));

      // Calculate Average Annual Growth Rate (AAGR)
      // This is a simplified calculation for AAGR with periodic deposits.
      // For a more precise calculation (like XIRR), a dedicated financial library would be needed.
      let aagr = 0;
      if (finalAccumulatedDeposits > 0 && investmentPeriod > 0) {
        // Calculate total return percentage
        const totalReturnPercentage = interestEarned / finalAccumulatedDeposits;
        // Annualize the total return
        aagr = ((1 + totalReturnPercentage) ** (1 / investmentPeriod) - 1) * 100;
      }
      setAverageAnnualGrowthRate(parseFloat(aagr.toFixed(2)));
    } else {
      setTotalInterestEarned(0);
      setAverageAnnualGrowthRate(0);
    }

  }, [investmentPeriod, monthlyDeposit, annualInterestRate, marketVariance, applyMarketEvent]);

  // Recalculate whenever inputs change
  useEffect(() => {
    calculateGrowth();
  }, [calculateGrowth]);

  // Custom Tooltip content
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const currentData = payload[0].payload; // Access the full data object for the current month
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-md text-sm">
          <p className="font-bold text-gray-800 mb-2">Month: {label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">£{entry.value.toLocaleString()}</span>
            </p>
          ))}
          {currentData['Interest Gained (Month)'] !== undefined && (
            <p className="text-gray-700 mt-2">
              Interest Gained (Month): <span className="font-semibold">£{currentData['Interest Gained (Month)'].toLocaleString()}</span>
            </p>
          )}
          {currentData['Monthly Fund Growth (%)'] !== undefined && (
            <p className="text-gray-700">
              Monthly Fund Growth: <span className="font-semibold">{currentData['Monthly Fund Growth (%)'].toFixed(2)}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex flex-col items-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Investment Growth Simulator</h1>

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Investment Period Input */}
          <div className="flex flex-col">
            <label htmlFor="period" className="text-gray-700 font-medium mb-2">Investment Period (Years)</label>
            <input
              type="number"
              id="period"
              value={investmentPeriod}
              onChange={(e) => setInvestmentPeriod(Math.max(1, parseInt(e.target.value) || 0))}
              className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              min="1"
            />
          </div>

          {/* Monthly Deposit Input */}
          <div className="flex flex-col">
            <label htmlFor="deposit" className="text-gray-700 font-medium mb-2">Monthly Deposit (£)</label>
            <input
              type="number"
              id="deposit"
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(Math.max(0, parseFloat(e.target.value) || 0))}
              className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              min="0"
              step="any"
            />
          </div>

          {/* Annual Interest Rate Input */}
          <div className="flex flex-col">
            <label htmlFor="interest" className="text-gray-700 font-medium mb-2">Annual Interest Rate (%)</label>
            <input
              type="number"
              id="interest"
              value={annualInterestRate}
              onChange={(e) => setAnnualInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
              className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              min="0"
              step="any"
            />
          </div>

          {/* Market Event Variance Selector */}
          <div className="flex flex-col">
            <label htmlFor="variance" className="text-gray-700 font-medium mb-2">Market Event Variance</label>
            <select
              id="variance"
              value={marketVariance}
              onChange={(e) => setMarketVariance(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {showError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {errorMessage}</span>
          </div>
        )}

        {/* New Metrics Display Box */}
        <div className="bg-blue-50 p-6 rounded-xl shadow-inner w-full mt-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4 text-center">Investment Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
            <div className="flex justify-between items-center bg-blue-100 p-4 rounded-lg">
              <span className="font-medium text-blue-700">Total Interest Earned:</span>
              <span className="font-bold text-blue-900">£{totalInterestEarned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-100 p-4 rounded-lg">
              <span className="font-medium text-blue-700">Average Annual Growth Rate:</span>
              <span className="font-bold text-blue-900">{averageAnnualGrowthRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl h-96 md:h-[500px] flex items-center justify-center">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Fund Value (£)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} /> {/* Use custom tooltip */}
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line
                type="monotone"
                dataKey="Accumulated Deposits"
                stroke="#DBCC3B" // Updated color
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Fund with Interest & Events"
                stroke="#3E1BDB" // Updated color
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">Enter valid inputs to see the investment projection.</p>
        )}
      </div>
    </div>
  );
};

export default App;
