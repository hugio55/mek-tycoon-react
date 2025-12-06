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
    limit: 10,
  });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const clearAll = useMutation(api.notifications.clearAllNotifications);

  const handleNotificationClick = async (notification: Doc<'notifications'>) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }

    // Close dropdown
    onClose();

    // Navigate if linkTo is provided
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
      className="absolute top-full right-0 mt-2 w-80 max-h-[400px] flex flex-col
        bg-black/95 backdrop-blur-md border border-yellow-500/30 rounded-lg
        shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-500/30">
        <h3
          className="text-sm font-semibold text-yellow-400 uppercase tracking-wider"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          Notifications
        </h3>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto max-h-[280px]">
        {notifications === undefined ? (
          <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onClick={handleNotificationClick}
              compact
            />
          ))
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-yellow-500/30 p-2 flex flex-col gap-1">
        <button
          onClick={handleViewAll}
          className="w-full py-2 px-3 text-sm text-yellow-400 hover:bg-yellow-500/10
            transition-colors rounded font-medium"
        >
          View All Notifications
        </button>
        {notifications && notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="w-full py-2 px-3 text-sm text-gray-400 hover:text-red-400
              hover:bg-red-500/10 transition-colors rounded"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
