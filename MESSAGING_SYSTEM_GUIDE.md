# Mek Tycoon Corporation Messaging System - Implementation Guide

## Overview
This document contains research and best practices for implementing a corporation-to-corporation messaging system in Mek Tycoon.

---

## Database Schema Design

### Core Tables

#### 1. Messages Table
```typescript
// convex/schema.ts
messages: defineTable({
  senderId: v.id("corporations"),      // Corporation sending the message
  recipientId: v.id("corporations"),   // Corporation receiving the message
  conversationId: v.id("conversations"), // Group messages by conversation
  content: v.string(),                 // Message text content
  status: v.string(),                  // "sent" | "delivered" | "read"
  createdAt: v.number(),               // Timestamp when sent
  readAt: v.optional(v.number()),      // Timestamp when read (optional)
  editedAt: v.optional(v.number()),    // Timestamp if edited (optional)
  isDeleted: v.boolean(),              // Soft delete flag
})
  .index("by_conversation", ["conversationId", "createdAt"])
  .index("by_sender", ["senderId", "createdAt"])
  .index("by_recipient", ["recipientId", "createdAt"])
  .index("by_recipient_unread", ["recipientId", "status"])
```

#### 2. Conversations Table
```typescript
conversations: defineTable({
  participantIds: v.array(v.id("corporations")), // Array of 2 corporation IDs
  lastMessageId: v.optional(v.id("messages")),   // Reference to most recent message
  lastMessageAt: v.number(),                      // Timestamp of last activity
  lastMessagePreview: v.optional(v.string()),    // Truncated preview text
  createdAt: v.number(),
})
  .index("by_participant", ["participantIds"])
  .index("by_last_activity", ["lastMessageAt"])
```

#### 3. Unread Counts Table (for performance)
```typescript
unreadCounts: defineTable({
  corporationId: v.id("corporations"),
  conversationId: v.id("conversations"),
  count: v.number(),
})
  .index("by_corporation", ["corporationId"])
  .index("by_conversation", ["corporationId", "conversationId"])
```

### Design Decisions
- **Soft delete over hard delete**: Keep messages for audit trail, just mark `isDeleted: true`
- **Separate unread counts**: Expensive to compute on the fly; cache in dedicated table
- **Conversation grouping**: Easier to fetch message history and manage read states
- **Indexes are critical**: Always index by conversation + timestamp for efficient pagination

---

## Message Status & Delivery

### Status Lifecycle
```
sent → delivered → read
```

| Status | Visual | Meaning |
|--------|--------|---------|
| `sent` | Single gray checkmark | Message left sender's device |
| `delivered` | Double gray checkmarks | Message reached recipient's device |
| `read` | Double blue checkmarks | Recipient opened conversation |

### Implementation Pattern (WhatsApp-style)
```typescript
// When message is created
status: "sent"

// When recipient's client receives (via Convex subscription)
status: "delivered"

// When recipient opens the conversation
status: "read", readAt: Date.now()
```

### Mark as Read Logic
```typescript
// Call when user opens a conversation
async function markConversationAsRead(conversationId: Id<"conversations">, myCorpId: Id<"corporations">) {
  // Update all unread messages in this conversation
  const unreadMessages = await ctx.db
    .query("messages")
    .withIndex("by_conversation", q => q.eq("conversationId", conversationId))
    .filter(q => q.and(
      q.eq(q.field("recipientId"), myCorpId),
      q.neq(q.field("status"), "read")
    ))
    .collect();

  for (const msg of unreadMessages) {
    await ctx.db.patch(msg._id, { status: "read", readAt: Date.now() });
  }

  // Reset unread count
  await resetUnreadCount(conversationId, myCorpId);
}
```

---

## Timestamp Display Patterns

### Relative Time Formatting
Use human-friendly relative timestamps that update dynamically:

| Time Elapsed | Display |
|--------------|---------|
| < 1 minute | "Just now" |
| 1-59 minutes | "5 minutes ago" |
| 1-23 hours | "2 hours ago" |
| Yesterday | "Yesterday at 3:45 PM" |
| Same week | "Tuesday at 3:45 PM" |
| Same year | "Mar 15 at 3:45 PM" |
| Older | "Mar 15, 2024" |

### Implementation with `javascript-time-ago`
```typescript
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

function formatTimestamp(timestamp: number): string {
  return timeAgo.format(timestamp);
}
```

### Grouping Messages by Date
- Show date separator when day changes
- Group consecutive messages from same sender (no timestamp between them)
- Show timestamp on hover or for last message in group

---

## Typing Indicators

### How It Works
1. User starts typing → emit "typing.start" event
2. Timer starts (typically 3-5 seconds)
3. If user stops typing OR timer expires → emit "typing.stop"
4. UI shows "Corporation Name is typing..." with animated dots

### Implementation Pattern
```typescript
// Client-side debounced typing indicator
let typingTimeout: NodeJS.Timeout | null = null;

function handleInputChange(text: string) {
  setMessageText(text);

  // Clear existing timeout
  if (typingTimeout) clearTimeout(typingTimeout);

  // Emit typing start
  sendTypingIndicator(conversationId, true);

  // Set timeout to clear typing after 3 seconds of inactivity
  typingTimeout = setTimeout(() => {
    sendTypingIndicator(conversationId, false);
  }, 3000);
}
```

### Visual Display
```
┌──────────────────────────────────┐
│ MekCorp Industries is typing...  │
│ ●●●                              │
└──────────────────────────────────┘
```

Animated dots pattern: `●○○ → ○●○ → ○○● → ●○○`

---

## Character Limits & Validation

### Recommended Limits
| Field | Limit | Rationale |
|-------|-------|-----------|
| Message content | 2,000 characters | Enough for detailed messages, prevents spam |
| Preview in list | 50-80 characters | Quick scanning in inbox |
| Corporation name | 50 characters | Display constraints |

### Character Counter UI
```
┌─────────────────────────────────────────┐
│ Type your message...                    │
│                                         │
│                            1,847/2,000  │
└─────────────────────────────────────────┘
```

Visual states:
- **Normal** (< 80%): Gray counter
- **Warning** (80-99%): Yellow counter
- **At limit** (100%): Red counter, input disabled
- **Over limit**: Red counter with negative, highlight excess text

### Input Sanitization
```typescript
function sanitizeMessage(input: string): string {
  return input
    .trim()                           // Remove leading/trailing whitespace
    .replace(/\s+/g, ' ')             // Normalize multiple spaces
    .slice(0, 2000);                  // Enforce character limit
}

// Server-side validation (Convex)
function validateMessage(content: string): boolean {
  if (!content || content.length === 0) return false;
  if (content.length > 2000) return false;
  // Add additional checks (profanity filter, spam detection, etc.)
  return true;
}
```

---

## Notification & Unread Badges

### Badge Display Rules
- Show count bubble on Messages nav item
- Show count on individual conversations in inbox
- Max display: "99+" for counts over 99
- Clear badge when conversation is opened AND scrolled to bottom

### Unread Count Strategy
```typescript
// Efficient: Pre-computed counts in dedicated table
const unreadCount = await ctx.db
  .query("unreadCounts")
  .withIndex("by_corporation", q => q.eq("corporationId", myCorpId))
  .collect();

const totalUnread = unreadCount.reduce((sum, c) => sum + c.count, 0);
```

### Real-time Updates (Convex Subscriptions)
```typescript
// Subscribe to unread count changes
const totalUnread = useQuery(api.messages.getTotalUnreadCount, { corporationId });

// In navigation/header
{totalUnread > 0 && (
  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
    {totalUnread > 99 ? '99+' : totalUnread}
  </span>
)}
```

---

## Message Bubble Design

### Layout Pattern
```
INCOMING (left-aligned)                    OUTGOING (right-aligned)
┌────────────────────┐                              ┌────────────────────┐
│ Message content    │                              │ Message content    │
│ here...            │                              │ here...            │
│              12:34 │                              │ 12:34 ✓✓          │
└────────────────────┘                              └────────────────────┘
```

### Grouping Consecutive Messages
When multiple messages from same sender:
```
┌────────────────────┐  ← rounded all corners
│ First message      │
└────────────────────┘  ← rounded all corners

│ Second message     │  ← flat corners on sender's side
└────────────────────┘

│ Third message      │  ← flat corners on sender's side
│              12:34 │  ← timestamp only on last
└────────────────────┘  ← rounded all corners
```

### CSS for Message Grouping
```css
/* First message in group */
.message-first { border-radius: 18px; }

/* Middle messages */
.message-middle {
  border-radius: 18px;
  border-top-left-radius: 4px;    /* Incoming */
  border-bottom-left-radius: 4px;
}

/* Last message in group */
.message-last {
  border-radius: 18px;
  border-top-left-radius: 4px;    /* Incoming */
}
```

---

## Message Editing & Deletion

### Edit Rules
- **Time limit**: Allow edits within 15-30 minutes of sending
- **Visual indicator**: Show "(edited)" label after message text
- **No history**: Don't expose edit history to recipient (simpler UX)

### Delete Options
1. **Delete for me**: Hides message from sender's view only
2. **Delete for everyone**: Replaces message with "This message was deleted"

### Implementation
```typescript
// Soft delete
async function deleteMessage(messageId: Id<"messages">, deleteForEveryone: boolean) {
  const message = await ctx.db.get(messageId);

  if (deleteForEveryone) {
    // Check time limit (e.g., 1 hour)
    const timeSinceSent = Date.now() - message.createdAt;
    if (timeSinceSent > 60 * 60 * 1000) {
      throw new Error("Cannot delete message after 1 hour");
    }
    await ctx.db.patch(messageId, {
      isDeleted: true,
      content: "" // Clear content for privacy
    });
  } else {
    // Just hide from sender's view
    await ctx.db.patch(messageId, {
      hiddenFromSender: true
    });
  }
}
```

---

## UI Components Checklist

### Inbox/Conversation List
- [ ] List of conversations sorted by last activity
- [ ] Corporation avatar/icon
- [ ] Corporation name
- [ ] Last message preview (truncated)
- [ ] Relative timestamp
- [ ] Unread badge/indicator
- [ ] Online status indicator (optional)

### Conversation View
- [ ] Header with recipient corporation name
- [ ] Scrollable message area
- [ ] Date separators between days
- [ ] Message bubbles with proper alignment
- [ ] Read receipts (checkmarks)
- [ ] Typing indicator
- [ ] "Scroll to bottom" button when scrolled up
- [ ] Load more (pagination) when scrolling up

### Compose Area
- [ ] Multi-line text input
- [ ] Character counter
- [ ] Send button (disabled when empty)
- [ ] Keyboard shortcut (Enter to send, Shift+Enter for newline)
- [ ] Emoji picker (optional for V1)

### Empty States
- [ ] No conversations yet
- [ ] No messages in conversation
- [ ] Loading skeletons

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Send message | Enter |
| New line | Shift + Enter |
| Close conversation | Escape |
| Search conversations | Ctrl/Cmd + K |

---

## Performance Considerations

### Pagination
- Load 20-50 messages initially
- Load more on scroll up
- Use cursor-based pagination (not offset)

### Caching
- Cache conversation list
- Cache unread counts
- Invalidate on new message

### Subscriptions
- Subscribe to new messages in active conversation only
- Subscribe to unread count changes globally
- Unsubscribe when navigating away

---

## Security Considerations

### Server-Side Validation
- Verify sender owns the corporation
- Verify recipient corporation exists
- Rate limiting (prevent spam)
- Content length validation
- Profanity/spam filtering (optional)

### Privacy
- Messages only visible to participants
- Soft-delete preserves for moderation if needed
- No message forwarding (V1)

---

## Sources & References

### Database Design
- [GeeksforGeeks - Database for Messaging Systems](https://www.geeksforgeeks.org/dbms/how-to-design-a-database-for-messaging-systems/)
- [Redgate - Database Model for Messaging System](https://www.red-gate.com/blog/database-model-for-a-messaging-system)
- [Back4App - Real-Time Chat Schema](https://www.back4app.com/tutorials/how-to-design-a-database-schema-for-a-real-time-chat-and-messaging-app)

### UI/UX Best Practices
- [CometChat - Chat App Design Best Practices](https://www.cometchat.com/blog/chat-app-design-best-practices)
- [Nielsen Norman Group - Chat UX Guidelines](https://www.nngroup.com/articles/chat-ux/)
- [UXPin - Chat UI Design Introduction](https://www.uxpin.com/studio/blog/chat-user-interface-design/)
- [BricxLabs - 16 Chat UI Design Patterns 2025](https://bricxlabs.com/blogs/message-screen-ui-deisgn)

### Architecture
- [Medium - Chat Application System Design](https://medium.com/@m.romaniiuk/system-design-chat-application-1d6fbf21b372)
- [CometChat - Chat Application Architecture](https://www.cometchat.com/blog/chat-application-architecture-and-system-design)
- [Ably - Scalable Chat App Architecture](https://ably.com/blog/chat-app-architecture)
- [MirrorFly - Chat App System Design Guide 2025](https://www.mirrorfly.com/blog/chat-app-system-design/)

### Message Status & Receipts
- [Ably - Read Receipts for Chat Apps](https://ably.com/topic/read-receipts)
- [Sendbird - Delivery Receipt Notifications](https://sendbird.com/developer/tutorials/chat-message-status-notifications-delivery-receipts)

### Typing Indicators
- [PubNub - Typing Indicator Documentation](https://www.pubnub.com/docs/chat/sdks/messages/typing)
- [Stream - Typing Indicators in React Chat](https://getstream.io/chat/docs/react/typing_indicators/)

### Timestamps
- [javascript-time-ago NPM Package](https://www.npmjs.com/package/javascript-time-ago)
- [UX Stack Exchange - Chat Timestamp Display](https://ux.stackexchange.com/questions/105008/chat-app-timestamp-display)

### Input Validation
- [OWASP - Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [UX Stack Exchange - Character Limit Warning](https://ux.stackexchange.com/questions/19656/how-to-warn-a-user-they-are-approaching-the-character-limit-for-a-text-input-fie)

---

## Version History
- **v1.0** (Dec 2, 2025): Initial research and documentation
