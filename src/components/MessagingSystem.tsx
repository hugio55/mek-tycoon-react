'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getMediaUrl } from '@/lib/media-url';

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

// Support chat identifier - must match convex/messaging.ts
const SUPPORT_WALLET_ID = "SUPPORT_OVEREXPOSED";

// Sample Mek images for random profile pictures
const SAMPLE_MEK_IMAGES = [
  'aa1-aa1-cd1.webp', 'bc2-dm1-ap1.webp', 'dp2-bf4-il2.webp', 'hb1-gn1-hn1.webp',
  'aa1-ak1-de1.webp', 'bc2-ee1-bc1.webp', 'dp2-bj2-da1.webp', 'hb1-hp1-aj1.webp',
  'aa1-bf2-ap2.webp', 'bc2-gn2-eh1.webp', 'dp2-dm1-fb2.webp', 'hb2-aa1-gk2.webp',
  'aa1-at4-ey2.webp', 'bc2-hp1-hn1.webp', 'dp2-er3-hn2.webp', 'hb2-ak2-ap2.webp',
  'aa1-bf4-cu1.webp', 'bc2-ev1-hn1.webp', 'dp2-fd1-da2.webp', 'hb1-io1-ap1.webp',
  'aa1-bi1-ap1.webp', 'bc2-er1-bc1.webp', 'dp2-bq1-bc1.webp', 'hb1-jg2-bc1.webp',
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

interface MessagingSystemProps {
  walletAddress: string;
  companyName?: string;
}

export default function MessagingSystem({ walletAddress, companyName }: MessagingSystemProps) {
  // State
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; filename: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [corpSearchQuery, setCorpSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<{ walletAddress: string; companyName: string } | null>(null);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [errorLightbox, setErrorLightbox] = useState<{ title: string; message: string } | null>(null);
  const [showSupportDismissLightbox, setShowSupportDismissLightbox] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex queries
  const conversations = useQuery(api.messaging.getConversations, {
    walletAddress: walletAddress,
  });

  const messages = useQuery(
    api.messaging.getMessages,
    selectedConversationId ? { conversationId: selectedConversationId, walletAddress } : 'skip'
  );

  // Debug: Log messages with attachments
  if (messages?.some((m: any) => m.attachments?.length > 0)) {
    console.log('[🔍DEBUG] Messages with attachments:', messages.filter((m: any) => m.attachments?.length > 0).map((m: any) => ({
      content: m.content,
      attachments: m.attachments
    })));
  }

  const existingConversation = useQuery(
    api.messaging.getConversationBetween,
    selectedRecipient ? { wallet1: walletAddress, wallet2: selectedRecipient.walletAddress } : 'skip'
  );

  const allCorporations = useQuery(api.messaging.getAllCorporations, {
    excludeWallet: walletAddress,
  });

  const blockedUsers = useQuery(api.messaging.getBlockedUsers, {
    walletAddress: walletAddress,
  });

  const uploadQuota = useQuery(api.messageAttachments.getUploadQuota, {
    walletAddress: walletAddress,
  });

  // Support chat queries
  const supportConversationStatus = useQuery(api.messaging.isSupportConversationDismissed, {
    walletAddress: walletAddress,
  });

  // Mutations
  const sendMessage = useMutation(api.messaging.sendMessage);
  const markAsRead = useMutation(api.messaging.markConversationAsRead);
  const setTypingIndicator = useMutation(api.messaging.setTypingIndicator);
  const deleteMessage = useMutation(api.messaging.deleteMessage);
  const deleteConversation = useMutation(api.messaging.deleteConversation);
  const generateUploadUrl = useMutation(api.messageAttachments.generateUploadUrl);
  const validateUpload = useMutation(api.messageAttachments.validateUpload);
  const deleteUpload = useMutation(api.messageAttachments.deleteUpload);
  const blockUser = useMutation(api.messaging.blockUser);
  const unblockUser = useMutation(api.messaging.unblockUser);

  // Support chat mutations
  const createSupportConversation = useMutation(api.messaging.createSupportConversation);
  const dismissSupportConversation = useMutation(api.messaging.dismissSupportConversation);
  const reopenSupportConversation = useMutation(api.messaging.reopenSupportConversation);

  // Mount check for portals
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxImage || showNewConversation || errorLightbox || showBlockedUsers || showSupportDismissLightbox) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxImage, showNewConversation, errorLightbox, showBlockedUsers, showSupportDismissLightbox]);

  // Auto-create support conversation if it doesn't exist
  useEffect(() => {
    if (supportConversationStatus && !supportConversationStatus.exists && walletAddress) {
      createSupportConversation({ walletAddress }).catch(console.error);
    }
  }, [supportConversationStatus, walletAddress, createSupportConversation]);

  // Mark messages as read when conversation is selected or new messages arrive
  useEffect(() => {
    if (selectedConversationId && walletAddress) {
      markAsRead({ conversationId: selectedConversationId, walletAddress });
    }
  }, [selectedConversationId, walletAddress, markAsRead, messages?.length]);

  // Auto-scroll to latest messages (instant - directly set scrollTop to start at bottom)
  useLayoutEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Helper to check if conversation is support chat
  const isSupportConversation = (conv: any) => {
    return conv.participant1 === SUPPORT_WALLET_ID ||
           conv.participant2 === SUPPORT_WALLET_ID ||
           conv.otherParticipant?.walletAddress === SUPPORT_WALLET_ID;
  };

  // Get support conversation from the list (if exists and not dismissed)
  const supportConversation = conversations?.find(isSupportConversation);

  // Regular conversations (excluding support)
  const regularConversations = conversations?.filter((conv: any) => !isSupportConversation(conv)) || [];

  // Filter corporations for search (include support reopen option)
  const corporationsToSearch = allCorporations || [];
  // Always show support option in New Conversation modal
  const showSupportOption = true;

  const filteredCorporations = corpSearchQuery
    ? corporationsToSearch.filter((corp: any) =>
        corp.companyName?.toLowerCase().includes(corpSearchQuery.toLowerCase())
      )
    : corporationsToSearch.slice(0, 20);

  // Select a corporation to message
  const selectCorporation = (corp: { walletAddress: string; companyName: string }) => {
    setSelectedRecipient(corp);
    setShowNewConversation(false);
    setCorpSearchQuery('');
    setIsNewConversation(true);
    setSelectedConversationId(null);
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_FILES_PER_MESSAGE - pendingAttachments.length;
    const filesToProcess = files.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorLightbox({
          title: 'Invalid File Type',
          message: `${file.name} is not a supported image type. Please use JPEG, PNG, WebP, or GIF.`,
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorLightbox({
          title: 'File Too Large',
          message: `${file.name} exceeds the 5MB limit.`,
        });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const newAttachment: PendingAttachment = {
        file,
        previewUrl,
        uploading: true,
      };

      setPendingAttachments(prev => [...prev, newAttachment]);

      try {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!result.ok) throw new Error('Upload failed');

        const { storageId } = await result.json();

        await validateUpload({
          walletAddress,
          storageId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });

        setPendingAttachments(prev =>
          prev.map(p =>
            p.file === file ? { ...p, storageId, uploading: false } : p
          )
        );
      } catch (error) {
        console.error('Upload failed:', error);
        setPendingAttachments(prev =>
          prev.map(p =>
            p.file === file ? { ...p, uploading: false, error: 'Upload failed' } : p
          )
        );
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove pending attachment
  const removePendingAttachment = async (index: number) => {
    const attachment = pendingAttachments[index];
    if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    if (attachment.storageId) {
      try {
        await deleteUpload({ storageId: attachment.storageId, walletAddress });
      } catch (e) {
        console.error('Failed to delete upload:', e);
      }
    }
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle send message
  const handleSendMessage = async () => {
    const hasContent = messageInput.trim().length > 0;
    const hasValidAttachments = pendingAttachments.some(a => a.storageId && !a.error);

    if (!hasContent && !hasValidAttachments) return;

    // Check if conversation is disabled
    const currentConv = conversations?.find((c: any) => c._id === selectedConversationId);
    const isDisabled = currentConv?.disabledByAdmin ||
      (isNewConversation && existingConversation?.disabledByAdmin);

    if (isDisabled) {
      const reason = currentConv?.disabledReason || existingConversation?.disabledReason || 'Terms of Service violation';
      setErrorLightbox({
        title: 'Conversation Disabled',
        message: `This conversation has been disabled by an administrator.\n\nReason: ${reason}`,
      });
      return;
    }

    if (pendingAttachments.some(a => a.uploading)) {
      setErrorLightbox({
        title: 'Upload in Progress',
        message: 'Please wait for uploads to complete before sending.',
      });
      return;
    }

    const recipientWallet = selectedRecipient?.walletAddress ||
      conversations?.find((c: any) => c._id === selectedConversationId)?.otherParticipant?.walletAddress;

    if (!recipientWallet) {
      console.error('No recipient wallet address');
      return;
    }

    try {
      const attachments: UploadedAttachment[] = pendingAttachments
        .filter(a => a.storageId && !a.error)
        .map(a => ({
          storageId: a.storageId!,
          filename: a.file.name,
          mimeType: a.file.type,
          size: a.file.size,
        }));

      const result = await sendMessage({
        senderWallet: walletAddress,
        recipientWallet: recipientWallet,
        content: messageInput.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      setMessageInput('');
      pendingAttachments.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
      setPendingAttachments([]);
      setSelectedConversationId(result.conversationId);
      setIsNewConversation(false);
      setSelectedRecipient(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // Clean up uploaded attachments since message failed
      const uploadedAttachments = pendingAttachments.filter(a => a.storageId && !a.error);
      if (uploadedAttachments.length > 0) {
        await Promise.allSettled(
          uploadedAttachments.map(a =>
            deleteUpload({ storageId: a.storageId!, walletAddress })
          )
        );
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      if (errorMessage.includes('Terms of Service') || errorMessage.includes('disabled')) {
        setErrorLightbox({ title: 'Conversation Disabled', message: errorMessage });
      } else if (errorMessage.includes('blocked')) {
        setErrorLightbox({ title: 'Cannot Send Message', message: errorMessage });
      } else {
        setErrorLightbox({ title: 'Message Failed', message: errorMessage });
      }
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (selectedConversationId) {
      setTypingIndicator({ conversationId: selectedConversationId, walletAddress, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingIndicator({ conversationId: selectedConversationId, walletAddress, isTyping: false });
      }, 3000);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: Id<"conversations">, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation? You can restart it by sending a new message.')) {
      await deleteConversation({ conversationId: convId, walletAddress });
      if (selectedConversationId === convId) {
        setSelectedConversationId(null);
      }
    }
  };

  // Block user
  const handleBlockUser = async (otherWallet: string) => {
    if (confirm('Block this user? They will not be able to message you.')) {
      await blockUser({ blockerWallet: walletAddress, blockedWallet: otherWallet });
    }
  };

  // Unblock user
  const handleUnblockUser = async (blockedWallet: string) => {
    await unblockUser({ blockerWallet: walletAddress, blockedWallet });
  };

  // Dismiss support conversation (with confirmation)
  const handleDismissSupportConversation = async () => {
    try {
      await dismissSupportConversation({ walletAddress });
      setShowSupportDismissLightbox(false);
      if (supportConversation && selectedConversationId === supportConversation._id) {
        setSelectedConversationId(null);
      }
    } catch (error) {
      console.error('Failed to dismiss support conversation:', error);
    }
  };

  // Open/reopen/create support conversation
  const handleOpenSupportConversation = async () => {
    try {
      setShowNewConversation(false);
      setCorpSearchQuery('');

      // If support conversation already exists and is visible, just open it
      if (supportConversation) {
        setSelectedConversationId(supportConversation._id);
        return;
      }

      // If dismissed, reopen it
      if (supportConversationStatus?.isDismissed) {
        const result = await reopenSupportConversation({ walletAddress });
        if (result.conversationId) {
          setSelectedConversationId(result.conversationId);
        }
        return;
      }

      // Otherwise create a new one
      const result = await createSupportConversation({ walletAddress });
      if (result.conversationId) {
        setSelectedConversationId(result.conversationId);
      }
    } catch (error) {
      console.error('Failed to open support conversation:', error);
    }
  };

  // Get current conversation info
  const currentConversation = conversations?.find((c: any) => c._id === selectedConversationId);
  const isDisabled = currentConversation?.disabledByAdmin ||
    (isNewConversation && existingConversation?.disabledByAdmin);

  return (
    <div className="flex h-full min-h-[500px] overflow-hidden">
      {/* Left Sidebar - Inbox */}
      <div className="w-80 border-r border-gray-700/50 flex flex-col bg-black/20">
        {/* Inbox Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Inbox</h2>
          <button
            onClick={() => setShowBlockedUsers(true)}
            className="text-xs px-2 py-1 rounded-full border transition-colors bg-gray-700/50 text-gray-400 border-gray-600 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10"
          >
            Blocked
          </button>
        </div>

        {/* New Conversation Button - Matches Admin Style */}
        <button
          onClick={() => setShowNewConversation(true)}
          className="w-full p-4 text-left border-b border-gray-700/50 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-400 text-lg">+</span>
            </div>
            <div>
              <div className="text-cyan-400 font-medium">New Conversation</div>
              <div className="text-gray-500 text-sm">Search for a corporation</div>
            </div>
          </div>
        </button>


        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {/* Support Conversation - Pinned at Top */}
          {supportConversation && (
            <div
              onClick={() => {
                setSelectedConversationId(supportConversation._id);
                setIsNewConversation(false);
                setSelectedRecipient(null);
              }}
              className={`group w-full p-4 text-left border-b border-cyan-500/30 transition-colors cursor-pointer ${
                selectedConversationId === supportConversation._id
                  ? 'bg-cyan-500/15'
                  : 'bg-cyan-500/5 hover:bg-cyan-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Support Icon */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex-shrink-0 flex items-center justify-center border border-cyan-500/40">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Top row: Name + X button */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm whitespace-nowrap">
                      Over Exposed Support
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSupportDismissLightbox(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1 flex-shrink-0"
                      title="Close support chat"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  {/* Bottom row: Preview + Timestamp + Unread badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm truncate pr-2">
                      {supportConversation.lastMessagePreview || 'How can we help?'}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-gray-500 text-xs">
                        {formatRelativeTime(supportConversation.lastMessageAt)}
                      </span>
                      {supportConversation.unreadCount > 0 && (
                        <span className="bg-cyan-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {supportConversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Conversations */}
          {regularConversations.map((conv: any) => (
            <div
              key={conv._id}
              onClick={() => {
                setSelectedConversationId(conv._id);
                setIsNewConversation(false);
                setSelectedRecipient(null);
              }}
              className={`group w-full p-4 text-left border-b border-gray-700/50 transition-colors cursor-pointer ${
                selectedConversationId === conv._id
                  ? 'bg-yellow-500/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
                  <img
                    src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(conv.otherParticipant.walletAddress)}`)}
                    alt={conv.otherParticipant.companyName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-white font-medium truncate">
                        {conv.otherParticipant.companyName}
                      </span>
                      {conv.blockStatus?.iBlockedThem && (
                        <span className="text-red-400 text-xs flex-shrink-0">[Blocked]</span>
                      )}
                      {conv.blockStatus?.theyBlockedMe && !conv.blockStatus?.iBlockedThem && (
                        <span className="text-orange-400 text-xs flex-shrink-0">[Blocked you]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteConversation(conv._id, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                        title="Delete conversation"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                      <div className="text-gray-500 text-xs">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </div>
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
            </div>
          ))}

          {(!conversations || conversations.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              {/* Empty Inbox Icon - Minimalist transmission dish */}
              <div className="flex justify-center mb-3">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                  <ellipse cx="24" cy="32" rx="16" ry="6" strokeDasharray="4 2" />
                  <path d="M12 32V38C12 41.3 17.4 44 24 44C30.6 44 36 41.3 36 38V32" />
                  <line x1="24" y1="4" x2="24" y2="26" />
                  <circle cx="24" cy="4" r="2" fill="currentColor" />
                  <path d="M18 10L24 4L30 10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-gray-400">No transmissions yet</div>
              <div className="text-sm text-gray-600">Initiate contact above</div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Conversation */}
      <div className="flex-1 flex flex-col bg-black/20">
        {selectedConversationId || isNewConversation ? (
          <>
            {/* Conversation Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              currentConversation && isSupportConversation(currentConversation)
                ? 'border-cyan-500/30 bg-cyan-500/5'
                : 'border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                {/* Profile icon - different for support vs regular */}
                {currentConversation && isSupportConversation(currentConversation) ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center border border-cyan-500/40">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    <img
                      src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(
                        selectedRecipient?.walletAddress ||
                        currentConversation?.otherParticipant?.walletAddress || ''
                      )}`)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  {currentConversation && isSupportConversation(currentConversation) ? (
                    <>
                      <div className="text-cyan-400 font-medium">Over Exposed Support</div>
                      <div className="text-xs text-cyan-500/60">Development Team</div>
                    </>
                  ) : (
                    <>
                      <div className="text-white font-medium">
                        {selectedRecipient?.companyName || currentConversation?.otherParticipant?.companyName || 'Unknown'}
                      </div>
                      {isNewConversation && (
                        <div className="text-xs text-yellow-400">New conversation</div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Block button - hidden for support conversations */}
              {(currentConversation?.otherParticipant?.walletAddress || selectedRecipient?.walletAddress) &&
               !(currentConversation && isSupportConversation(currentConversation)) && (
                <button
                  onClick={() => handleBlockUser(
                    currentConversation?.otherParticipant?.walletAddress || selectedRecipient?.walletAddress || ''
                  )}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  title="Block this user"
                >
                  Block
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {isNewConversation && !existingConversation && (
                <div className="text-center text-gray-500 py-8">
                  {/* New Channel Icon - Signal waves */}
                  <div className="flex justify-center mb-3">
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500/60">
                      <circle cx="28" cy="28" r="6" />
                      <path d="M18 18C22.4 13.6 29.6 13.6 34 18" strokeLinecap="round" />
                      <path d="M38 22C40.7 24.7 40.7 29.3 38 32" strokeLinecap="round" />
                      <path d="M18 38C13.6 33.6 13.6 26.4 18 22" strokeLinecap="round" />
                      <path d="M38 38C42.4 33.6 42.4 26.4 38 22" strokeLinecap="round" opacity="0.5" />
                      <path d="M12 12C19.7 4.3 32.3 4.3 40 12" strokeLinecap="round" opacity="0.3" />
                      <path d="M44 16C49 21 49 31 44 36" strokeLinecap="round" opacity="0.3" />
                    </svg>
                  </div>
                  <div className="text-gray-400">Open channel with <span className="text-cyan-400">{selectedRecipient?.companyName}</span></div>
                  <div className="text-sm text-gray-600 mt-1">Send your first transmission</div>
                </div>
              )}

              {messages?.map((msg: any) => {
                const isMine = msg.senderId === walletAddress;
                if (msg.deletedForSender && isMine) return null;
                if (msg.deletedForRecipient && !isMine) return null;

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isMine ? 'order-2' : ''}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          msg.isDeleted
                            ? 'bg-gray-700/50 text-gray-500 italic'
                            : isMine
                              ? 'bg-white/15 text-white'
                              : 'bg-cyan-500/10 text-white'
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

                      <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isMine ? 'justify-end' : ''}`}>
                        <span>{formatRelativeTime(msg.createdAt)}</span>
                        {isMine && msg.status && !(currentConversation && isSupportConversation(currentConversation)) && (
                          <span className={msg.status === 'read' ? 'text-green-400' : ''}>
                            {msg.status === 'read' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose Area */}
            <div className="p-4 border-t border-white/10">
              {isDisabled ? (
                <div className="text-center py-3">
                  <div className="text-red-400/70 text-sm">
                    This conversation has been disabled. You cannot send messages.
                  </div>
                  {(currentConversation?.disabledReason || existingConversation?.disabledReason) && (
                    <div className="text-red-400/50 text-xs mt-2">
                      Reason: {currentConversation?.disabledReason || existingConversation?.disabledReason}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Pending Attachments */}
                  {pendingAttachments.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {pendingAttachments.map((att, idx) => (
                        <div key={idx} className="relative">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                            <img src={att.previewUrl} alt="" className="w-full h-full object-cover" />
                            {att.uploading && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            {att.error && (
                              <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                                <span className="text-white text-xs">!</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removePendingAttachment(idx)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pendingAttachments.length >= MAX_FILES_PER_MESSAGE || !uploadQuota?.canUpload}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        pendingAttachments.length >= MAX_FILES_PER_MESSAGE || !uploadQuota?.canUpload
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={
                        !uploadQuota?.canUpload
                          ? 'Daily upload limit reached'
                          : `Attach image (${uploadQuota?.remainingUploads ?? '?'} left today)`
                      }
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </button>

                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      maxLength={MAX_MESSAGE_LENGTH}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                    />

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

                  {messageInput.length > MAX_MESSAGE_LENGTH * 0.9 && (
                    <div className={`text-xs mt-1 text-right ${
                      messageInput.length > MAX_MESSAGE_LENGTH ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {messageInput.length}/{MAX_MESSAGE_LENGTH}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              {/* Comms Terminal Icon - Hexagonal display */}
              <div className="flex justify-center mb-5">
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-600">
                  {/* Outer hexagon */}
                  <path d="M36 6L60 18V42L36 54L12 42V18L36 6Z" strokeOpacity="0.3" />
                  {/* Inner hexagon */}
                  <path d="M36 16L50 24V40L36 48L22 40V24L36 16Z" strokeOpacity="0.5" />
                  {/* Center signal icon */}
                  <circle cx="36" cy="32" r="4" fill="currentColor" fillOpacity="0.4" />
                  <path d="M28 26C31.3 22.7 38.7 22.7 42 26" strokeLinecap="round" strokeOpacity="0.6" />
                  <path d="M42 38C38.7 41.3 31.3 41.3 28 38" strokeLinecap="round" strokeOpacity="0.6" />
                  {/* Corner accents */}
                  <circle cx="36" cy="6" r="2" fill="currentColor" fillOpacity="0.3" />
                  <circle cx="60" cy="18" r="2" fill="currentColor" fillOpacity="0.3" />
                  <circle cx="12" cy="18" r="2" fill="currentColor" fillOpacity="0.3" />
                </svg>
              </div>
              <div className="text-lg text-gray-400">Select a channel</div>
              <div className="text-sm mt-2 text-gray-600">or initiate a new transmission</div>
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
              ×
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* New Conversation Lightbox */}
      {mounted && showNewConversation && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setShowNewConversation(false)}
        >
          <div
            className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white mb-3">New Conversation</h2>
              <input
                type="text"
                value={corpSearchQuery}
                onChange={(e) => setCorpSearchQuery(e.target.value)}
                placeholder="Search corporations..."
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {/* Over Exposed Support - Always visible at top */}
              {showSupportOption && (
                <button
                  onClick={handleOpenSupportConversation}
                  className="w-full p-4 text-left hover:bg-cyan-500/10 transition-colors border-b border-cyan-500/20 bg-cyan-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center border border-cyan-500/40">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-cyan-400 font-medium">Over Exposed Support</div>
                      <div className="text-cyan-500/60 text-sm">Contact the development team</div>
                    </div>
                  </div>
                </button>
              )}

              {filteredCorporations.length > 0 ? (
                filteredCorporations.map((corp: any) => (
                  <button
                    key={corp.walletAddress}
                    onClick={() => selectCorporation(corp)}
                    className="w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                        <img
                          src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(corp.walletAddress)}`)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{corp.companyName}</div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-white text-lg">{(corp.achievementPoints ?? 0).toLocaleString()}</span>
                        <span className="text-cyan-400 text-xs font-bold">AP</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : corpSearchQuery ? (
                <div className="p-8 text-center text-gray-500">
                  {/* No Results Icon - Radar sweep */}
                  <div className="flex justify-center mb-3">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                      <circle cx="20" cy="20" r="16" strokeOpacity="0.3" />
                      <circle cx="20" cy="20" r="10" strokeOpacity="0.5" />
                      <circle cx="20" cy="20" r="4" strokeOpacity="0.7" />
                      <line x1="20" y1="20" x2="32" y2="8" strokeLinecap="round" />
                      <circle cx="20" cy="20" r="2" fill="currentColor" fillOpacity="0.5" />
                    </svg>
                  </div>
                  <div className="text-gray-500">No signals detected</div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {/* Loading Icon - Rotating orbital rings */}
                  <div className="flex justify-center mb-3">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500/60 animate-spin" style={{ animationDuration: '3s' }}>
                      <ellipse cx="20" cy="20" rx="16" ry="6" strokeOpacity="0.4" />
                      <ellipse cx="20" cy="20" rx="16" ry="6" strokeOpacity="0.4" transform="rotate(60 20 20)" />
                      <ellipse cx="20" cy="20" rx="16" ry="6" strokeOpacity="0.4" transform="rotate(120 20 20)" />
                      <circle cx="20" cy="20" r="3" fill="currentColor" fillOpacity="0.6" />
                    </svg>
                  </div>
                  <div className="text-gray-500">Scanning frequencies...</div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowNewConversation(false)}
              className="w-full p-3 text-gray-400 hover:text-white transition-colors border-t border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Error Lightbox */}
      {mounted && errorLightbox && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setErrorLightbox(null)}
        >
          <div
            className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-red-500/20 bg-red-500/10">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚠️</div>
                <h2 className="text-lg font-semibold text-red-400">{errorLightbox.title}</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="text-gray-300 text-sm whitespace-pre-line">{errorLightbox.message}</div>
            </div>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setErrorLightbox(null)}
                className="w-full py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Blocked Users Lightbox */}
      {mounted && showBlockedUsers && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setShowBlockedUsers(false)}
        >
          {/* Backdrop - Light like communications lightbox */}
          <div
            className="fixed inset-0 bg-black/10"
            style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
          />
          <div
            className="relative w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  BLOCKED USERS
                </h2>
              </div>
              {/* Animated X Close Button */}
              <button
                onClick={() => setShowBlockedUsers(false)}
                className="group relative flex items-center gap-2 p-2 transition-all duration-300"
              >
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <span className="absolute w-[2px] h-[18px] rounded-full bg-white/70 rotate-45 transition-all duration-300 ease-in group-hover:rotate-[-45deg] group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_#22d3ee]" />
                  <span className="absolute w-[2px] h-[18px] rounded-full bg-white/70 -rotate-45 transition-all duration-300 ease-in group-hover:rotate-[45deg] group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_#22d3ee]" />
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {blockedUsers && blockedUsers.length > 0 ? (
                <div className="space-y-2">
                  {blockedUsers.map((block: any) => (
                    <div
                      key={block._id}
                      className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                          <img
                            src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(block.blockedWallet)}`)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-white truncate">
                          {block.blockedUserInfo?.companyName || 'Unknown Corporation'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(block.blockedWallet)}
                        className="text-sm px-3 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  {/* No Blocked Users Icon */}
                  <div className="flex justify-center mb-4">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                      <circle cx="24" cy="24" r="18" strokeOpacity="0.4" />
                      <path d="M24 14V24L30 30" strokeLinecap="round" strokeOpacity="0.6" />
                      <circle cx="24" cy="24" r="3" fill="currentColor" fillOpacity="0.3" />
                      <path d="M16 34C18.5 36.5 21.5 38 24 38C30.6 38 36 32.6 36 26" strokeLinecap="round" strokeOpacity="0.3" />
                    </svg>
                  </div>
                  <div className="text-gray-400">No blocked users</div>
                  <div className="text-sm text-gray-600 mt-1">Your communications are open</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <div className="text-xs text-gray-400 text-center">
                Blocked users cannot send you messages
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Support Dismiss Confirmation Lightbox */}
      {mounted && showSupportDismissLightbox && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setShowSupportDismissLightbox(false)}
        >
          <div
            className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-cyan-500/30 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-cyan-500/20 bg-cyan-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center border border-cyan-500/40">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-cyan-400">Close Support Chat?</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                You are closing this support conversation with the Over Exposed development team.
              </p>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                If you ever want to open it back up, search <span className="text-cyan-400 font-medium">&quot;Over Exposed&quot;</span> in the New Conversation menu.
              </p>
            </div>

            {/* Buttons */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowSupportDismissLightbox(false)}
                className="flex-1 py-2 bg-white/5 text-gray-300 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDismissSupportConversation}
                className="flex-1 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-colors"
              >
                Close Chat
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
