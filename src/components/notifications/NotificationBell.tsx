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

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
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
  const hasUnread = unreadCount !== undefined && unreadCount > 0;

  return (
    <div ref={bellRef} className="relative">
      {/* Bell button - Space Age Glass Style */}
      <button
        onClick={handleBellClick}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl
          transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: isDropdownOpen
            ? 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.08))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          border: isDropdownOpen
            ? '1px solid rgba(34,211,238,0.4)'
            : '1px solid rgba(255,255,255,0.15)',
          boxShadow: isDropdownOpen
            ? '0 0 20px rgba(34,211,238,0.25), 0 4px 15px rgba(0,0,0,0.3)'
            : hasUnread
              ? '0 0 15px rgba(34,211,238,0.15), 0 4px 15px rgba(0,0,0,0.2)'
              : '0 4px 15px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onMouseEnter={(e) => {
          if (!isDropdownOpen) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))';
            e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(34,211,238,0.2), 0 4px 15px rgba(0,0,0,0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDropdownOpen) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.boxShadow = hasUnread
              ? '0 0 15px rgba(34,211,238,0.15), 0 4px 15px rgba(0,0,0,0.2)'
              : '0 4px 15px rgba(0,0,0,0.2)';
          }
        }}
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg
          className="w-5 h-5 transition-all duration-300"
          style={{
            color: isDropdownOpen || hasUnread ? '#22d3ee' : 'rgba(255,255,255,0.6)',
            filter: isDropdownOpen || hasUnread ? 'drop-shadow(0 0 6px rgba(34,211,238,0.5))' : 'none',
          }}
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

        {/* Badge with cyan glow */}
        {displayCount !== null && hasUnread && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] flex items-center justify-center
              px-1.5 text-[10px] font-bold rounded-full"
            style={{
              background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
              color: '#000',
              boxShadow: '0 0 10px rgba(34,211,238,0.8), 0 0 20px rgba(34,211,238,0.4)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
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
