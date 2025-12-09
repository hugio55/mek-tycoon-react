'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getMediaUrl } from '@/lib/media-url';
import SupportInbox from './SupportInbox';

// Subtab types
type MessagingSubtab = 'admin' | 'support';

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

// Sample Mek images for random profile pictures (from /mek-images/150px/)
const SAMPLE_MEK_IMAGES = [
  'aa1-aa1-cd1.webp', 'bc2-dm1-ap1.webp', 'dp2-bf4-il2.webp', 'hb1-gn1-hn1.webp',
  'aa1-ak1-de1.webp', 'bc2-ee1-bc1.webp', 'dp2-bj2-da1.webp', 'hb1-hp1-aj1.webp',
  'aa1-bf2-ap2.webp', 'bc2-gn2-eh1.webp', 'dp2-dm1-fb2.webp', 'hb2-aa1-gk2.webp',
  'aa1-at4-ey2.webp', 'bc2-hp1-hn1.webp', 'dp2-er3-hn2.webp', 'hb2-ak2-ap2.webp',
  'aa1-bf4-cu1.webp', 'bc2-ev1-hn1.webp', 'dp2-fd1-da2.webp', 'hb1-io1-ap1.webp',
  'aa1-bi1-ap1.webp', 'bc2-er1-bc1.webp', 'dp2-bq1-bc1.webp', 'hb1-jg2-bc1.webp',
];

// Deterministic random image based on wallet address (so same corp always gets same image)
function getMekImageForWallet(walletAddress: string): string {
  let hash = 0;
  for (let i = 0; i < walletAddress.length; i++) {
    hash = ((hash << 5) - hash) + walletAddress.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % SAMPLE_MEK_IMAGES.length;
  return SAMPLE_MEK_IMAGES[index];
}

// TEMPORARY TEST DATA - Real corporation names from production for testing search
// TODO: Remove this once connected to real database with corporations
const MOCK_CORPORATIONS_FOR_TESTING = [
  { walletAddress: 'mock_wrenco', companyName: 'WrenCo', displayName: 'WrenCo', achievementPoints: 18750 },
  { walletAddress: 'mock_aumining', companyName: 'AUmining', displayName: 'AUmining', achievementPoints: 12340 },
  { walletAddress: 'mock_sellout', companyName: 'Sellout', displayName: 'Sellout', achievementPoints: 890 },
  { walletAddress: 'mock_statuecorp', companyName: 'StatueCorp', displayName: 'StatueCorp', achievementPoints: 2100 },
  { walletAddress: 'mock_stellar', companyName: 'Stellar Depletion Syndicate', displayName: 'Stellar Depletion Syndicate', achievementPoints: 19850 },
  { walletAddress: 'mock_ultraco', companyName: 'UltraCo', displayName: 'UltraCo', achievementPoints: 150 },
  { walletAddress: 'mock_traiectum', companyName: 'Traiectum', displayName: 'Traiectum', achievementPoints: 8420 },
  { walletAddress: 'mock_sargecorp', companyName: 'SargeCorp', displayName: 'SargeCorp', achievementPoints: 15670 },
  { walletAddress: 'mock_nfg', companyName: 'NFG', displayName: 'NFG', achievementPoints: 10 },
  { walletAddress: 'mock_defifomofo', companyName: 'defifomofo', displayName: 'defifomofo', achievementPoints: 680 },
  { walletAddress: 'mock_kotton', companyName: 'Kotton', displayName: 'Kotton', achievementPoints: 4310 },
  { walletAddress: 'mock_andypro500', companyName: 'Andypro500', displayName: 'Andypro500', achievementPoints: 95 },
  { walletAddress: 'mock_hadi', companyName: 'HADI', displayName: 'HADI', achievementPoints: 11540 },
  { walletAddress: 'mock_lx', companyName: 'LX', displayName: 'LX', achievementPoints: 1120 },
  { walletAddress: 'mock_mtman', companyName: 'MTman', displayName: 'MTman', achievementPoints: 16800 },
  { walletAddress: 'mock_biko1', companyName: 'biko1', displayName: 'biko1', achievementPoints: 275 },
  { walletAddress: 'mock_spannercorps', companyName: 'Spannercorps', displayName: 'Spannercorps', achievementPoints: 7450 },
  { walletAddress: 'mock_mako', companyName: 'Mako', displayName: 'Mako', achievementPoints: 340 },
  { walletAddress: 'mock_chilliminer', companyName: 'ChilliMiner', displayName: 'ChilliMiner', achievementPoints: 180 },
  { walletAddress: 'mock_kryptoknight', companyName: 'Kryptoknight', displayName: 'Kryptoknight', achievementPoints: 13890 },
  { walletAddress: 'mock_argent9999', companyName: 'Argent 9999', displayName: 'Argent 9999', achievementPoints: 20000 },
  { walletAddress: 'mock_ka1111', companyName: 'KA1111', displayName: 'KA1111', achievementPoints: 2080 },
  { walletAddress: 'mock_burglecorps', companyName: 'BurgleCorps', displayName: 'BurgleCorps', achievementPoints: 5560 },
  { walletAddress: 'mock_ken1320', companyName: 'Ken1320', displayName: 'Ken1320', achievementPoints: 120 },
  { walletAddress: 'mock_hamfish', companyName: 'hamfish', displayName: 'hamfish', achievementPoints: 9800 },
  { walletAddress: 'mock_sora', companyName: 'sora', displayName: 'sora', achievementPoints: 210 },
  { walletAddress: 'mock_jr', companyName: 'Jr', displayName: 'Jr', achievementPoints: 45 },
  { walletAddress: 'mock_wcorp', companyName: 'W Corp', displayName: 'W Corp', achievementPoints: 14150 },
  { walletAddress: 'mock_ikarus', companyName: 'ikarus', displayName: 'ikarus', achievementPoints: 6100 },
  { walletAddress: 'mock_mojamtz', companyName: 'Mojamtz', displayName: 'Mojamtz', achievementPoints: 1400 },
  { walletAddress: 'mock_argh', companyName: 'argh', displayName: 'argh', achievementPoints: 225 },
  { walletAddress: 'mock_bigolringybingy', companyName: 'Big ol Ringy Bingy', displayName: 'Big ol Ringy Bingy', achievementPoints: 17890 },
  { walletAddress: 'mock_mekgold', companyName: 'MekGold', displayName: 'MekGold', achievementPoints: 3290 },
  { walletAddress: 'mock_goldmine', companyName: 'goldmine', displayName: 'goldmine', achievementPoints: 85 },
  { walletAddress: 'mock_fourfivetjeff', companyName: 'FourFiveJeff', displayName: 'FourFiveJeff', achievementPoints: 4700 },
  { walletAddress: 'mock_arrowhead', companyName: 'Arrowhead Integrated Solutions', displayName: 'Arrowhead Integrated Solutions', achievementPoints: 60 },
  { walletAddress: 'mock_benzington', companyName: 'Benzington', displayName: 'Benzington', achievementPoints: 10380 },
  { walletAddress: 'mock_livelovelevelup', companyName: 'Livelovelevelup', displayName: 'Livelovelevelup', achievementPoints: 165 },
  { walletAddress: 'mock_blove', companyName: 'BLove', displayName: 'BLove', achievementPoints: 8420 },
  { walletAddress: 'mock_cracksey', companyName: 'Cracksey', displayName: 'Cracksey', achievementPoints: 110 },
  { walletAddress: 'mock_saturninellc', companyName: 'saturnine llc', displayName: 'saturnine llc', achievementPoints: 25 },
  { walletAddress: 'mock_actionhenk', companyName: 'Actionhenk', displayName: 'Actionhenk', achievementPoints: 5195 },
];

// Character limit
const MAX_MESSAGE_LENGTH = 2000;

// Format relative timestamp - shows relative for <24h, full date/time after
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  // After 24 hours, show full date and time
  const date = new Date(timestamp);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return `${month} ${day}, ${year} at ${time}`;
}

export default function MessagingSystemAdminContent() {
  // Subtab state
  const [activeSubtab, setActiveSubtab] = useState<MessagingSubtab>('support');

  // State for dual-corporation testing
  const [activeCorp, setActiveCorp] = useState(TEST_CORPORATIONS[0]);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [isNewConversation, setIsNewConversation] = useState(false); // For starting new conversations
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; filename: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [corpSearchQuery, setCorpSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<{ walletAddress: string; companyName: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin view state
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminSelectedConversationId, setAdminSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [showDeletedMessages, setShowDeletedMessages] = useState(false);

  // Blocked users state
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);

  // Error lightbox state
  const [errorLightbox, setErrorLightbox] = useState<{ title: string; message: string } | null>(null);

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

  // Get all corporations for new conversation search
  const allCorporations = useQuery(api.messaging.getAllCorporations, {
    excludeWallet: activeCorp.walletAddress,
  });

  // Admin queries
  const allConversationsAdmin = useQuery(
    api.messaging.getAllConversationsAdmin,
    activeSubtab === 'admin' ? { searchQuery: adminSearchQuery || undefined } : 'skip'
  );

  const adminMessages = useQuery(
    api.messaging.getMessagesAdmin,
    adminSelectedConversationId ? { conversationId: adminSelectedConversationId } : 'skip'
  );

  // Query for deleted messages in admin view
  const deletedMessages = useQuery(
    api.messaging.getDeletedMessagesAdmin,
    adminSelectedConversationId && showDeletedMessages ? { conversationId: adminSelectedConversationId } : 'skip'
  );

  // Upload quota query - shows user their remaining uploads for the day
  const uploadQuota = useQuery(api.messageAttachments.getUploadQuota, {
    walletAddress: activeCorp.walletAddress,
  });

  // Query for message counts when conversation is selected
  const messageCount = useQuery(
    api.messaging.getConversationMessageCount,
    adminSelectedConversationId ? { conversationId: adminSelectedConversationId } : 'skip'
  );

  // Query for blocked users
  const blockedUsers = useQuery(
    api.messaging.getBlockedUsers,
    showBlockedUsers ? { walletAddress: activeCorp.walletAddress } : 'skip'
  );

  // Convex mutations
  const sendMessage = useMutation(api.messaging.sendMessage);
  const markAsRead = useMutation(api.messaging.markConversationAsRead);
  const setTypingIndicator = useMutation(api.messaging.setTypingIndicator);
  const deleteMessage = useMutation(api.messaging.deleteMessage);
  const deleteConversation = useMutation(api.messaging.deleteConversation);
  const generateUploadUrl = useMutation(api.messageAttachments.generateUploadUrl);
  const validateUpload = useMutation(api.messageAttachments.validateUpload);
  const deleteUpload = useMutation(api.messageAttachments.deleteUpload);

  // Admin mutations
  const disableConversationAdmin = useMutation(api.messaging.disableConversationAdmin);
  const enableConversationAdmin = useMutation(api.messaging.enableConversationAdmin);
  const deleteConversationAdmin = useMutation(api.messaging.deleteConversationAdmin);
  const deleteMessageAdmin = useMutation(api.messaging.deleteMessageAdmin);

  // Block/unblock mutations
  const unblockUser = useMutation(api.messaging.unblockUser);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Reset deleted messages view when switching admin conversations
  useEffect(() => {
    setShowDeletedMessages(false);
  }, [adminSelectedConversationId]);

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

    // Check if conversation is disabled before sending
    const currentConv = conversations?.find((c: any) => c._id === selectedConversationId);
    // Only use existingConversation if we're in the test corp conversation
    const otherTestCorp = TEST_CORPORATIONS.find(c => c.id !== activeCorp.id);
    const isTestCorpConversation = selectedConversationId === existingConversation?._id ||
      (isNewConversation && selectedRecipient?.walletAddress === otherTestCorp?.walletAddress);
    const isDisabled = currentConv?.disabledByAdmin ||
      (isTestCorpConversation && existingConversation?.disabledByAdmin);
    if (isDisabled) {
      const reason = currentConv?.disabledReason ||
        (isTestCorpConversation ? existingConversation?.disabledReason : undefined) ||
        'Terms of Service violation';
      setErrorLightbox({
        title: 'Conversation Disabled',
        message: `This conversation has been disabled by an administrator. You cannot send messages.\n\nReason: ${reason}`,
      });
      return;
    }

    // Check if any attachments are still uploading
    if (pendingAttachments.some(a => a.uploading)) {
      setErrorLightbox({
        title: 'Upload in Progress',
        message: 'Please wait for uploads to complete before sending.',
      });
      return;
    }

    // Determine recipient - use selectedRecipient if in new conversation mode, otherwise use test corp
    const recipientWallet = selectedRecipient?.walletAddress ||
      TEST_CORPORATIONS.find(c => c.id !== activeCorp.id)?.walletAddress;

    if (!recipientWallet) {
      console.error('[📎SEND] No recipient wallet address');
      return;
    }

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
        recipientWallet: recipientWallet,
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
      setIsNewConversation(false);
      setSelectedRecipient(null); // Clear recipient after sending

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('[📎SEND] Failed to send message:', error);

      // Clean up uploaded attachments since message failed to send
      // This prevents orphaned files in storage
      const uploadedAttachments = pendingAttachments.filter(a => a.storageId && !a.error);
      if (uploadedAttachments.length > 0) {
        console.log('[📎SEND] Cleaning up', uploadedAttachments.length, 'orphaned attachments');
        // Clean up in parallel, don't block on errors
        await Promise.allSettled(
          uploadedAttachments.map(a =>
            deleteUpload({
              storageId: a.storageId!,
              walletAddress: activeCorp.walletAddress,
            })
          )
        );
      }

      // Show user-friendly error in custom lightbox
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      // Check if it's a TOS violation error
      if (errorMessage.includes('Terms of Service') || errorMessage.includes('disabled')) {
        setErrorLightbox({
          title: 'Conversation Disabled',
          message: errorMessage,
        });
      } else {
        setErrorLightbox({
          title: 'Message Failed',
          message: errorMessage,
        });
      }
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
    setSelectedRecipient(null);
  };

  // Open the new conversation lightbox
  const openNewConversation = () => {
    setCorpSearchQuery('');
    setShowNewConversation(true);
  };

  // Select a corporation to message
  const selectCorporation = async (corp: { walletAddress: string; companyName: string }) => {
    // Check if conversation already exists
    const existingConv = conversations?.find(
      (c: any) => c.otherParticipant.walletAddress === corp.walletAddress
    );

    if (existingConv) {
      // Select existing conversation
      setSelectedConversationId(existingConv._id);
      setIsNewConversation(false);
      setSelectedRecipient(null);
    } else {
      // Enter new conversation mode with this recipient
      setSelectedConversationId(null);
      setIsNewConversation(true);
      setSelectedRecipient(corp);
    }

    setShowNewConversation(false);
    setCorpSearchQuery('');
  };

  // Filter corporations based on search query
  // Use mock data for testing if database is empty
  const corporationsToSearch = (allCorporations && allCorporations.length > 0)
    ? allCorporations
    : MOCK_CORPORATIONS_FOR_TESTING;

  const filteredCorporations = corporationsToSearch.filter((corp: { walletAddress: string; companyName: string }) =>
    corp.companyName?.toLowerCase().includes(corpSearchQuery.toLowerCase()) ?? false
  );

  // Legacy function for test corporations
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

  // Handle deleting a message (always deletes for everyone, like Discord)
  const handleDeleteMessage = async (messageId: Id<"messages">) => {
    if (!confirm('Delete this message? This cannot be undone.')) {
      return;
    }

    try {
      await deleteMessage({
        messageId,
        walletAddress: activeCorp.walletAddress,
        deleteForEveryone: true,
      });
    } catch (error) {
      console.error('[📨DELETE] Failed to delete message:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete message');
    }
  };

  // Handle deleting a conversation
  const handleDeleteConversation = async (conversationId: Id<"conversations">, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't select the conversation

    if (!confirm('Delete this conversation? You will no longer see messages from this chat.')) {
      return;
    }

    try {
      await deleteConversation({
        conversationId,
        walletAddress: activeCorp.walletAddress,
      });

      // If we were viewing this conversation, clear selection
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
    } catch (error) {
      console.error('[📨DELETE] Failed to delete conversation:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete conversation');
    }
  };

  // ============================================================================
  // ADMIN HANDLERS
  // ============================================================================

  // Admin: Disable a conversation
  const handleAdminDisableConversation = async (conversationId: Id<"conversations">) => {
    const reason = prompt('Enter reason for disabling (or leave blank for default):');
    if (reason === null) return; // Cancelled

    if (!confirm('Disable this conversation? Both users will see a ToS violation message and cannot send messages.')) {
      return;
    }

    try {
      await disableConversationAdmin({
        conversationId,
        reason: reason || undefined,
      });
    } catch (error) {
      console.error('[🛡️ADMIN] Failed to disable conversation:', error);
      alert(error instanceof Error ? error.message : 'Failed to disable conversation');
    }
  };

  // Admin: Re-enable a conversation
  const handleAdminEnableConversation = async (conversationId: Id<"conversations">) => {
    if (!confirm('Re-enable this conversation? Users will be able to message again.')) {
      return;
    }

    try {
      await enableConversationAdmin({ conversationId });
    } catch (error) {
      console.error('[🛡️ADMIN] Failed to enable conversation:', error);
      alert(error instanceof Error ? error.message : 'Failed to enable conversation');
    }
  };

  // Admin: Delete a conversation permanently
  const handleAdminDeleteConversation = async (conversationId: Id<"conversations">) => {
    if (!confirm('PERMANENTLY DELETE this conversation and all messages? This cannot be undone!')) {
      return;
    }

    if (!confirm('Are you ABSOLUTELY SURE? All messages will be permanently deleted.')) {
      return;
    }

    try {
      await deleteConversationAdmin({ conversationId });
      if (adminSelectedConversationId === conversationId) {
        setAdminSelectedConversationId(null);
      }
    } catch (error) {
      console.error('[🛡️ADMIN] Failed to delete conversation:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete conversation');
    }
  };

  // Admin: Delete a message
  const handleAdminDeleteMessage = async (messageId: Id<"messages">) => {
    if (!confirm('Delete this message? It will show as "[Deleted by admin]" to users.')) {
      return;
    }

    try {
      await deleteMessageAdmin({ messageId });
    } catch (error) {
      console.error('[🛡️ADMIN] Failed to delete message:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete message');
    }
  };

  // Handle unblocking a user
  const handleUnblockUser = async (blockedWallet: string, companyName: string) => {
    if (!confirm(`Unblock ${companyName}? They will be able to message you again.`)) {
      return;
    }

    try {
      await unblockUser({
        blockerWallet: activeCorp.walletAddress,
        blockedWallet: blockedWallet,
      });
    } catch (error) {
      console.error('[🚫BLOCK] Failed to unblock user:', error);
      alert(error instanceof Error ? error.message : 'Failed to unblock user');
    }
  };

  // Get the selected admin conversation details
  const selectedAdminConversation = allConversationsAdmin?.conversations?.find(
    (c: any) => c._id === adminSelectedConversationId
  );

  return (
    <div
      className="min-h-[800px] rounded-lg overflow-hidden relative"
      style={{
        backgroundImage: `url(${getMediaUrl('/colored-bg-1.webp')})`,
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
            View and manage all user conversations
          </p>
        </div>

        {/* Subtabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveSubtab('admin')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSubtab === 'admin'
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-black/30 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            Admin View (All Conversations)
          </button>
          <button
            onClick={() => setActiveSubtab('support')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeSubtab === 'support'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-black/30 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Support
          </button>
        </div>

        {/* ============================================================ */}
        {/* ADMIN SUBTAB */}
        {/* ============================================================ */}
        {activeSubtab === 'admin' && (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                placeholder="Search by corporation name or stake address..."
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>

            {/* Main Admin Area */}
            <div className="grid grid-cols-3 gap-6">
              {/* All Conversations Panel */}
              <div className="col-span-1 bg-black/40 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white">All Conversations</h2>
                  <div className="text-sm text-gray-500">
                    {allConversationsAdmin?.conversations?.length ?? 0} shown
                    {allConversationsAdmin?.hasMore && ' (more available)'}
                  </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  {allConversationsAdmin?.conversations?.map((conv: any) => (
                    <div
                      key={conv._id}
                      onClick={() => setAdminSelectedConversationId(conv._id)}
                      className={`group p-4 border-b border-gray-700/50 cursor-pointer transition-colors ${
                        adminSelectedConversationId === conv._id
                          ? 'bg-red-500/10'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Both participant avatars */}
                        <div className="flex -space-x-2 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-800">
                            <img
                              src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(conv.participant1)}`)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-800">
                            <img
                              src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(conv.participant2)}`)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-white font-medium text-sm">
                            <span className="truncate">{conv.participant1Info.companyName}</span>
                            <span className="text-gray-500">↔</span>
                            <span className="truncate">{conv.participant2Info.companyName}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-gray-500 text-xs">
                              {conv.messageCount} messages
                            </div>
                            <div className="text-gray-500 text-xs">
                              {formatRelativeTime(conv.lastMessageAt)}
                            </div>
                          </div>
                          {conv.disabledByAdmin && (
                            <div className="mt-1 text-xs text-red-400 font-medium">
                              ⚠️ DISABLED
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {allConversationsAdmin?.conversations?.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <div>No conversations found</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Viewer Panel */}
              <div className="col-span-2 bg-black/40 rounded-xl border border-gray-700 flex flex-col overflow-hidden">
                {adminSelectedConversationId && selectedAdminConversation ? (
                  <>
                    {/* Conversation Header with Admin Controls */}
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-800">
                              <img
                                src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(selectedAdminConversation.participant1)}`)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-800">
                              <img
                                src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(selectedAdminConversation.participant2)}`)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {selectedAdminConversation.participant1Info.companyName} ↔ {selectedAdminConversation.participant2Info.companyName}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {messageCount ? `${messageCount.visible} messages` : 'Loading...'}
                              {messageCount && messageCount.deleted > 0 && (
                                <span className="ml-2 text-purple-400">({messageCount.deleted} deleted)</span>
                              )}
                              {selectedAdminConversation.disabledByAdmin && (
                                <span className="ml-2 text-red-400">• DISABLED</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2">
                          {/* View Deleted Messages Toggle */}
                          {messageCount && messageCount.deleted > 0 && (
                            <button
                              onClick={() => setShowDeletedMessages(!showDeletedMessages)}
                              className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                                showDeletedMessages
                                  ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                                  : 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                              }`}
                            >
                              {showDeletedMessages ? 'Hide' : 'View'} Deleted ({messageCount.deleted})
                            </button>
                          )}
                          {selectedAdminConversation.disabledByAdmin ? (
                            <button
                              onClick={() => handleAdminEnableConversation(adminSelectedConversationId)}
                              className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                            >
                              Re-enable
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAdminDisableConversation(adminSelectedConversationId)}
                              className="px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
                            >
                              Disable (ToS)
                            </button>
                          )}
                          <button
                            onClick={() => handleAdminDeleteConversation(adminSelectedConversationId)}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[400px]">
                      {/* ToS Disabled Banner - Admin View */}
                      {selectedAdminConversation?.disabledByAdmin && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">⚠️</div>
                            <div>
                              <div className="text-red-400 font-semibold mb-1">Conversation Disabled</div>
                              <div className="text-red-300/80 text-sm">
                                This conversation has been disabled by an administrator due to a Terms of Service violation.
                                You may no longer interact with this corporation. If you feel this was a mistake, please
                                reach out to us on Discord by creating a ticket.
                              </div>
                              {selectedAdminConversation.disabledReason && (
                                <div className="text-red-400/70 text-sm mt-2">
                                  <span className="font-medium">Reason:</span> {selectedAdminConversation.disabledReason}
                                </div>
                              )}
                              {selectedAdminConversation.disabledAt && (
                                <div className="text-red-400/60 text-xs mt-2">
                                  Disabled: {formatRelativeTime(selectedAdminConversation.disabledAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Deleted Messages Section */}
                      {showDeletedMessages && deletedMessages && deletedMessages.length > 0 && (
                        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                          <div className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                            <span>🗑️</span>
                            <span>Deleted Messages ({deletedMessages.length})</span>
                          </div>
                          <div className="space-y-3">
                            {deletedMessages.map((msg: any) => (
                              <div key={msg._id} className="flex items-start gap-3 p-2 bg-black/30 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                  <img
                                    src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(msg.senderId)}`)}
                                    alt=""
                                    className="w-full h-full object-cover opacity-50"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-purple-400/70 font-medium text-xs">
                                      {msg.senderInfo.companyName}
                                    </span>
                                    <span className="text-gray-600 text-xs">
                                      {formatRelativeTime(msg.createdAt)}
                                    </span>
                                    {msg.deletedByAdmin && (
                                      <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                                        Admin deleted
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-gray-400 text-sm break-words">
                                    {msg.content || '[No content]'}
                                  </div>
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                      {msg.attachments.map((att: any, idx: number) => (
                                        <button
                                          key={idx}
                                          onClick={() => setLightboxImage({ url: att.url, filename: att.filename })}
                                          className="block opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                          <img
                                            src={att.url}
                                            alt={att.filename}
                                            className="max-w-[80px] max-h-[80px] rounded object-cover border border-purple-500/30"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {adminMessages?.messages?.map((msg: any) => (
                        <div
                          key={msg._id}
                          className="group flex items-start gap-3"
                        >
                          {/* Sender avatar */}
                          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                            <img
                              src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(msg.senderId)}`)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 font-medium text-sm">
                                {msg.senderInfo.companyName}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {formatRelativeTime(msg.createdAt)}
                              </span>
                              {/* Read status indicator */}
                              {msg.status && (
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    msg.status === 'read'
                                      ? 'bg-green-500/20 text-green-400'
                                      : msg.status === 'delivered'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                  }`}
                                  title={msg.readAt ? `Read at ${new Date(msg.readAt).toLocaleString()}` : undefined}
                                >
                                  {msg.status === 'read' ? '✓✓ Read' : msg.status === 'delivered' ? '✓ Delivered' : '○ Sent'}
                                </span>
                              )}
                              {/* Admin delete button */}
                              {!msg.isDeleted && (
                                <button
                                  onClick={() => handleAdminDeleteMessage(msg._id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                                  title="Delete message"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            {/* Message content */}
                            <div className={`mt-1 ${msg.isDeleted ? 'text-gray-500 italic' : 'text-white'}`}>
                              {msg.content || (msg.isDeleted ? '[Deleted]' : '')}
                            </div>
                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && !msg.isDeleted && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {msg.attachments.map((att: any, idx: number) => (
                                  <button
                                    key={idx}
                                    onClick={() => setLightboxImage({ url: att.url, filename: att.filename })}
                                    className="block"
                                  >
                                    <img
                                      src={att.url}
                                      alt={att.filename}
                                      className="max-w-[150px] max-h-[150px] rounded-lg object-cover border border-white/10 hover:border-cyan-500/50 transition-colors"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {adminMessages?.messages?.length === 0 && (
                        <div className="text-center text-gray-500 py-16">
                          <div className="text-4xl mb-2">💬</div>
                          <div>No messages in this conversation</div>
                        </div>
                      )}
                    </div>

                    {/* Read-only notice */}
                    <div className="p-4 border-t border-gray-700 bg-black/20">
                      <div className="text-center text-gray-500 text-sm">
                        Admin View (Read-Only)
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🔍</div>
                      <div className="text-lg">Select a conversation to view</div>
                      <div className="text-sm">Messages will appear here</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Stats */}
            <div className="mt-6 p-4 bg-black/40 rounded-xl border border-gray-700">
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Admin Stats (Current Page)</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Conversations Shown:</span>{' '}
                  <span className="text-white">{allConversationsAdmin?.conversations?.length ?? 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Disabled:</span>{' '}
                  <span className="text-red-400">{allConversationsAdmin?.conversations?.filter((c: any) => c.disabledByAdmin).length ?? 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Active:</span>{' '}
                  <span className="text-green-400">{allConversationsAdmin?.conversations?.filter((c: any) => !c.disabledByAdmin).length ?? 0}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* SUPPORT SUBTAB */}
        {/* ============================================================ */}
        {activeSubtab === 'support' && (
          <SupportInbox />
        )}
      </div>

      {/* Image Lightbox - rendered via portal to escape parent stacking context */}
      {mounted && lightboxImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          {/* Liquid glass container - hugs image exactly */}
          <div
            className="inline-block bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Image */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.filename}
              className="block max-w-[85vw] max-h-[80vh] rounded-xl"
            />
          </div>
          {/* Close text - outside the lightbox */}
          <button
            onClick={() => setLightboxImage(null)}
            className="mt-4 text-gray-400 hover:text-gray-300 text-sm transition-colors"
          >
            Close
          </button>
        </div>,
        document.body
      )}

      {/* New Conversation Lightbox */}
      {mounted && showNewConversation && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setShowNewConversation(false)}
        >
          {/* Lightbox container */}
          <div
            className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white mb-3">New Conversation</h2>
              {/* Search Input */}
              <input
                type="text"
                value={corpSearchQuery}
                onChange={(e) => setCorpSearchQuery(e.target.value)}
                placeholder="Search corporations..."
                autoFocus
                className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>

            {/* Corporation List */}
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {filteredCorporations.length > 0 ? (
                filteredCorporations.map((corp: { walletAddress: string; companyName: string; displayName: string }) => (
                  <button
                    key={corp.walletAddress}
                    onClick={() => selectCorporation(corp)}
                    className="w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
                        <img
                          src={getMediaUrl(`/mek-images/150px/${getMekImageForWallet(corp.walletAddress)}`)}
                          alt={corp.companyName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{corp.companyName}</div>
                      </div>
                      <div className="flex items-baseline gap-1 flex-shrink-0">
                        <span
                          className="text-white text-lg tracking-wider"
                          style={{ fontFamily: 'Saira, sans-serif' }}
                        >
                          {((corp as any).achievementPoints ?? 0).toLocaleString()}
                        </span>
                        <span className="font-bold text-cyan-400 text-xs">AP</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : corpSearchQuery ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-2xl mb-2">🔍</div>
                  <div>No corporations found</div>
                  <div className="text-sm">Try a different search term</div>
                </div>
              ) : corporationsToSearch.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-2xl mb-2">📭</div>
                  <div>No corporations available</div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-2xl mb-2">⏳</div>
                  <div>Loading corporations...</div>
                </div>
              )}
            </div>
          </div>

          {/* Close text - outside the lightbox */}
          <button
            onClick={() => setShowNewConversation(false)}
            className="mt-4 text-gray-400 hover:text-gray-300 text-sm transition-colors"
          >
            Close
          </button>
        </div>,
        document.body
      )}

      {/* Error Lightbox - for TOS violations, send failures, etc. */}
      {mounted && errorLightbox && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setErrorLightbox(null)}
        >
          {/* Lightbox container */}
          <div
            className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-red-500/20 bg-red-500/10">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚠️</div>
                <h2 className="text-lg font-semibold text-red-400">{errorLightbox.title}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="text-gray-300 text-sm whitespace-pre-line">
                {errorLightbox.message}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setErrorLightbox(null)}
                className="w-full py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
              >
                Understood
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
