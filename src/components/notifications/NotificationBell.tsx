'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import NotificationDropdown from './NotificationDropdown';
import NotificationLightbox from './NotificationLightbox';

interface NotificationBellProps {
  userId: Id<'users'>;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const unreadCount = useQuery(api.notifications.getUnreadCount, { userId });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleViewAll = () => {
    setIsDropdownOpen(false);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  const displayCount = unreadCount !== undefined ? (unreadCount > 9 ? '9+' : unreadCount) : null;

  return (
    <div ref={bellRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className={`
          relative flex items-center justify-center w-9 h-9 rounded-lg
          transition-all duration-200
          ${isDropdownOpen
            ? 'bg-yellow-500/20 border-yellow-500/50'
            : 'bg-black/40 hover:bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
          }
          border backdrop-blur-sm
        `}
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg
          className={`w-5 h-5 transition-colors ${
            isDropdownOpen || (unreadCount && unreadCount > 0)
              ? 'text-yellow-400'
              : 'text-gray-400 group-hover:text-yellow-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {displayCount !== null && unreadCount !== undefined && unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center
              px-1 text-[10px] font-bold text-black bg-yellow-400 rounded-full
              shadow-[0_0_8px_rgba(250,182,23,0.6)] animate-pulse"
          >
            {displayCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <NotificationDropdown
          userId={userId}
          onClose={handleCloseDropdown}
          onViewAll={handleViewAll}
        />
      )}

      {/* Lightbox */}
      <NotificationLightbox
        userId={userId}
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
      />
    </div>
  );
}
