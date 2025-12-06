'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id, Doc } from '../../../convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import NotificationItem from './NotificationItem';

interface NotificationLightboxProps {
  userId: Id<'users'>;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationLightbox({
  userId,
  isOpen,
  onClose,
}: NotificationLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [allNotifications, setAllNotifications] = useState<Doc<'notifications'>[]>([]);
  const router = useRouter();

  const notificationsResult = useQuery(api.notifications.getAllNotifications, {
    userId,
    cursor,
    limit: 50,
  });

  const markAsRead = useMutation(api.notifications.markAsRead);
  const clearAll = useMutation(api.notifications.clearAllNotifications);

  // Mount state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCursor(undefined);
      setAllNotifications([]);
    }
  }, [isOpen]);

  // Accumulate notifications as we load more
  useEffect(() => {
    if (notificationsResult?.notifications) {
      if (cursor === undefined) {
        // Initial load
        setAllNotifications(notificationsResult.notifications);
      } else {
        // Append more
        setAllNotifications((prev) => [...prev, ...notificationsResult.notifications]);
      }
    }
  }, [notificationsResult, cursor]);

  const handleNotificationClick = async (notification: Doc<'notifications'>) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }

    // Close lightbox
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

  const handleLoadMore = () => {
    if (notificationsResult?.nextCursor) {
      setCursor(notificationsResult.nextCursor);
    }
  };

  const handleClearAll = async () => {
    await clearAll({ userId });
    setAllNotifications([]);
  };

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col
          bg-black/95 border border-yellow-500/40 rounded-lg
          shadow-[0_0_30px_rgba(250,182,23,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/30">
          <h2
            className="text-lg font-bold text-yellow-400 uppercase tracking-wider"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            All Notifications
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400
              hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {allNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-4 opacity-50"
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
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <>
              {allNotifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))}

              {/* Load more button */}
              {notificationsResult?.hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-2 text-sm text-yellow-400 hover:text-yellow-300
                      border border-yellow-500/30 hover:border-yellow-500/50
                      rounded transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {allNotifications.length > 0 && (
          <div className="border-t border-yellow-500/30 p-4 text-center">
            <button
              onClick={handleClearAll}
              className="px-6 py-2 text-sm text-gray-400 hover:text-red-400
                border border-gray-600 hover:border-red-500/50
                rounded transition-colors"
            >
              Clear All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
