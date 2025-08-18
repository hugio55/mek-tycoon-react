"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function BankPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [goldInBank, setGoldInBank] = useState(15420);
  const [currentPage, setCurrentPage] = useState(1);
  
  const interestRate = 3.2; // percentage per day
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  // Get user profile
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  // Calculate expected returns
  const calculateReturns = (amount: string) => {
    const value = parseFloat(amount) || 0;
    const dailyInterest = value * (interestRate / 100);
    const mekXp = Math.floor(dailyInterest * 0.5);
    const talentXp = Math.floor(dailyInterest * 0.3);
    return { interest: dailyInterest, mekXp, talentXp };
  };
  
  const expectedReturns = calculateReturns(depositAmount);
  
  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (amount > 0 && userProfile && amount <= userProfile.gold) {
      setGoldInBank(prev => prev + amount);
      setDepositAmount("");
      alert(`Deposited ${amount} gold successfully!`);
    }
  };
  
  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= goldInBank) {
      setGoldInBank(prev => prev - amount);
      setWithdrawAmount("");
      alert(`Withdrew ${amount} gold successfully!`);
    }
  };
  
  const transactions = [
    { type: "deposit", amount: 1500, date: "Dec 10, 2024", time: "2:45 PM" },
    { type: "withdraw", amount: 800, date: "Dec 9, 2024", time: "11:20 AM" },
    { type: "deposit", amount: 1000, date: "Dec 8, 2024", time: "6:30 PM" },
    { type: "withdraw", amount: 2200, date: "Dec 7, 2024", time: "3:15 PM" },
    { type: "deposit", amount: 3000, date: "Dec 6, 2024", time: "9:45 AM" },
  ];
  
  return (
    <div className="text-white py-8">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
        🏦 Mek Tycoon Bank
      </h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{interestRate}%/day</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Current Interest Rate</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{goldInBank.toLocaleString()}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Gold in Bank</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">80 XP/day</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Daily XP Income</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">15,000</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Mek XP</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">9,233</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Talent Tree XP</div>
        </div>
      </div>
      
      {/* How Bank Loans Work */}
      <div className="bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg p-6 mb-8">
        <h3 className="text-2xl font-bold text-black mb-4">💡 How Bank Loans Work</h3>
        <div className="text-black space-y-1">
          <p>• Deposit gold to earn daily interest</p>
          <p>• Interest converts to XP for your meks and talent tree</p>
          <p>• Interest rates change based on market conditions</p>
          <p>• Withdraw your deposit anytime (no penalties)</p>
        </div>
      </div>
      
      {/* Deposit and Withdrawal Interface */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Deposit */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col">
          <h2 className="text-xl font-bold text-yellow-400 text-center mb-6">DEPOSIT</h2>
          
          <div className="mb-4">
            <label className="block text-yellow-400 font-bold mb-2">Deposit Amount:</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter gold amount..."
              className="w-full px-4 py-3 bg-gray-900 border border-yellow-500/50 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>
          
          <div className="bg-yellow-500/10 rounded-lg p-4 mb-6">
            <div className="text-yellow-400 font-bold mb-2">Expected Daily Returns:</div>
            <div className="text-gray-300 space-y-1 text-sm">
              <div>• Mek XP: <span className="text-yellow-400">{expectedReturns.mekXp}</span> XP/day</div>
              <div>• Talent Tree XP: <span className="text-yellow-400">{expectedReturns.talentXp}</span> XP/day</div>
              <div>• Total Interest: <span className="text-yellow-400">{expectedReturns.interest.toFixed(1)}</span> gold/day</div>
            </div>
          </div>
          
          <button
            onClick={handleDeposit}
            className="mt-auto w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all"
          >
            Deposit Gold
          </button>
        </div>
        
        {/* Withdrawal */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col">
          <h2 className="text-xl font-bold text-yellow-400 text-center mb-6">WITHDRAWAL</h2>
          
          <div className="mb-4">
            <label className="block text-yellow-400 font-bold mb-2">Withdrawal Amount:</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter gold amount..."
              className="w-full px-4 py-3 bg-gray-900 border border-yellow-500/50 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>
          
          <div className="bg-yellow-500/10 rounded-lg p-4 mb-6">
            <div className="text-yellow-400 font-bold mb-2">Available to Withdraw:</div>
            <div className="text-yellow-400 text-3xl font-bold mb-2">{goldInBank.toLocaleString()}</div>
            <div className="text-gray-400 space-y-1 text-sm">
              <div>• Instant withdrawal</div>
              <div>• No fees or penalties</div>
            </div>
          </div>
          
          <button
            onClick={handleWithdraw}
            className="mt-auto w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all"
          >
            Withdraw Gold
          </button>
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-6">📋 Transaction History</h3>
        
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
              <div className="text-2xl">
                {tx.type === "deposit" ? "💰" : "💸"}
              </div>
              <div className="flex-1">
                <div className="text-yellow-400 font-semibold capitalize">{tx.type}</div>
                <div className="text-sm text-gray-400">{tx.date} • {tx.time}</div>
              </div>
              <div className={`text-xl font-bold ${tx.type === "deposit" ? "text-yellow-400" : "text-white"}`}>
                {tx.type === "deposit" ? "+" : "-"}{tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center items-center gap-4 mt-6">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <span className="text-yellow-400">Page {currentPage} of 3</span>
          <button 
            onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}