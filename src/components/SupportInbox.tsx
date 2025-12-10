'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getMediaUrl } from '@/lib/media-url';

// Support chat identifier - must match convex/messaging.ts
const SUPPORT_WALLET_ID = "SUPPORT_OVEREXPOSED";

// Sample Mek images for random profile pictures
const SAMPLE_MEK_IMAGES = [
  'aa1-aa1-cd1.webp', 'bc2-dm1-ap1.webp', 'dp2-bf4-il2.webp', 'hb1-gn1-hn1.webp',
  'aa1-ak1-de1.webp', 'bc2-ee1-bc1.webp', 'dp2-bj2-da1.webp', 'hb1-hp1-aj1.webp',
  'aa1-bf2-ap2.webp', 'bc2-gn2-eh1.webp', 'dp2-dm1-fb2.webp', 'hb2-aa1-gk2.webp',
];

// Deterministic random image based on wallet address
function getMekImageForWallet(walletAddress: string): string {
  let hash = 0;
  for (let i = 0; i < walletAddress.length; i++) {
    hash = ((hash << 5) - hash) + walletAddress.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % SAMPLE_MEK_IMAGES.length;
  return SAMPLE_MEK_IMAGES[index];
}

// Character limit
const MAX_MESSAGE_LENGTH = 2000;

// Format relative timestamp
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  const date = new Date(timestamp);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return `${month} ${day}, ${year} at ${time}`;
}

interface SupportInboxProps {
  messageTarget?: { walletAddress: string; corporationName: string } | null;
  onClearMessageTarget?: () => void;
}

export default function SupportInbox({
  messageTarget,
  onClearMessageTarget,
}: SupportInboxProps) {
  // State
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; filename: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const supportConversations = useQuery(api.messaging.getAllSupportConversations);
  const totalSupportUnread = useQuery(api.messaging.getSupportUnreadCount);

  const messages = useQuery(
    api.messaging.getMessagesAdmin,
    selectedConversationId ? { conversationId: selectedConversationId } : 'skip'
  );

  // Mutations
  const sendSupportMessage = useMutation(api.messaging.sendSupportMessage);
  const markSupportAsRead = useMutation(api.messaging.markSupportConversationAsRead);
  const createSupportConversation = useMutation(api.messaging.createSupportConversation);

  // Mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle messageTarget from Player Management
  useEffect(() => {
    if (messageTarget && supportConversations) {
      const handleMessageTarget = async () => {
        try {
          // Create or get the support conversation for this player
          const result = await createSupportConversation({
            walletAddress: messageTarget.walletAddress,
          });

          if (result.success && result.conversationId) {
            // Select this conversation
            setSelectedConversationId(result.conversationId);
          }

          // Clear the target after handling
          if (onClearMessageTarget) {
            onClearMessageTarget();
          }
        } catch (error) {
          console.error('Failed to create/open support conversation:', error);
          // Still clear the target on error
          if (onClearMessageTarget) {
            onClearMessageTarget();
          }
        }
      };

      handleMessageTarget();
    }
  }, [messageTarget, supportConversations, createSupportConversation, onClearMessageTarget]);

  // Auto-scroll (instant to avoid visible scroll animation on load)
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages]);

  // Stable reference for messages length (prevents dependency array size changes)
  const messagesLength = messages?.messages?.length ?? 0;

  // Mark as read when selecting conversation or new messages arrive
  useEffect(() => {
    if (selectedConversationId) {
      markSupportAsRead({ conversationId: selectedConversationId }).catch(console.error);
    }
  }, [selectedConversationId, markSupportAsRead, messagesLength]);

  // Filter conversations by search
  const filteredConversations = (supportConversations || []).filter((conv: any) =>
    searchQuery === '' ||
    conv.playerCorporationName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected conversation
  const selectedConversation = supportConversations?.find((c: any) => c._id === selectedConversationId);

  // Send message handler
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId || !selectedConversation) return;

    try {
      await sendSupportMessage({
        playerWallet: selectedConversation.playerWallet,
        content: messageInput.trim(),
        conversationId: selectedConversationId,
      });
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send support message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-[850px]">
      {/* Conversations Panel */}
      <div className="col-span-1 bg-black/40 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Support Inbox
            </h2>
            {totalSupportUnread !== undefined && totalSupportUnread > 0 && (
              <span className="bg-cyan-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                {totalSupportUnread > 99 ? '99+' : totalSupportUnread}
              </span>
            )}
          </div>
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by corporation..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv: any) => (
            <div
              key={conv._id}
              onClick={() => setSelectedConversationId(conv._id)}
              className={`group w-full p-4 text-left border-b border-gray-700/50 transition-colors cursor-pointer ${
                selectedConversationId === conv._id
                  ? 'bg-cyan-500/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
                  <img
                    src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(conv.playerWallet)}`)}
                    alt={conv.playerCorporationName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium truncate">
                      {conv.playerCorporationName}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-gray-400 text-sm truncate">
                      {conv.lastMessagePreview || 'No messages yet'}
                    </div>
                    {conv.unreadForSupport > 0 && (
                      <span className="bg-cyan-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">
                        {conv.unreadForSupport}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="flex justify-center mb-3">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-600">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>No support conversations</div>
              <div className="text-sm text-gray-600 mt-1">
                {searchQuery ? 'Try a different search' : 'Players will appear here when they message support'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="col-span-2 bg-black/40 rounded-xl border border-gray-700 flex flex-col overflow-hidden">
        {selectedConversationId && selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-cyan-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                  <img
                    src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(selectedConversation.playerWallet)}`)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-white font-semibold">{selectedConversation.playerCorporationName}</div>
                  <div className="text-gray-500 text-sm">Support conversation</div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.messages?.map((msg: any) => {
                const isFromSupport = msg.senderId === SUPPORT_WALLET_ID;

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isFromSupport ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isFromSupport ? 'order-2' : ''}`}>
                      {/* Sender label */}
                      <div className={`text-xs mb-1 ${isFromSupport ? 'text-right text-cyan-400' : 'text-gray-500'}`}>
                        {isFromSupport ? 'Over Exposed Support' : selectedConversation.playerCorporationName}
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          msg.isDeleted
                            ? 'bg-gray-700/50 text-gray-500 italic'
                            : isFromSupport
                              ? 'bg-cyan-500/20 text-white border border-cyan-500/30'
                              : 'bg-white/10 text-white'
                        }`}
                      >
                        {msg.isDeleted ? '[Message deleted]' : msg.content}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && !msg.isDeleted && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {msg.attachments.map((att: any, idx: number) => (
                              att.url ? (
                                <button
                                  key={idx}
                                  onClick={() => setLightboxImage({ url: att.url, filename: att.filename })}
                                  className="block"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.filename}
                                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                                  />
                                </button>
                              ) : (
                                <div
                                  key={idx}
                                  className="bg-gray-700/50 rounded-lg px-3 py-2 text-gray-400 text-sm flex items-center gap-2"
                                  title="Image unavailable - may be on different database"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                  </svg>
                                  {att.filename}
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isFromSupport ? 'justify-end' : ''}`}>
                        <span>{formatRelativeTime(msg.createdAt)}</span>
                        {isFromSupport && msg.status && (
                          <span className={msg.status === 'read' ? 'text-green-400' : ''}>
                            {msg.status === 'read' ? '** Read' : '* Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />

              {(!messages?.messages || messages.messages.length === 0) && (
                <div className="text-center text-gray-500 py-16">
                  <div className="text-4xl mb-2">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto text-gray-600">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>No messages yet</div>
                  <div className="text-sm">Send a message to start helping this player</div>
                </div>
              )}
            </div>

            {/* Compose Area */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply as Over Exposed Support..."
                  maxLength={MAX_MESSAGE_LENGTH}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || messageInput.length > MAX_MESSAGE_LENGTH}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    messageInput.trim() && messageInput.length <= MAX_MESSAGE_LENGTH
                      ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10'
                      : 'text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
              {messageInput.length > MAX_MESSAGE_LENGTH * 0.9 && (
                <div className={`text-xs mt-1 text-right ${
                  messageInput.length > MAX_MESSAGE_LENGTH ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {messageInput.length}/{MAX_MESSAGE_LENGTH}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2 text-center">
                Replies are sent as &quot;Over Exposed Support&quot;
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75" className="text-gray-600">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="text-lg text-gray-400">Select a support conversation</div>
              <div className="text-sm mt-2">to view and reply to player messages</div>
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {mounted && lightboxImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.filename}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full text-white flex items-center justify-center hover:bg-black/70"
            >
              *
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
