'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Test corporation data for dual-testing
const TEST_CORPORATIONS = [
  {
    id: 'corp-alpha',
    walletAddress: 'test_wallet_alpha_001',
    companyName: 'Alpha Industries',
    displayName: 'Alpha Industries',
    color: '#fab617', // Yellow
  },
  {
    id: 'corp-beta',
    walletAddress: 'test_wallet_beta_002',
    companyName: 'Beta Corporation',
    displayName: 'Beta Corporation',
    color: '#22d3ee', // Cyan
  },
];

// Character limit
const MAX_MESSAGE_LENGTH = 2000;

// Format relative timestamp
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

export default function MessagingSystemAdmin() {
  // State for dual-corporation testing
  const [activeCorp, setActiveCorp] = useState(TEST_CORPORATIONS[0]);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convex queries
  const conversations = useQuery(api.messaging.getConversations, {
    walletAddress: activeCorp.walletAddress,
  });

  const messages = useQuery(
    api.messaging.getMessages,
    selectedConversationId
      ? { conversationId: selectedConversationId, walletAddress: activeCorp.walletAddress }
      : 'skip'
  );

  const totalUnread = useQuery(api.messaging.getTotalUnreadCount, {
    walletAddress: activeCorp.walletAddress,
  });

  // Check if conversation exists between test corps
  const existingConversation = useQuery(api.messaging.getConversationBetween, {
    wallet1: TEST_CORPORATIONS[0].walletAddress,
    wallet2: TEST_CORPORATIONS[1].walletAddress,
  });

  // Convex mutations
  const sendMessage = useMutation(api.messaging.sendMessage);
  const markAsRead = useMutation(api.messaging.markConversationAsRead);
  const setTypingIndicator = useMutation(api.messaging.setTypingIndicator);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (selectedConversationId) {
      markAsRead({
        conversationId: selectedConversationId,
        walletAddress: activeCorp.walletAddress,
      });
    }
  }, [selectedConversationId, activeCorp.walletAddress]);

  // Handle typing indicator
  const handleInputChange = (text: string) => {
    setMessageInput(text);

    if (selectedConversationId) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing indicator
      setTypingIndicator({
        conversationId: selectedConversationId,
        walletAddress: activeCorp.walletAddress,
        isTyping: true,
      });

      // Set timeout to clear typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setTypingIndicator({
          conversationId: selectedConversationId,
          walletAddress: activeCorp.walletAddress,
          isTyping: false,
        });
      }, 3000);
    }
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const otherCorp = TEST_CORPORATIONS.find(c => c.id !== activeCorp.id)!;

    try {
      const result = await sendMessage({
        senderWallet: activeCorp.walletAddress,
        recipientWallet: otherCorp.walletAddress,
        content: messageInput.trim(),
      });

      setMessageInput('');
      setSelectedConversationId(result.conversationId);

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Switch active corporation
  const switchCorporation = (corp: typeof TEST_CORPORATIONS[0]) => {
    setActiveCorp(corp);
    setSelectedConversationId(null);
  };

  // Start a new conversation with the other corp
  const startConversation = () => {
    if (existingConversation) {
      setSelectedConversationId(existingConversation._id);
    }
  };

  // Get character count color
  const getCharCountColor = () => {
    const ratio = messageInput.length / MAX_MESSAGE_LENGTH;
    if (ratio >= 1) return 'text-red-500';
    if (ratio >= 0.8) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div
      className="min-h-[800px] rounded-lg overflow-hidden relative"
      style={{
        backgroundImage: 'url(/colored-bg-1.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold text-yellow-400 mb-2"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Messaging System
          </h1>
          <p className="text-gray-400">
            Test corporation-to-corporation messaging with dual-view
          </p>
        </div>

        {/* Corporation Switcher */}
        <div className="mb-6 p-4 bg-black/40 rounded-xl border border-gray-700">
          <div className="text-sm text-gray-400 uppercase tracking-wider mb-3">
            Active Corporation (Testing As)
          </div>
          <div className="flex gap-4">
            {TEST_CORPORATIONS.map((corp) => (
              <button
                key={corp.id}
                onClick={() => switchCorporation(corp)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  activeCorp.id === corp.id
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-gray-600 bg-black/30 hover:border-gray-500'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: corp.color }}
                />
                <div className="text-white font-semibold">{corp.companyName}</div>
                <div className="text-gray-400 text-sm truncate">{corp.walletAddress}</div>
                {activeCorp.id === corp.id && (
                  <div className="mt-2 text-xs text-yellow-400 uppercase">Currently Active</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Messaging Area */}
        <div className="grid grid-cols-3 gap-6">
          {/* Inbox Panel */}
          <div className="col-span-1 bg-black/40 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Inbox</h2>
              {totalUnread !== undefined && totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              {/* Start New Conversation Button */}
              <button
                onClick={startConversation}
                className="w-full p-4 text-left border-b border-gray-700/50 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-cyan-400">+</span>
                  </div>
                  <div>
                    <div className="text-cyan-400 font-medium">Start Test Conversation</div>
                    <div className="text-gray-500 text-sm">
                      with {TEST_CORPORATIONS.find(c => c.id !== activeCorp.id)?.companyName}
                    </div>
                  </div>
                </div>
              </button>

              {/* Conversation List */}
              {conversations?.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setSelectedConversationId(conv._id)}
                  className={`w-full p-4 text-left border-b border-gray-700/50 transition-colors ${
                    selectedConversationId === conv._id
                      ? 'bg-yellow-500/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">
                        {conv.otherParticipant.companyName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium truncate">
                          {conv.otherParticipant.companyName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-gray-400 text-sm truncate">
                          {conv.lastMessagePreview || 'No messages yet'}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {conversations?.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <div>No conversations yet</div>
                  <div className="text-sm">Start a test conversation above</div>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Panel */}
          <div className="col-span-2 bg-black/40 rounded-xl border border-gray-700 flex flex-col overflow-hidden">
            {selectedConversationId ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">
                        {TEST_CORPORATIONS.find(c => c.id !== activeCorp.id)?.companyName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {TEST_CORPORATIONS.find(c => c.id !== activeCorp.id)?.companyName}
                      </div>
                      <div className="text-gray-500 text-sm">Active now</div>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[400px]">
                  {messages?.map((msg) => {
                    const isOutgoing = msg.senderId === activeCorp.walletAddress;

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOutgoing
                              ? 'bg-yellow-500/20 border border-yellow-500/30 rounded-br-sm'
                              : 'bg-gray-700/50 border border-gray-600 rounded-bl-sm'
                          }`}
                        >
                          <div className="text-white">{msg.content}</div>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span className="text-gray-500 text-xs">
                              {formatRelativeTime(msg.createdAt)}
                            </span>
                            {isOutgoing && (
                              <span className="text-xs">
                                {msg.status === 'read' ? (
                                  <span className="text-cyan-400">✓✓</span>
                                ) : msg.status === 'delivered' ? (
                                  <span className="text-gray-400">✓✓</span>
                                ) : (
                                  <span className="text-gray-500">✓</span>
                                )}
                              </span>
                            )}
                            {msg.editedAt && (
                              <span className="text-gray-500 text-xs italic">edited</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />

                  {messages?.length === 0 && (
                    <div className="text-center text-gray-500 py-16">
                      <div className="text-4xl mb-2">💬</div>
                      <div>No messages yet</div>
                      <div className="text-sm">Send the first message!</div>
                    </div>
                  )}
                </div>

                {/* Compose Area */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={messageInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={2}
                        maxLength={MAX_MESSAGE_LENGTH}
                        className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-yellow-500/50"
                      />
                      <div className={`absolute bottom-2 right-2 text-xs ${getCharCountColor()}`}>
                        {messageInput.length}/{MAX_MESSAGE_LENGTH}
                      </div>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || messageInput.length > MAX_MESSAGE_LENGTH}
                      className={`px-6 rounded-lg font-semibold uppercase tracking-wider transition-all ${
                        messageInput.trim() && messageInput.length <= MAX_MESSAGE_LENGTH
                          ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Send
                    </button>
                  </div>
                  <div className="mt-2 text-gray-500 text-xs">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📨</div>
                  <div className="text-lg">Select a conversation</div>
                  <div className="text-sm">or start a new one from the inbox</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-black/40 rounded-xl border border-gray-700">
          <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Debug Info</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Active Corp:</span>{' '}
              <span className="text-white">{activeCorp.companyName}</span>
            </div>
            <div>
              <span className="text-gray-500">Conversations:</span>{' '}
              <span className="text-white">{conversations?.length ?? 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Unread:</span>{' '}
              <span className="text-yellow-400">{totalUnread ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
