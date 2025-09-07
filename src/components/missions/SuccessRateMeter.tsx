"use client";

interface SuccessRateMeterProps {
  successRate: number;
  targetRate?: number;
  variant?: "default" | "compact" | "detailed" | "minimal";
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export default function SuccessRateMeter({
  successRate,
  targetRate,
  variant = "default",
  showPercentage = true,
  animated = true,
  className = ""
}: SuccessRateMeterProps) {
  const getColorClass = (rate: number) => {
    if (rate >= 80) return 'from-green-500 to-emerald-400';
    if (rate >= 60) return 'from-yellow-500 to-amber-400';
    if (rate >= 40) return 'from-orange-500 to-red-400';
    return 'from-red-600 to-red-500';
  };

  const getStatusText = (rate: number) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    if (rate >= 40) return 'Fair';
    if (rate >= 20) return 'Poor';
    return 'Critical';
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-yellow-400';
    if (rate >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getColorClass(successRate)} ${animated ? 'transition-all duration-300' : ''}`}
            style={{ width: `${successRate}%` }}
          />
        </div>
        {showPercentage && (
          <span className={`text-xs font-bold ${getStatusColor(successRate)}`}>
            {Math.round(successRate)}%
          </span>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={className}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Success Rate</span>
          {showPercentage && (
            <span className={`text-sm font-bold ${getStatusColor(successRate)}`}>
              {Math.round(successRate)}%
            </span>
          )}
        </div>
        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getColorClass(successRate)} ${animated ? 'transition-all duration-300' : ''}`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`bg-black/30 rounded-lg p-3 ${className}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Mission Success Rate</div>
            <div className={`text-xs ${getStatusColor(successRate)} mt-1`}>
              Status: {getStatusText(successRate)}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getStatusColor(successRate)}`}>
              {Math.round(successRate)}%
            </div>
            {targetRate && targetRate !== successRate && (
              <div className="text-xs text-gray-500">
                Target: {Math.round(targetRate)}%
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <div className="h-3 bg-black/40 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getColorClass(successRate)} ${animated ? 'transition-all duration-500' : ''} relative`}
              style={{ width: `${successRate}%` }}
            >
              {animated && successRate > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              )}
            </div>
          </div>
          {targetRate && targetRate !== successRate && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/50"
              style={{ left: `${targetRate}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">Success Chance</span>
        {showPercentage && (
          <span className={`text-sm font-bold ${getStatusColor(successRate)}`}>
            {Math.round(successRate)}%
          </span>
        )}
      </div>
      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${getColorClass(successRate)} ${animated ? 'transition-all duration-300' : ''}`}
          style={{ width: `${successRate}%` }}
        />
      </div>
      {targetRate && targetRate !== successRate && (
        <div className="text-xs text-gray-500 mt-1">
          Potential: {Math.round(targetRate)}%
        </div>
      )}
    </div>
  );
}