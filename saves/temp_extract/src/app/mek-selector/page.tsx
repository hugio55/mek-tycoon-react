"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function MekSelectorPage() {
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedMeks, setSelectedMeks] = useState<number[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Generate demo meks grid
  const mekGrid = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    number: i * 111,
    image: `/mek-images/150px/${String(i).repeat(3)}-${String(i).repeat(3)}-${String(i).repeat(3)}.webp`
  }));
  
  const handleGo = () => {
    setIsSelecting(true);
    // Simulate random selection
    const interval = setInterval(() => {
      const randomMek = Math.floor(Math.random() * 10);
      setSelectedMeks([randomMek]);
    }, 100);
    
    setTimeout(() => {
      clearInterval(interval);
      setIsSelecting(false);
      // Final selection
      const finalMeks = Array.from({ length: selectedCount }, () => 
        Math.floor(Math.random() * 10)
      );
      setSelectedMeks(finalMeks);
    }, 3000);
  };
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Yellow gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
        
        {/* Static stars - no dynamic generation to ensure they render */}
        <div className="absolute inset-0">
          {/* Large stars */}
          <div className="absolute top-10 left-20 w-2 h-2 bg-white rounded-full opacity-80 animate-pulse" />
          <div className="absolute top-32 right-40 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white rounded-full opacity-75 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-40 right-20 w-2 h-2 bg-white rounded-full opacity-65 animate-pulse" style={{ animationDelay: '1.5s' }} />
          
          {/* Medium stars */}
          <div className="absolute top-1/4 left-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-50 animate-pulse" />
          <div className="absolute bottom-1/3 left-10 w-1.5 h-1.5 bg-white rounded-full opacity-55 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-45 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-20 left-3/4 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-10 right-2/3 w-1.5 h-1.5 bg-white rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }} />
          
          {/* Small stars */}
          <div className="absolute top-16 left-1/3 w-1 h-1 bg-white rounded-full opacity-40" />
          <div className="absolute top-40 right-16 w-1 h-1 bg-white rounded-full opacity-35" />
          <div className="absolute bottom-32 left-2/3 w-1 h-1 bg-white rounded-full opacity-45" />
          <div className="absolute top-2/3 left-16 w-1 h-1 bg-white rounded-full opacity-30" />
          <div className="absolute bottom-16 right-1/2 w-1 h-1 bg-white rounded-full opacity-40" />
          <div className="absolute top-1/3 right-2/3 w-1 h-1 bg-white rounded-full opacity-35" />
          <div className="absolute bottom-2/3 right-10 w-1 h-1 bg-white rounded-full opacity-45" />
          <div className="absolute top-3/4 left-1/4 w-1 h-1 bg-white rounded-full opacity-30" />
          
          {/* Yellow stars */}
          <div className="absolute top-24 right-1/3 w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1.2s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.8s' }} />
          <div className="absolute top-1/2 left-2/3 w-1 h-1 bg-yellow-400 rounded-full opacity-40" />
          <div className="absolute bottom-1/2 right-1/4 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-45 animate-pulse" style={{ animationDelay: '1.8s' }} />
          
          {/* More scattered stars */}
          <div className="absolute" style={{ top: '5%', left: '10%' }}>
            <div className="w-1 h-1 bg-white rounded-full opacity-30" />
          </div>
          <div className="absolute" style={{ top: '15%', left: '85%' }}>
            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50 animate-pulse" />
          </div>
          <div className="absolute" style={{ top: '25%', left: '45%' }}>
            <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-40" />
          </div>
          <div className="absolute" style={{ top: '35%', left: '70%' }}>
            <div className="w-1 h-1 bg-white rounded-full opacity-35" />
          </div>
          <div className="absolute" style={{ top: '45%', left: '15%' }}>
            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-55 animate-pulse" style={{ animationDelay: '1.3s' }} />
          </div>
          <div className="absolute" style={{ top: '55%', left: '90%' }}>
            <div className="w-1 h-1 bg-white rounded-full opacity-40" />
          </div>
          <div className="absolute" style={{ top: '65%', left: '35%' }}>
            <div className="w-2 h-2 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }} />
          </div>
          <div className="absolute" style={{ top: '75%', left: '60%' }}>
            <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-45" />
          </div>
          <div className="absolute" style={{ top: '85%', left: '25%' }}>
            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1.6s' }} />
          </div>
          <div className="absolute" style={{ top: '95%', left: '80%' }}>
            <div className="w-1 h-1 bg-white rounded-full opacity-35" />
          </div>
          <div className="absolute" style={{ top: '8%', left: '55%' }}>
            <div className="w-1 h-1 bg-white rounded-full opacity-30" />
          </div>
          <div className="absolute" style={{ top: '18%', left: '30%' }}>
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2.1s' }} />
          </div>
          <div className="absolute" style={{ top: '28%', left: '75%' }}>
            <div className="w-1 h-1 bg-white rounded-full opacity-40" />
          </div>
          <div className="absolute" style={{ top: '38%', left: '5%' }}>
            <div className="w-2 h-2 bg-white rounded-full opacity-65 animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
          <div className="absolute" style={{ top: '48%', left: '95%' }}>
            <div className="w-1 h-1 bg-white rounded-full opacity-35" />
          </div>
          <div className="absolute" style={{ top: '58%', left: '40%' }}>
            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-55 animate-pulse" style={{ animationDelay: '1.1s' }} />
          </div>
          <div className="absolute" style={{ top: '68%', left: '65%' }}>
            <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-40" />
          </div>
          <div className="absolute" style={{ top: '78%', left: '20%' }}>
            <div className="w-1 h-1 bg-white rounded-full opacity-30" />
          </div>
          <div className="absolute" style={{ top: '88%', left: '50%' }}>
            <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1.9s' }} />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-yellow-400 text-center mb-8">
            MEK SELECTOR
          </h1>
          
          {/* Count Selection Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setSelectedCount(1)}
              className={`px-4 py-2 rounded transition-all ${
                selectedCount === 1 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              1 Mek
            </button>
            <button
              onClick={() => setSelectedCount(3)}
              className={`px-4 py-2 rounded transition-all ${
                selectedCount === 3 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              3 Meks
            </button>
            <button
              onClick={() => setSelectedCount(10)}
              className={`px-4 py-2 rounded transition-all ${
                selectedCount === 10 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              10 Meks
            </button>
            <button
              onClick={() => setSelectedCount(30)}
              className={`px-4 py-2 rounded transition-all ${
                selectedCount === 30 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              30 Meks
            </button>
            <button
              onClick={() => setSelectedCount(100)}
              className={`px-4 py-2 rounded transition-all ${
                selectedCount === 100 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              100 Meks
            </button>
          </div>
          
          {/* GO Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={handleGo}
              disabled={isSelecting}
              className={`px-8 py-4 text-2xl font-bold rounded-lg transition-all ${
                isSelecting 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-500 hover:scale-105'
              }`}
            >
              {isSelecting ? 'SELECTING...' : 'GO!'}
            </button>
          </div>
          
          {/* Mek Grid */}
          <div className="grid grid-cols-5 gap-4">
            {mekGrid.map((mek) => (
              <div
                key={mek.id}
                className={`relative border-2 rounded-lg overflow-hidden transition-all duration-100 ${
                  selectedMeks.includes(mek.id) 
                    ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 scale-105' 
                    : 'border-gray-700'
                }`}
              >
                <img
                  src={mek.image}
                  alt={`Mek ${mek.id + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/meks/placeholder.png';
                  }}
                />
                {selectedMeks.includes(mek.id) && (
                  <div className="absolute inset-0 bg-yellow-400/20 pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}