"use client";

import type { Mission } from "@/app/contracts/types";
import { formatCountdown } from "@/app/contracts/utils/helpers";

interface MissionHeaderProps {
  mission: Mission;
  currentTime?: number;
  variant?: "default" | "compact" | "expanded";
  className?: string;
}

export default function MissionHeader({
  mission,
  currentTime = Date.now(),
  variant = "default",
  className = ""
}: MissionHeaderProps) {
  const timeRemaining = mission.endTime - currentTime;
  const isExpiring = timeRemaining < 30 * 60 * 1000; // Less than 30 minutes

  if (variant === "compact") {
    return (
      <div className={`flex justify-between items-center ${className}`}>
        <h3 className="text-sm font-medium text-yellow-400">
          {mission.isGlobal 
            ? `GLOBAL ${mission.dailyVariation?.toUpperCase()} EVENT` 
            : mission.name?.toUpperCase() || 'MISSION'
          }
        </h3>
        <span className={`text-xs ${isExpiring ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
          {formatCountdown(mission.endTime)}
        </span>
      </div>
    );
  }

  if (variant === "expanded") {
    return (
      <div className={`${className}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-yellow-400 mb-1">
              {mission.isGlobal 
                ? `Global ${mission.dailyVariation?.toLowerCase()} Event` 
                : mission.name?.toLowerCase() || 'Mission'
              }
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-gray-400">
                Type: <span className="text-yellow-400">
                  {mission.isGlobal ? 'Global Event' : 'Contract Mission'}
                </span>
              </div>
              <div className="text-gray-400">
                Slots: <span className="text-yellow-400">{mission.mekSlots}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Time Remaining</div>
            <div className={`text-lg font-mono ${isExpiring ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
              {formatCountdown(mission.endTime)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex justify-between items-start ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-yellow-400">
          {mission.isGlobal 
            ? `global ${mission.dailyVariation?.toLowerCase()} event` 
            : mission.name?.toLowerCase() || 'mission'
          }
        </h3>
        <div className="text-xs text-gray-400 mt-1">
          Expires: <span className={isExpiring ? 'text-red-400' : 'text-yellow-400'}>
            {formatCountdown(mission.endTime)}
          </span>
        </div>
      </div>
      {mission.isGlobal && (
        <div className="bg-gradient-to-r from-purple-600/20 to-yellow-600/20 px-3 py-1 rounded-full">
          <span className="text-xs font-semibold text-yellow-400">GLOBAL</span>
        </div>
      )}
    </div>
  );
}