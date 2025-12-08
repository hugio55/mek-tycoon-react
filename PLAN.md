# Support Chat System Implementation Plan

## Overview
Create a support chat system where players can message the Overexposed development team directly through the Communications lightbox. Admins can view and respond to all player support conversations from a dedicated tab in the Admin page.

---

## Architecture Decision: Special Wallet Address Approach

**Chosen approach**: Use a reserved wallet address `SUPPORT_OVEREXPOSED` to identify support conversations.

**Why this approach:**
- Minimal schema changes (no new tables or type fields needed)
- Reuses 100% of existing messaging infrastructure
- Support conversation behaves exactly like player-to-player chat
- Easy to query: just find conversations where participant = `SUPPORT_OVEREXPOSED`
- Clean separation in UI through props, not data structure

**Reserved identifier**: `SUPPORT_OVEREXPOSED` (constant, never a real wallet)

---

## Implementation Steps

### Phase 1: Database & Backend (convex/)

#### 1.1 Add support conversation helpers to `messaging.ts`

**New queries:**
- `getSupportConversation(walletAddress)` - Find or null for player's support chat
- `getAllSupportConversations()` - Admin query returning all support conversations with player names
- `getSupportUnreadCount()` - Admin badge showing total unread support messages

**New mutations:**
- `createSupportConversation(walletAddress)` - Creates support conversation for player if doesn't exist
- `sendSupportMessage(senderWallet, content, conversationId)` - Wrapper for sendMessage with SUPPORT_OVEREXPOSED as recipient/sender depending on who's sending
- `dismissSupportConversation(walletAddress)` - Sets hidden flag, records dismissal
- `reopenSupportConversation(walletAddress)` - Clears hidden flag

**Modify existing:**
- `getConversations` - Include support conversation (if not hidden) in results
- `sendMessage` - Allow messages to/from SUPPORT_OVEREXPOSED identifier

#### 1.2 Add constant for support identifier

In `convex/messaging.ts` or a shared constants file:
```
export const SUPPORT_WALLET_ID = "SUPPORT_OVEREXPOSED";
```

---

### Phase 2: Player-Facing UI (Communications Lightbox)

#### 2.1 Modify `MessagingSystem.tsx`

**Inbox changes:**
- Add "Overexposed Support" entry at TOP of conversation list (pinned position)
- Special styling: different background color, support icon (headset/help icon)
- Show "Support" label instead of corporation name
- Use Overexposed logo or support icon instead of Mek profile image

**Support conversation detection:**
- Check if conversation participant is `SUPPORT_OVEREXPOSED`
- Apply special styling and behavior for support chats

**New conversation handling:**
- If player searches "overexposed" or "support" in new conversation search
- Show "Reopen Support Chat" option if previously dismissed
- Clicking creates/reopens the support conversation

#### 2.2 Create Support Dismiss Confirmation Lightbox

**Trigger:** Player clicks X on support conversation

**Lightbox content:**
```
Title: "Close Support Chat?"

Body: "You are closing this support conversation with the
Overexposed development team.

If you ever want to open it back up, search 'Overexposed'
in the New Conversation menu."

Buttons: [Cancel] [Close Chat]
```

**On confirm:** Call `dismissSupportConversation` mutation

#### 2.3 Support Chat Header

When viewing support conversation, show custom header:
- "Overexposed Support" title
- "Development Team" subtitle
- Support icon (headset or help-circle)
- Optional: Average response time indicator

---

### Phase 3: Admin Support Tab

#### 3.1 Create `SupportInbox.tsx` component

**Location:** `src/components/SupportInbox.tsx`

**Layout:** Same two-column layout as MessagingSystem
- Left column: All player support conversations
- Right column: Selected conversation messages

**Left column (Conversations list):**
- Each row shows: Player corporation name, last message preview, timestamp
- Unread badge per conversation
- Sort by most recent activity (or unread first)
- Search/filter by player name

**Right column (Messages):**
- Full conversation history with player
- Reply input at bottom
- Same compose area as player messaging
- Send as "Overexposed Support"

**Special features:**
- Total unread count badge at top
- Mark as read when viewing
- Quick actions: Close conversation, Flag for follow-up (optional)

#### 3.2 Integrate into Admin Messaging System Tab

**Location:** `src/components/MessagingSystemAdmin.tsx`

**Add new tab:** "Support" alongside "Testing Tool" and "Admin View"

**Tab content:** Embed `SupportInbox` component

**Badge:** Show unread support message count on tab

---

### Phase 4: Quality of Life Features

#### 4.1 Auto-create support conversation

**When:** Player first opens Communications lightbox
**Action:** Check if support conversation exists, create if not
**Result:** Support chat always appears in inbox (unless dismissed)

#### 4.2 Unread notification integration

- Support messages count toward player's total unread badge
- Admin sees aggregate unread count for all support conversations

#### 4.3 Support-specific message styling (optional)

When admin sends message:
- Show "Overexposed Support" as sender name
- Different background color (gold/yellow theme)
- Optional: "Official Response" indicator

---

## File Changes Summary

### New Files
1. `src/components/SupportInbox.tsx` - Admin support inbox component
2. `src/components/SupportDismissLightbox.tsx` - Confirmation modal for dismissing support chat

### Modified Files
1. `convex/messaging.ts` - Add support conversation queries/mutations
2. `src/components/MessagingSystem.tsx` - Add support conversation handling in inbox
3. `src/components/MessagingSystemAdmin.tsx` - Add Support tab

---

## Database Behavior

### Support Conversation Record
```
conversations {
  participant1: "SUPPORT_OVEREXPOSED"  // or player wallet
  participant2: "player_wallet_address"  // or SUPPORT_OVEREXPOSED
  lastMessageAt: timestamp
  lastMessagePreview: "Thanks for reaching out..."
  hiddenForParticipant1: false  // Admin never hides
  hiddenForParticipant2: false  // Player can hide (dismiss)
  ...existing fields
}
```

### Query Patterns
- Player's inbox: All conversations where participant = playerWallet AND (not hidden OR is support)
- Admin support inbox: All conversations where participant = SUPPORT_OVEREXPOSED

---

## Edge Cases Handled

1. **Player dismisses support chat** → Hidden from inbox, can reopen via search
2. **Player sends message after dismissing** → Reopens conversation automatically
3. **Multiple support messages** → Uses same conversation, no duplicates
4. **Admin responds to dismissed chat** → Conversation unhides for player
5. **Player blocks support** → Should be prevented (can't block support)
6. **New player** → Support conversation auto-created on first Comms open

---

## Testing Plan

1. **Player flow:**
   - Open Communications → See support chat in inbox
   - Click support → See welcome message or empty chat
   - Send message → Message appears, sent to support
   - Close chat → See confirmation lightbox
   - Confirm close → Chat hidden from inbox
   - Search "overexposed" → See option to reopen
   - Reopen → Chat back in inbox with history

2. **Admin flow:**
   - Go to Admin → Messaging System → Support tab
   - See list of all player support conversations
   - Click conversation → See full history
   - Send reply → Player receives message
   - Message shows as from "Overexposed Support"

---

## User Decisions

1. **Welcome message**: YES - Auto-generate welcome message when support chat is first created
   - Message: "Welcome to Overexposed Support! How can we help you today?"
   - Sender: SUPPORT_OVEREXPOSED

2. **Support position**: PINNED AT TOP - Support always appears first in inbox, separate from other conversations

3. **Auto-reopen on admin reply**: YES - When admin sends a message to a dismissed support chat, it automatically unhides for the player
