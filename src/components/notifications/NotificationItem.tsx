'use client';

import { Doc } from '../../../convex/_generated/dataModel';

interface NotificationItemProps {
  notification: Doc<'notifications'>;
  onClick: (notification: Doc<'notifications'>) => void;
  compact?: boolean;
}

// Format relative time (e.g., "2 min ago", "1 hour ago", "Dec 5")
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
        flex items-start gap-3 p-3 cursor-pointer transition-all duration-200
        hover:bg-yellow-500/10 border-b border-yellow-500/20 last:border-b-0
        ${isUnread ? 'bg-yellow-500/5' : ''}
        ${compact ? 'py-2' : 'py-3'}
      `}
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 mt-1.5">
        {isUnread ? (
          <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,182,23,0.6)]" />
        ) : (
          <div className="w-2 h-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`
              text-sm font-medium truncate
              ${isUnread ? 'text-yellow-400' : 'text-gray-300'}
            `}
          >
            {notification.title}
          </h4>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        {notification.subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
            {notification.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
