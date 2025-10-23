"use client";

import { memo } from "react";

interface EssenceAmountDisplayProps {
  amount: number;
  precision?: number; // Default: 2
  className?: string;
  showIntegerPart?: boolean; // Default: true
  showDecimalPart?: boolean; // Default: true
  integerClassName?: string;
  decimalClassName?: string;
}

/**
 * Display essence amount with variable precision
 * Can show 2, 5, 6, 10, or even 15 decimal places
 */
export const EssenceAmountDisplay = memo(function EssenceAmountDisplay({
  amount,
  precision = 2,
  className = "",
  showIntegerPart = true,
  showDecimalPart = true,
  integerClassName = "",
  decimalClassName = "opacity-70"
}: EssenceAmountDisplayProps) {

  // Split into integer and decimal parts
  const integerPart = Math.floor(amount);
  const decimalPart = amount % 1;

  // Format decimal part with specified precision
  const decimalString = decimalPart
    .toFixed(precision)
    .substring(2); // Remove "0."

  if (!showDecimalPart) {
    // Just show integer
    return (
      <span className={className}>
        {integerPart.toLocaleString('en-US')}
      </span>
    );
  }

  if (!showIntegerPart) {
    // Just show decimal
    return (
      <span className={className}>
        .{decimalString}
      </span>
    );
  }

  // Show both parts
  return (
    <span className={className}>
      <span className={integerClassName}>
        {integerPart.toLocaleString('en-US')}
      </span>
      <span className={decimalClassName}>
        .{decimalString}
      </span>
    </span>
  );
});

/**
 * High-precision live tracker (10-15 decimals)
 * Shows fast-moving numbers at high precision
 */
export const EssenceLiveTracker = memo(function EssenceLiveTracker({
  amount,
  precision = 12,
  className = "font-mono text-cyan-400",
}: {
  amount: number;
  precision?: number;
  className?: string;
}) {
  return (
    <div className={className} style={{
      textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
      fontVariantNumeric: 'tabular-nums'
    }}>
      {amount.toFixed(precision)}
    </div>
  );
});

/**
 * Standard display (2-3 decimals for most UI)
 */
export const EssenceStandardDisplay = memo(function EssenceStandardDisplay({
  amount,
  className = "text-yellow-400 font-bold",
}: {
  amount: number;
  className?: string;
}) {
  return (
    <EssenceAmountDisplay
      amount={amount}
      precision={2}
      className={className}
    />
  );
});

/**
 * Detailed display (5-6 decimals for detailed views)
 */
export const EssenceDetailedDisplay = memo(function EssenceDetailedDisplay({
  amount,
  precision = 6,
  className = "text-cyan-400",
}: {
  amount: number;
  precision?: number;
  className?: string;
}) {
  return (
    <EssenceAmountDisplay
      amount={amount}
      precision={precision}
      className={`font-mono ${className}`}
    />
  );
});
