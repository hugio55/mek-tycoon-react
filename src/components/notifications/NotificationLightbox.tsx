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
    limit: 10,
  });

  const markAsRead = useMutation(api.notifications.markAsRead);
  const clearAll = useMutation(api.notifications.clearAllNotifications);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll and handle Escape key when open
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscapeKey);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setCursor(undefined);
      setAllNotifications([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (notificationsResult?.notifications) {
      if (cursor === undefined) {
        setAllNotifications(notificationsResult.notifications);
      } else {
        setAllNotifications((prev) => [...prev, ...notificationsResult.notifications]);
      }
    }
  }, [notificationsResult, cursor]);

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
      {/* Backdrop with heavy blur */}
      <div
        className="absolute inset-0 bg-black/70"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      />

      {/* Modal - Glass container */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/15 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 1px rgba(255,255,255,0.15) inset, 0 0 60px rgba(34,211,238,0.08)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with cyan glow */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Bell icon with glow */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.05))',
                border: '1px solid rgba(34,211,238,0.3)',
                boxShadow: '0 0 20px rgba(34,211,238,0.2)',
              }}
            >
              <svg className="w-5 h-5" style={{ color: '#22d3ee' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-lg font-semibold uppercase tracking-[0.15em]"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  color: '#22d3ee',
                  textShadow: '0 0 25px rgba(34, 211, 238, 0.7), 0 0 50px rgba(34, 211, 238, 0.4)',
                }}
              >
                All Notifications
              </h2>
              <p className="text-white/40 text-sm mt-0.5">
                {allNotifications.length} notification{allNotifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
              hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))';
            }}
          >
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {allNotifications.length === 0 ? (
            <div className="p-16 text-center">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <svg className="w-12 h-12 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <p className="text-white/30 text-lg font-light">No notifications yet</p>
              <p className="text-white/20 text-sm mt-2">When you receive notifications, they will appear here</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                {allNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>

              {/* Load more button */}
              {notificationsResult?.hasMore && (
                <div className="p-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="px-8 py-3 text-sm font-medium rounded-xl transition-all duration-300
                      hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))',
                      border: '1px solid rgba(34,211,238,0.3)',
                      color: '#22d3ee',
                      boxShadow: '0 4px 20px rgba(34,211,238,0.15)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(34,211,238,0.1))';
                      e.currentTarget.style.boxShadow = '0 4px 30px rgba(34,211,238,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(34,211,238,0.15)';
                    }}
                  >
                    Load More Notifications
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {allNotifications.length > 0 && (
          <div
            className="p-5 flex items-center justify-between"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            }}
          >
            <p className="text-white/30 text-sm">
              Showing {allNotifications.length} of max 100
            </p>
            <button
              onClick={handleClearAll}
              className="px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300
                hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(239,68,68,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))';
                e.currentTarget.style.boxShadow = 'none';
              }}
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
