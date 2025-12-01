'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface DebugParamCheckerProps {
  onDebugChange: (isDebug: boolean) => void;
}

export default function DebugParamChecker({ onDebugChange }: DebugParamCheckerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onDebugChange(searchParams.get('debug') === 'true');
  }, [searchParams, onDebugChange]);

  return null;
}
