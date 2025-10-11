'use client';

import { useEffect } from 'react';

interface CustomNotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function CustomNotification({
  message,
  type = 'success',
  duration = 3000,
  onClose
}: CustomNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'from-green-600 to-green-700 border-green-500',
    error: 'from-red-600 to-red-700 border-red-500',
    info: 'from-blue-600 to-blue-700 border-blue-500',
  }[type];

  const icon = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
  }[type];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-slide-down">
      <div className={`bg-gradient-to-r ${bgColor} border-2 text-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)] px-6 py-4 min-w-[300px] max-w-[500px]`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">{icon}</span>
          <p className="text-sm font-medium flex-1">{message}</p>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
