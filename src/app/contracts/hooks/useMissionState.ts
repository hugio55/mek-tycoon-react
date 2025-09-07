import { useState, useCallback, useEffect } from "react";
import type { Mission, Mek, Contract } from "../types";
import { sampleRewardsWithRates, successMultipliers } from "../constants/missionData";

export interface UseMissionStateOptions {
  initialMeks?: Record<string, Mek[]>;
  dailyVariation?: string;
}

export function useMissionState(options: UseMissionStateOptions = {}) {
  const { initialMeks = {}, dailyVariation = "Acid" } = options;
  
  const [selectedMeks, setSelectedMeks] = useState<Record<string, Mek[]>>(initialMeks);
  const [dailyMeks, setDailyMeks] = useState<Mek[]>([]);
  const [matchedBonuses, setMatchedBonuses] = useState<Record<string, string[]>>({});
  const [animatingSuccess, setAnimatingSuccess] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const createMission = useCallback((
    contract: Contract | null, 
    isGlobal: boolean = false
  ): Mission => {
    const contractId = isGlobal ? 'global' : (contract?.id || 'default');
    const mekSlots = isGlobal ? 6 : (contract?.mekSlots || 2);
    const goldReward = isGlobal ? 250000 : 3500;
    const xpReward = isGlobal ? 5000 : 250;
    const deployFee = isGlobal ? 50000 : 2000;
    const deployFeeType = isGlobal ? "gold" : (contract?.id && contract.id.charCodeAt(0) % 10 > 7) ? "essence" : "gold";
    const deployFeeEssence = deployFeeType === "essence" ? { name: "Paul Essence", amount: 2 } : undefined;
    const expiryHours = isGlobal ? 24 : 2;
    const endTime = currentTime + (expiryHours * 60 * 60 * 1000);
    
    const rewards = isGlobal ? sampleRewardsWithRates.global : sampleRewardsWithRates.regular;
    const multipliers = successMultipliers.slice(0, 10);
    const weaknesses = ["fire", "poison", "electric"];
    
    return {
      id: contractId,
      contractId,
      isGlobal,
      name: contract?.name || (isGlobal ? `Global ${dailyVariation} Event` : 'Mission'),
      mekSlots,
      goldReward,
      xpReward,
      deployFee,
      deployFeeType: deployFeeType as 'gold' | 'essence',
      deployFeeEssence,
      expiryHours,
      endTime,
      rewards: rewards || [],
      weaknesses,
      multipliers,
      selectedMeks: isGlobal ? dailyMeks : (selectedMeks[contractId] || []),
      dailyVariation: isGlobal ? dailyVariation : undefined
    };
  }, [currentTime, dailyMeks, selectedMeks, dailyVariation]);

  const selectMekForMission = useCallback((
    missionId: string, 
    slotIndex: number, 
    mek: Mek | null
  ) => {
    setSelectedMeks(prev => {
      const meks = [...(prev[missionId] || [])];
      if (mek) {
        meks[slotIndex] = mek;
      } else {
        meks.splice(slotIndex, 1);
      }
      return { ...prev, [missionId]: meks };
    });
  }, []);

  const removeMekFromMission = useCallback((
    missionId: string, 
    slotIndex: number
  ) => {
    selectMekForMission(missionId, slotIndex, null);
  }, [selectMekForMission]);

  const calculateSuccessRate = useCallback((mission: Mission): number => {
    const meks = mission.selectedMeks || [];
    const matched = matchedBonuses[mission.id] || [];
    const bonusPercentage = matched.reduce((acc, id) => {
      const mult = successMultipliers.find(m => m.id === id);
      return acc + parseInt(mult?.bonus.replace('+', '').replace('%', '') || '0');
    }, 0);
    
    const baseSuccessRate = (meks.length / mission.mekSlots) * 70;
    return Math.min(100, baseSuccessRate + bonusPercentage);
  }, [matchedBonuses]);

  const animateSuccessRate = useCallback((
    missionId: string, 
    targetRate: number
  ) => {
    const duration = 1000;
    const steps = 30;
    const currentRate = animatingSuccess[missionId] || 0;
    const increment = (targetRate - currentRate) / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setAnimatingSuccess(prev => ({
        ...prev,
        [missionId]: currentRate + (increment * step)
      }));
      
      if (step >= steps) {
        clearInterval(interval);
        setAnimatingSuccess(prev => ({
          ...prev,
          [missionId]: targetRate
        }));
      }
    }, duration / steps);
  }, [animatingSuccess]);

  const deployMission = useCallback((mission: Mission) => {
    // Here you would typically make an API call to deploy the mission
    console.log('Deploying mission:', mission.id, 'with meks:', mission.selectedMeks);
    
    // Reset the mission's meks after deployment
    setSelectedMeks(prev => ({
      ...prev,
      [mission.id]: []
    }));
    
    // Reset animation state
    setAnimatingSuccess(prev => ({
      ...prev,
      [mission.id]: 0
    }));
  }, []);

  const updateMatchedBonuses = useCallback((
    missionId: string, 
    bonuses: string[]
  ) => {
    setMatchedBonuses(prev => ({
      ...prev,
      [missionId]: bonuses
    }));
  }, []);

  return {
    selectedMeks,
    dailyMeks,
    matchedBonuses,
    animatingSuccess,
    currentTime,
    setDailyMeks,
    createMission,
    selectMekForMission,
    removeMekFromMission,
    calculateSuccessRate,
    animateSuccessRate,
    deployMission,
    updateMatchedBonuses
  };
}