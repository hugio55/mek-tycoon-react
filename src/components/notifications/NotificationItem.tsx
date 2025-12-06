'use client';

import { Doc } from '../../../convex/_generated/dataModel';

interface NotificationItemProps {
  notification: Doc<'notifications'>;
  onClick: (notification: Doc<'notifications'>) => void;
  compact?: boolean;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} min ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export default function NotificationItem({
  notification,
  onClick,
  compact = false,
}: NotificationItemProps) {
  const isUnread = !notification.isRead;

  return (
    <div
      onClick={() => onClick(notification)}
      className={`
        group relative flex items-start gap-3 cursor-pointer transition-all duration-300
        ${compact ? 'px-4 py-3' : 'px-5 py-4'}
      `}
      style={{
        background: isUnread
          ? 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 100%)'
          : 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isUnread
          ? 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(34,211,238,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isUnread
          ? 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 100%)'
          : 'transparent';
      }}
    >
      {/* Unread indicator with glow */}
      <div className="flex-shrink-0 mt-1.5">
        {isUnread ? (
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
              boxShadow: '0 0 8px rgba(34,211,238,0.8), 0 0 16px rgba(34,211,238,0.4)',
            }}
          />
        ) : (
          <div className="w-2.5 h-2.5" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h4
            className={`text-sm font-medium truncate transition-all duration-300 ${
              compact ? 'max-w-[180px]' : ''
            }`}
            style={{
              color: isUnread ? '#22d3ee' : 'rgba(255,255,255,0.7)',
              textShadow: isUnread ? '0 0 10px rgba(34,211,238,0.4)' : 'none',
            }}
          >
            {notification.title}
          </h4>
          <span
            className="text-xs flex-shrink-0 transition-colors duration-300"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        {notification.subtitle && (
          <p
            className={`text-xs mt-1 transition-colors duration-300 ${
              compact ? 'line-clamp-1' : 'line-clamp-2'
            }`}
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            {notification.subtitle}
          </p>
        )}

        {/* Link indicator on hover */}
        {notification.linkTo && (
          <div
            className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1"
            style={{ color: 'rgba(250,204,21,0.7)' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span className="text-xs">Click to view</span>
          </div>
        )}
      </div>

      {/* Hover glow effect overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.03) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}
