'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id, Doc } from '../../../convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  userId: Id<'users'>;
  onClose: () => void;
  onViewAll: () => void;
}

export default function NotificationDropdown({
  userId,
  onClose,
  onViewAll,
}: NotificationDropdownProps) {
  const router = useRouter();
  const notifications = useQuery(api.notifications.getRecentNotifications, {
    userId,
    limit: 5,
  });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const clearAll = useMutation(api.notifications.clearAllNotifications);

  const handleNotificationClick = async (notification: Doc<'notifications'>) => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    onClose();
    if (notification.linkTo) {
      let url = notification.linkTo;
      if (notification.linkParams) {
        const params = new URLSearchParams();
        Object.entries(notification.linkParams).forEach(([key, value]) => {
          params.set(key, String(value));
        });
        url += `?${params.toString()}`;
      }
      router.push(url);
    }
  };

  const handleClearAll = async () => {
    await clearAll({ userId });
  };

  const handleViewAll = () => {
    onViewAll();
  };

  return (
    <div
      className="absolute top-full right-0 mt-2 w-80 max-h-[420px] flex flex-col
        rounded-2xl border border-white/20 z-50 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1) inset, 0 0 40px rgba(34,211,238,0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with glass separator */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        }}
      >
        <h3
          className="text-sm font-semibold uppercase tracking-[0.2em]"
          style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#22d3ee',
            textShadow: '0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.3)',
          }}
        >
          Notifications
        </h3>
        {notifications && notifications.length > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(34,211,238,0.1))',
              color: '#22d3ee',
              border: '1px solid rgba(34,211,238,0.3)',
            }}
          >
            {notifications.length}
          </span>
        )}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto max-h-[280px]">
        {notifications === undefined ? (
          <div className="p-6 text-center">
            <div
              className="w-6 h-6 mx-auto border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"
            />
            <p className="text-white/40 text-sm mt-3">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <p className="text-white/30 text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification: Doc<'notifications'>) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onClick={handleNotificationClick}
              compact
            />
          ))
        )}
      </div>

      {/* Footer actions with glass effect */}
      <div
        className="p-3 flex flex-col gap-2"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        }}
      >
        <button
          onClick={handleViewAll}
          className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-300
            hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(to right, #facc15, #eab308)',
            color: '#000',
            boxShadow: '0 4px 20px rgba(250,204,21,0.3)',
          }}
        >
          View All Notifications
        </button>
        {notifications && notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="w-full py-2 px-3 text-sm rounded-lg transition-all duration-300
              hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
