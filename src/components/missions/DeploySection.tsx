"use client";

import type { Mission } from "@/app/contracts/types";
import { formatGoldAmount } from "@/app/contracts/utils/helpers";

interface DeploySectionProps {
  mission: Mission;
  onDeploy?: () => void;
  disabled?: boolean;
  variant?: "default" | "compact" | "expanded" | "inline" | "detailed";
  className?: string;
}

export default function DeploySection({
  mission,
  onDeploy,
  disabled = false,
  variant = "default",
  className = ""
}: DeploySectionProps) {
  const isEssenceFee = mission.deployFeeType === "essence";
  
  const getFeeDisplay = () => {
    if (isEssenceFee && mission.deployFeeEssence) {
      return `${mission.deployFeeEssence.name}: ${mission.deployFeeEssence.amount}`;
    }
    return `${formatGoldAmount(mission.deployFee)} Gold`;
  };

  const getButtonText = () => {
    if (disabled) return "SELECT MEKS FIRST";
    if (variant === "compact") return "DEPLOY";
    if (variant === "inline") return `Deploy · ${getFeeDisplay()}`;
    return "DEPLOY SQUAD";
  };

  const getButtonClasses = () => {
    const base = "font-medium transition-all";
    const state = disabled 
      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed" 
      : "bg-gradient-to-r from-green-600/80 to-emerald-500/80 hover:from-green-500/80 hover:to-emerald-400/80 text-white cursor-pointer transform hover:scale-105";
    
    if (variant === "compact") return `${base} ${state} px-4 py-1.5 text-sm rounded`;
    if (variant === "inline") return `${base} ${state} px-6 py-2 text-sm rounded-lg`;
    if (variant === "expanded") return `${base} ${state} px-8 py-3 text-base rounded-xl`;
    return `${base} ${state} px-6 py-2.5 text-sm rounded-lg`;
  };

  if (variant === "inline") {
    return (
      <button 
        onClick={onDeploy}
        disabled={disabled}
        className={`${getButtonClasses()} ${className}`}
      >
        {getButtonText()}
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="text-xs text-red-400">
          Fee: {getFeeDisplay()}
        </div>
        <button 
          onClick={onDeploy}
          disabled={disabled}
          className={getButtonClasses()}
        >
          {getButtonText()}
        </button>
      </div>
    );
  }

  if (variant === "expanded") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-4 border border-red-500/20">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-red-300/70 uppercase tracking-wider mb-1">Deployment Fee</div>
              <div className="text-lg font-bold text-red-400">
                {getFeeDisplay()}
              </div>
            </div>
            {!isEssenceFee && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Per Mek</div>
                <div className="text-sm text-gray-400">
                  {formatGoldAmount(Math.round(mission.deployFee / mission.mekSlots))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={onDeploy}
          disabled={disabled}
          className={`w-full ${getButtonClasses()}`}
        >
          <span className="flex items-center justify-center gap-2">
            {!disabled && <span className="text-xl">🚀</span>}
            {getButtonText()}
          </span>
        </button>
        
        {disabled && (
          <div className="text-xs text-center text-gray-500">
            Add at least one Mek to deploy this mission
          </div>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-xs text-gray-400 mb-2">
          Deployment Fee: <span className="text-yellow-400 font-bold">{getFeeDisplay()}</span>
        </div>
        <button 
          onClick={onDeploy}
          disabled={disabled}
          className="px-12 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-500 rounded font-bold text-base uppercase tracking-wider transition-all shadow-lg hover:shadow-yellow-500/30 disabled:shadow-none"
        >
          {disabled ? "SELECT MEKS FIRST" : "DEPLOY"}
        </button>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="bg-red-900/20 rounded-lg px-4 py-2.5 border border-red-500/30">
        <div className="text-[10px] text-red-300/70 uppercase">Fee</div>
        <div className="text-sm font-medium text-red-400">
          {getFeeDisplay()}
        </div>
      </div>
      <button 
        onClick={onDeploy}
        disabled={disabled}
        className={`flex-1 ${getButtonClasses()}`}
      >
        {getButtonText()}
      </button>
    </div>
  );
}