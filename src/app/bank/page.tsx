"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import CandlestickChart from "../../components/CandlestickChart";

export default function BankPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState<"bank" | "stocks">("stocks");
  const [selectedStock, setSelectedStock] = useState("MEK");
  const [buyShares, setBuyShares] = useState<Record<string, string>>({ MEK: "", ESS: "", MRK: "" });
  const [sellShares, setSellShares] = useState<Record<string, string>>({ MEK: "", ESS: "", MRK: "" });
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean, direction: string, speed: number, delay: number}>>([]);
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const getOrCreateAccount = useMutation(api.bank.getOrCreateAccount);
  const initializeStocks = useMutation(api.stocks.initializeStocks);
  const fetchRealSunspotData = useMutation(api.sunspotActions.fetchRealSunspotData);
  const fetchSolarFlareData = useMutation(api.sunspotActions.fetchSolarFlareData);
  
  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
        await getOrCreateAccount({ userId: user._id as Id<"users"> });
        await initializeStocks(); // Initialize stock companies if not already done
        
        // Fetch real solar data
        try {
          await fetchRealSunspotData();
          await fetchSolarFlareData();
        } catch (error) {
          console.error("Error fetching solar data:", error);
        }
      }
    };
    initUser();
    
    // Generate stars for background
    setStars(prevStars => {
      if (prevStars.length > 0) return prevStars; // Only generate once
      return [...Array(40)].map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() > 0.5,
        direction: Math.random() > 0.5 ? 'horizontal' : 'vertical', // Random movement direction
        speed: Math.random() * 60 + 120, // Random speed between 120-180 seconds
        delay: Math.random() * 60, // Random delay up to 60 seconds
      }));
    });
  }, [getOrCreateUser, getOrCreateAccount, initializeStocks, fetchRealSunspotData, fetchSolarFlareData]);
  
  // Queries
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  const bankAccount = useQuery(
    api.bank.getAccount,
    userId ? { userId } : "skip"
  );
  
  const accountStats = useQuery(
    api.bank.getAccountStats,
    userId ? { userId } : "skip"
  );
  
  const transactions = useQuery(
    api.bank.getTransactions,
    userId ? { userId, limit: 10 } : "skip"
  );
  
  const stockCompanies = useQuery(api.stocks.getStockCompanies);
  
  const allPriceHistory = useQuery(
    api.stocks.getAllPriceHistory,
    { period: "5m", limit: 30 }
  );
  
  const userHoldings = useQuery(
    api.stocks.getUserHoldings,
    userId ? { userId } : "skip"
  );
  
  const portfolioSummary = useQuery(
    api.stocks.getPortfolioSummary,
    userId ? { userId } : "skip"
  );
  
  const latestSunspotData = useQuery(api.sunspots.getLatestSunspotData);
  
  // Mutations
  const deposit = useMutation(api.bank.deposit);
  const withdraw = useMutation(api.bank.withdraw);
  const calculateInterest = useMutation(api.bank.calculateInterest);
  const buyStock = useMutation(api.stocks.buyStock);
  const sellStock = useMutation(api.stocks.sellStock);
  
  // Handlers
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (amount > 0 && userId) {
      try {
        await deposit({ userId, amount });
        setDepositAmount("");
      } catch (error) {
        alert(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };
  
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && userId) {
      try {
        await withdraw({ userId, amount });
        setWithdrawAmount("");
      } catch (error) {
        alert(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };
  
  const handleClaimInterest = async () => {
    if (userId) {
      try {
        const result = await calculateInterest({ userId });
        if (result.success) {
          alert(`Earned ${result.interestEarned} gold in interest!`);
        } else {
          alert(result.message);
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };
  
  const handleBuyStock = async (symbol: string) => {
    const shares = parseInt(buyShares[symbol]);
    if (shares > 0 && userId) {
      try {
        const result = await buyStock({ userId, symbol, shares });
        alert(`Bought ${result.shares} shares of ${symbol} for ${result.totalCost} gold`);
        setBuyShares({ ...buyShares, [symbol]: "" });
      } catch (error) {
        alert(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };
  
  const handleSellStock = async (symbol: string) => {
    const shares = parseInt(sellShares[symbol]);
    if (shares > 0 && userId) {
      try {
        const result = await sellStock({ userId, symbol, shares });
        alert(`Sold ${result.shares} shares of ${symbol} for ${result.totalRevenue} gold (P/L: ${result.profitLoss > 0 ? '+' : ''}${result.profitLoss})`);
        setSellShares({ ...sellShares, [symbol]: "" });
      } catch (error) {
        alert(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };
  
  return (
    <div className="text-white py-8 relative min-h-screen overflow-hidden">
      <style jsx>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes slowDriftHorizontal {
          from { transform: translateX(-20px); }
          to { transform: translateX(calc(100vw + 20px)); }
        }
        @keyframes slowDriftVertical {
          from { transform: translateY(-20px); }
          to { transform: translateY(calc(100vh + 20px)); }
        }
        @keyframes slowFloat {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -15px) rotate(0.5deg); }
          50% { transform: translate(-5px, -25px) rotate(-0.3deg); }
          75% { transform: translate(-15px, -10px) rotate(0.2deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
      `}</style>
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Dynamic Stars */}
        {stars.map((star) => {
          // Determine movement animation based on direction
          let movementAnimation = '';
          if (star.direction === 'horizontal') {
            movementAnimation = `slowDriftHorizontal ${star.speed}s linear infinite`;
          } else if (star.direction === 'vertical') {
            movementAnimation = `slowDriftVertical ${star.speed}s linear infinite`;
          } else {
            movementAnimation = `slowFloat ${star.speed}s ease-in-out infinite`;
          }
          
          // Combine twinkle and movement animations
          const animations = [
            movementAnimation,
            star.twinkle ? `starTwinkle ${2 + star.size}s ease-in-out infinite` : ''
          ].filter(Boolean).join(', ');
          
          return (
            <div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: animations,
                animationDelay: `${star.delay}s, ${star.twinkle ? star.opacity * 2 : 0}s`,
              }}
            />
          );
        })}
      </div>
      
      {/* Main Content */}
      <div className="relative z-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400">
          🏦 Mek Tycoon Bank
        </h1>
        <div className="text-2xl font-bold text-yellow-400">
          💰 Gold: {Math.floor(userProfile?.gold || 0).toLocaleString()}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("stocks")}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === "stocks"
              ? "bg-yellow-500 text-black"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          📈 Stock Market
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            activeTab === "bank"
              ? "bg-yellow-500 text-black"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          🏦 Banking
        </button>
      </div>
      
      {/* Stock Market Tab */}
      {activeTab === "stocks" && (
        <>
          {/* All 3 Stock Charts - Horizontal Layout */}
          <div className="space-y-4 mb-6">
            {stockCompanies?.map((company) => {
              const holding = userHoldings?.find(h => h.symbol === company.symbol);
              const priceHistory = allPriceHistory?.[company.symbol] || [];
              const priceChange = company.currentPrice - company.previousClose;
              const priceChangePercent = company.previousClose > 0 
                ? (priceChange / company.previousClose) * 100 
                : 0;
              
              return (
                <div key={company.symbol} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  {/* Top Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-yellow-400">{company.symbol}</div>
                        <div className="text-3xl font-bold text-white">${company.currentPrice.toFixed(2)}</div>
                        <div className={`text-lg font-semibold ${priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {priceChange >= 0 ? "↑" : "↓"} ${Math.abs(priceChange).toFixed(2)} ({Math.abs(priceChangePercent).toFixed(2)}%)
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {company.name}
                        {company.symbol === "MRK" && (
                          <span className="ml-2 text-xs text-orange-400">
                            - Stock price directly correlates with solar sunspot activity on our Sun
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">High:</span>
                        <span className="ml-2 text-white font-semibold">${company.dayHigh.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Low:</span>
                        <span className="ml-2 text-white font-semibold">${company.dayLow.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Vol:</span>
                        <span className="ml-2 text-white font-semibold">{company.volume.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Risk:</span>
                        <span className="ml-2 text-yellow-400 font-semibold">
                          {company.volatility <= 0.3 ? "Low" : company.volatility <= 0.5 ? "Medium" : "High"}
                        </span>
                      </div>
                      {company.symbol === "MRK" && latestSunspotData && (
                        <div className="border-l border-gray-600 pl-4">
                          <span className="text-gray-400">☀️ Sunspots:</span>
                          <span className="ml-2 text-orange-400 font-semibold">{latestSunspotData.count}</span>
                          <span className="ml-1 text-xs text-gray-500">
                            ({latestSunspotData.count < 50 ? "bearish" : 
                              latestSunspotData.count < 100 ? "neutral" : 
                              latestSunspotData.count < 150 ? "bullish" : "very bullish"})
                          </span>
                        </div>
                      )}
                      {holding && (
                        <div className="border-l border-gray-600 pl-4">
                          <span className="text-gray-400">Your Shares:</span>
                          <span className="ml-2 text-white font-semibold">{holding.shares} shares</span>
                          <span className={`ml-2 font-semibold ${holding.unrealizedPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ({holding.unrealizedPL >= 0 ? "+" : ""}${holding.unrealizedPL.toFixed(0)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Candlestick Chart */}
                  <div className="mb-3">
                    <CandlestickChart 
                      data={priceHistory} 
                      height={200} 
                      showSunspots={company.symbol === "MRK"}
                    />
                  </div>
                  
                  {/* Buy/Sell Controls Below Chart */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Buy Section */}
                    <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                      <div className="text-base font-semibold text-green-400 mb-2">Buy Shares</div>
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={buyShares[company.symbol]}
                          onChange={(e) => setBuyShares({ ...buyShares, [company.symbol]: e.target.value })}
                          placeholder="Number of shares to buy"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white"
                        />
                        {buyShares[company.symbol] && (
                          <div className="bg-black/50 rounded p-2">
                            <div className="text-xs text-gray-400">Price per share: ${company.currentPrice.toFixed(2)}</div>
                            <div className="text-lg font-bold text-yellow-400">
                              Total Cost: ${(parseInt(buyShares[company.symbol]) * company.currentPrice).toFixed(0)}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleBuyStock(company.symbol)}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                    
                    {/* Sell Section */}
                    <div className={`bg-red-900/20 border border-red-500/30 rounded p-3 ${!holding || holding.shares === 0 ? 'opacity-50' : ''}`}>
                      <div className="text-base font-semibold text-red-400 mb-2">Sell Shares</div>
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={sellShares[company.symbol]}
                          onChange={(e) => setSellShares({ ...sellShares, [company.symbol]: e.target.value })}
                          placeholder={holding ? `Max: ${holding.shares} shares` : "No shares owned"}
                          max={holding?.shares || 0}
                          disabled={!holding || holding.shares === 0}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white disabled:opacity-50"
                        />
                        {sellShares[company.symbol] && holding && (
                          <div className="bg-black/50 rounded p-2">
                            <div className="text-xs text-gray-400">Price per share: ${company.currentPrice.toFixed(2)}</div>
                            <div className="text-lg font-bold text-yellow-400">
                              Total Revenue: ${(parseInt(sellShares[company.symbol]) * company.currentPrice).toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Your avg cost: ${holding.averageCost.toFixed(2)} per share
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleSellStock(company.symbol)}
                          className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!holding || holding.shares === 0}
                        >
                          {holding && holding.shares > 0 ? 'Sell Now' : 'No Shares to Sell'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Portfolio Summary */}
          {portfolioSummary && portfolioSummary.totalInvested > 0 && (
            <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Portfolio Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-xs text-gray-400">Total Invested</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {portfolioSummary.totalInvested.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">(Gold spent on stocks)</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Current Value</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {portfolioSummary.totalCurrentValue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">(What your shares are worth now)</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Unrealized Profit/Loss</div>
                  <div className="text-[10px] text-gray-500">(Paper gains/losses)</div>
                  <div className={`text-xl font-bold ${
                    portfolioSummary.totalUnrealizedPL >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {portfolioSummary.totalUnrealizedPL >= 0 ? "+" : ""}${portfolioSummary.totalUnrealizedPL.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Realized Profit/Loss</div>
                  <div className="text-[10px] text-gray-500">(From sold stocks)</div>
                  <div className={`text-xl font-bold ${
                    portfolioSummary.totalRealizedPL >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {portfolioSummary.totalRealizedPL >= 0 ? "+" : ""}${portfolioSummary.totalRealizedPL.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Total Return</div>
                  <div className={`text-xl font-bold ${
                    portfolioSummary.percentChange >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {portfolioSummary.percentChange >= 0 ? "+" : ""}
                    {portfolioSummary.percentChange.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Banking Tab */}
      {activeTab === "bank" && (
        <>
          {/* Bank Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {bankAccount?.balance.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Bank Balance</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {bankAccount?.interestRate || 1}%
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Daily Interest</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {bankAccount?.totalDeposited.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Deposited</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {bankAccount?.totalInterestEarned.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Interest Earned</div>
            </div>
          </div>
          
          {/* Interest Claim */}
          {accountStats && (
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg p-6 mb-8">
              <h3 className="text-2xl font-bold text-black mb-4">💰 Daily Interest</h3>
              <div className="text-black">
                <p className="mb-2">Next interest payment: {accountStats.nextInterestAmount} gold</p>
                <p className="mb-4">Available in: {accountStats.hoursUntilInterest} hours</p>
                <button
                  onClick={handleClaimInterest}
                  className="px-6 py-3 bg-black text-yellow-400 font-bold rounded-lg hover:bg-gray-900 transition-all"
                  disabled={accountStats.hoursUntilInterest > 0}
                >
                  {accountStats.hoursUntilInterest > 0 ? "Not Ready" : "Claim Interest"}
                </button>
              </div>
            </div>
          )}
          
          {/* Deposit and Withdrawal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">DEPOSIT</h2>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full px-4 py-3 bg-gray-900 border border-yellow-500/50 rounded-lg text-white mb-4"
              />
              <div className="text-sm text-gray-400 mb-4">
                Available: {Math.floor(userProfile?.gold || 0).toLocaleString()} gold
              </div>
              <button
                onClick={handleDeposit}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg"
              >
                Deposit Gold
              </button>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">WITHDRAW</h2>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full px-4 py-3 bg-gray-900 border border-yellow-500/50 rounded-lg text-white mb-4"
              />
              <div className="text-sm text-gray-400 mb-4">
                Available: {Math.floor(bankAccount?.balance || 0).toLocaleString()}
              </div>
              <button
                onClick={handleWithdraw}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg"
              >
                Withdraw Gold
              </button>
            </div>
          </div>
          
          {/* Transaction History */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Transaction History</h3>
            <div className="space-y-3">
              {transactions?.map((tx, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div className="text-2xl">
                    {tx.type === "deposit" ? "💰" : 
                     tx.type === "withdraw" ? "💸" :
                     tx.type === "interest_payment" ? "💎" : "📋"}
                  </div>
                  <div className="flex-1">
                    <div className="text-yellow-400 font-semibold">
                      {tx.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${
                    tx.type === "withdraw" ? "text-red-400" : "text-green-400"
                  }`}>
                    {tx.type === "withdraw" ? "-" : "+"}
                    {tx.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}