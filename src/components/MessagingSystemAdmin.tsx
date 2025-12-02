'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Types for attachments
interface PendingAttachment {
  file: File;
  previewUrl: string;
  storageId?: Id<"_storage">;
  uploading?: boolean;
  error?: string;
}

interface UploadedAttachment {
  storageId: Id<"_storage">;
  filename: string;
  mimeType: string;
  size: number;
}

// Upload limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_PER_MESSAGE = 3;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
  const [isNewConversation, setIsNewConversation] = useState(false); // For starting new conversations
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; filename: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const generateUploadUrl = useMutation(api.messageAttachments.generateUploadUrl);
  const validateUpload = useMutation(api.messageAttachments.validateUpload);

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
    const hasContent = messageInput.trim().length > 0;
    const hasValidAttachments = pendingAttachments.some(a => a.storageId && !a.error);

    if (!hasContent && !hasValidAttachments) return;

    // Check if any attachments are still uploading
    if (pendingAttachments.some(a => a.uploading)) {
      alert('Please wait for uploads to complete');
      return;
    }

    const otherCorp = TEST_CORPORATIONS.find(c => c.id !== activeCorp.id)!;

    try {
      // Build attachments array from successfully uploaded files
      const attachments: UploadedAttachment[] = pendingAttachments
        .filter(a => a.storageId && !a.error)
        .map(a => ({
          storageId: a.storageId!,
          filename: a.file.name,
          mimeType: a.file.type,
          size: a.file.size,
        }));

      const result = await sendMessage({
        senderWallet: activeCorp.walletAddress,
        recipientWallet: otherCorp.walletAddress,
        content: messageInput.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Clear inputs
      setMessageInput('');

      // Clean up preview URLs and clear pending attachments
      pendingAttachments.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
      setPendingAttachments([]);

      setSelectedConversationId(result.conversationId);
      setIsNewConversation(false); // Exit new conversation mode

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('[📎SEND] Failed to send message:', error);
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if we'd exceed the limit
    if (pendingAttachments.length + files.length > MAX_FILES_PER_MESSAGE) {
      alert(`Maximum ${MAX_FILES_PER_MESSAGE} images per message`);
      return;
    }

    // Process each file
    for (const file of files) {
      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only images allowed.`);
        continue;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        alert(`File too large: ${file.name}. Max 5MB.`);
        continue;
      }

      // Create preview and add to pending
      const previewUrl = URL.createObjectURL(file);
      const pending: PendingAttachment = {
        file,
        previewUrl,
        uploading: true,
      };

      setPendingAttachments(prev => [...prev, pending]);

      // Upload the file
      try {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload to Convex storage
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const { storageId } = await response.json();

        // Validate and register the upload
        await validateUpload({
          walletAddress: activeCorp.walletAddress,
          storageId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });

        // Update the pending attachment with storageId
        setPendingAttachments(prev =>
          prev.map(p =>
            p.file === file
              ? { ...p, storageId, uploading: false }
              : p
          )
        );
      } catch (error) {
        console.error('[📎UPLOAD] Failed:', error);
        setPendingAttachments(prev =>
          prev.map(p =>
            p.file === file
              ? { ...p, uploading: false, error: 'Upload failed' }
              : p
          )
        );
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a pending attachment
  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => {
      const attachment = prev[index];
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Switch active corporation
  const switchCorporation = (corp: typeof TEST_CORPORATIONS[0]) => {
    setActiveCorp(corp);
    setSelectedConversationId(null);
    setIsNewConversation(false);
  };

  // Start a new conversation with the other corp
  const startConversation = () => {
    if (existingConversation) {
      // Existing conversation - just select it
      setSelectedConversationId(existingConversation._id);
      setIsNewConversation(false);
    } else {
      // No conversation yet - enter new conversation mode
      setSelectedConversationId(null);
      setIsNewConversation(true);
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
              {conversations?.map((conv: any) => (
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
            {(selectedConversationId || isNewConversation) ? (
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
                      <div className="text-gray-500 text-sm">
                        {isNewConversation && !selectedConversationId ? 'New conversation' : 'Active now'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[400px]">
                  {messages?.map((msg: any) => {
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
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className={`flex gap-2 flex-wrap ${msg.content ? 'mb-2' : ''}`}>
                              {msg.attachments.map((att: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => setLightboxImage({ url: att.url, filename: att.filename })}
                                  className="block cursor-pointer"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.filename}
                                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-white/10 hover:border-yellow-500/50 transition-colors"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Message content */}
                          {msg.content && <div className="text-white">{msg.content}</div>}
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

                  {(messages?.length === 0 || (isNewConversation && !messages)) && (
                    <div className="text-center text-gray-500 py-16">
                      <div className="text-4xl mb-2">💬</div>
                      <div>No messages yet</div>
                      <div className="text-sm">Send the first message to start the conversation!</div>
                    </div>
                  )}
                </div>

                {/* Compose Area - Transparent rounded design */}
                <div className="p-4 border-t border-gray-700/50">
                  {/* Pending Attachments Preview */}
                  {pendingAttachments.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {pendingAttachments.map((attachment, index) => (
                        <div key={index} className="relative group">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/20 bg-black/40">
                            <img
                              src={attachment.previewUrl}
                              alt={attachment.file.name}
                              className="w-full h-full object-cover"
                            />
                            {/* Loading overlay */}
                            {attachment.uploading && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            {/* Error overlay */}
                            {attachment.error && (
                              <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                                <span className="text-white text-xs">!</span>
                              </div>
                            )}
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={() => removePendingAttachment(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 px-3 py-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Attachment/Upload Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pendingAttachments.length >= MAX_FILES_PER_MESSAGE}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        pendingAttachments.length >= MAX_FILES_PER_MESSAGE
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                      title={pendingAttachments.length >= MAX_FILES_PER_MESSAGE ? 'Max images reached' : 'Attach image'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </button>

                    {/* Text Input */}
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Message..."
                      maxLength={MAX_MESSAGE_LENGTH}
                      className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none py-2 text-sm"
                    />

                    {/* Character count (only show when typing) */}
                    {messageInput.length > 0 && (
                      <span className={`text-xs ${getCharCountColor()} mr-1`}>
                        {messageInput.length > 1800 ? `${messageInput.length}/${MAX_MESSAGE_LENGTH}` : ''}
                      </span>
                    )}

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        (!messageInput.trim() && !pendingAttachments.some(a => a.storageId && !a.error)) ||
                        messageInput.length > MAX_MESSAGE_LENGTH ||
                        pendingAttachments.some(a => a.uploading)
                      }
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        (messageInput.trim() || pendingAttachments.some(a => a.storageId && !a.error)) &&
                        messageInput.length <= MAX_MESSAGE_LENGTH &&
                        !pendingAttachments.some(a => a.uploading)
                          ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10'
                          : 'text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
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

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          {/* Liquid glass container - hugs the image */}
          <div
            className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Close button - X made from two rotated bars */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center group z-10"
            >
              <span
                className="absolute w-[4px] h-[24px] rounded-full bg-[#F4A259] group-hover:bg-[#F25C66] transition-all duration-300 ease-in"
                style={{ transform: 'rotate(45deg)' }}
              />
              <span
                className="absolute w-[4px] h-[24px] rounded-full bg-[#F4A259] group-hover:bg-[#F25C66] transition-all duration-300 ease-in"
                style={{ transform: 'rotate(-45deg)' }}
              />
            </button>

            {/* Image */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.filename}
              className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
