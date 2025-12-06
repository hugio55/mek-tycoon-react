# NOTIFICATIONS - In-Game Notification System

**Purpose:** Master documentation for the player notification system, alert types, and UI components.
**Status:** Planning Phase
**Last Updated:** 2025-12-06

---

## System Overview

A notification system that alerts players to important in-game events. The system features:

1. **Bell Icon** - Visible in the top-right corner of all pages
2. **Notification Badge** - Glowing indicator showing unread count
3. **Dropdown Panel** - Shows recent notifications (quick view)
4. **"View All" Lightbox** - Full scrollable/paginated history of all notifications
5. **Clear Button** - Allows user to clear all notifications
6. **Deep Links** - Clicking a notification navigates to the relevant page/section

**Key Design Decisions:**
- **No sound effects** - Silent notifications only
- **No grouping** - Each notification is individual, never combined
- **100 notification cap** - Max 100 notifications per player, oldest auto-deleted when cap reached
- **Persist after viewing** - Read notifications stay in the list (just lose the "new" indicator)
- **Single color scheme** - No priority-based colors, keep it simple

**Display Limits:**
- **Dropdown**: 5 most recent notifications
- **Lightbox**: 10 notifications per page (10 pages max at 100 total)

---

## Part 1: UI Components

### Header Layout

The notification bell and messaging icon will sit together in the header:

```
[MEKS ▼] [Corporation Name]              [✉️] [🔔] [OE Logo]
         (left side)                    (right side icons)
```

**Icon Order (left to right):**
1. Messages icon (paper airplane) - links to existing messaging system
2. Notifications bell - new notification system
3. OE Logo

### Bell Icon Design

**Visual Style (Industrial Theme):**
- Bell shape with sharp/angular design
- Gold/yellow outline (`border-yellow-500/50`)
- Semi-transparent background (`bg-black/60`)
- Hover: Brighter glow, slight scale

**States:**
| State | Appearance |
|-------|------------|
| No unread | Bell outline only, muted |
| Has unread | Bell with glowing badge |
| Dropdown open | Bell highlighted/active |

### Notification Badge

**Badge Appearance:**
- Small circle overlapping top-right of bell
- Color: Yellow/gold (matches theme - `bg-yellow-400`)
- Shows count (1-9, then "9+")
- Hidden when unread count is 0
- Subtle glow animation for unread

### Dropdown Panel (Quick View)

**Trigger:** Click on bell icon

**Panel Design:**
- Appears below bell icon, anchored to right edge
- Width: ~320px
- Max height: ~400px with internal scroll
- Shows most recent **5 notifications**
- Background: `bg-black/95` with backdrop blur
- Border: `border-yellow-500/30`

**Panel Layout:**
```
┌─────────────────────────────────┐
│ NOTIFICATIONS                   │ ← Header
├─────────────────────────────────┤
│ ● Pit Stop Ready!               │ ← Unread (yellow dot)
│   Mek #1234 - Engineer          │
│   2 minutes ago                 │
├─────────────────────────────────┤
│   Level Up Ready!               │ ← Read (no dot)
│   Mek #5678 can advance         │
│   1 hour ago                    │
├─────────────────────────────────┤
│ ● Job Complete                  │ ← Unread
│   Mek #9012 finished shift      │
│   5 minutes ago                 │
├─────────────────────────────────┤
│      [View All Notifications]   │ ← Opens lightbox
│      [Clear All]                │ ← Clears everything
└─────────────────────────────────┘
```

### "View All" Lightbox

**Trigger:** Click "View All Notifications" button in dropdown

**Lightbox Design:**
- Full-screen modal (portal to body)
- Dark backdrop with blur
- Centered panel, ~600-800px wide, ~80vh tall
- Scrollable list of ALL notifications (up to 100 max)
- Paginated: **10 notifications per page**, "Load More" button to get next page

**Lightbox Layout:**
```
┌─────────────────────────────────────────────────────┐
│  ALL NOTIFICATIONS                           [X]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ● Pit Stop Ready!                    2 min ago     │
│    Mek #1234 - Choose a buff for Engineer           │
│    [Click to go to Slots]                           │
│  ─────────────────────────────────────────────────  │
│  ● Job Complete                       5 min ago     │
│    Mek #9012 finished Janitor shift                 │
│    [Click to go to Slots]                           │
│  ─────────────────────────────────────────────────  │
│    Level Up Ready!                    1 hour ago    │
│    Mek #5678 can advance to Level 3                 │
│    [Click to go to Slots]                           │
│  ─────────────────────────────────────────────────  │
│    Achievement Unlocked!              2 hours ago   │
│    "Gold Hoarder" earned                            │
│    [Click to go to Achievements]                    │
│                                                     │
│  ... (scrollable, paginated) ...                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    [Clear All Notifications]        │
└─────────────────────────────────────────────────────┘
```

### Individual Notification Item

**Components:**
- **Unread indicator**: Yellow dot on left (only for unread)
- **Title**: Bold, primary text (e.g., "Pit Stop Ready!")
- **Subtitle**: Supporting details (e.g., "Mek #1234 - Choose a buff")
- **Timestamp**: Relative time ("2 min ago", "1 hour ago", "Dec 5")
- **Click action**: Navigate to relevant page, marks as read

---

## Part 2: Notification Types

### Phase 1 Types (Initial Implementation)

| Type | Trigger | Title | Subtitle | Links To |
|------|---------|-------|----------|----------|
| `pit_stop_ready` | Mek reaches pit stop milestone | "Pit Stop Ready!" | "Mek [name] - Choose a buff for [job]" | /slots |
| `job_level_up` | Mek reaches next level threshold | "Level Up Ready!" | "Mek [name] can advance to Level X" | /slots |

### Future Types (Phase 2+)

| Type | Trigger | Title | Subtitle | Links To |
|------|---------|-------|----------|----------|
| `achievement_unlocked` | Achievement criteria met | "Achievement Unlocked!" | "[Achievement Name]" | /achievements |
| `essence_milestone` | Essence threshold reached | "Essence Milestone!" | "Collected X [type] essence" | /essence |
| `crafting_complete` | Crafting finishes | "Crafting Complete!" | "[Item] is ready to claim" | /crafting |
| `daily_reward` | Daily login bonus | "Daily Reward!" | "Claim your X gold" | /home |
| `system_announcement` | Admin broadcast | "[Custom Title]" | "[Custom message]" | varies |
| `new_message` | Corp sends message | "New Message" | "[Corp name]: First 10-12 words..." | /messages |

---

## Part 3: Backend Schema (Convex)

### Notifications Table

```typescript
notifications: defineTable({
  // Ownership
  userId: v.id("users"),           // Which player receives this

  // Content
  type: v.string(),                // Notification type key (pit_stop_ready, job_level_up, etc.)
  title: v.string(),               // Display title
  subtitle: v.optional(v.string()), // Supporting text

  // Linking
  linkTo: v.optional(v.string()),  // URL path to navigate to
  linkParams: v.optional(v.any()), // Additional params (mekId, etc.)

  // State
  isRead: v.boolean(),             // Has user clicked/viewed this?

  // Timestamps
  createdAt: v.number(),           // When notification was created

  // Source reference (for deduplication)
  sourceType: v.optional(v.string()), // "mek", "pit_stop", "achievement", etc.
  sourceId: v.optional(v.string()),   // ID of source entity
})
  .index("by_user", ["userId"])
  .index("by_user_unread", ["userId", "isRead"])
  .index("by_user_created", ["userId", "createdAt"])
```

**Note:** No `expiresAt` field - notifications are permanent until cleared.

---

## Part 4: Backend Functions

### Player Queries

```typescript
// Get user ID by wallet address
getUserIdByWallet(walletAddress) → userId | null

// Get unread count for badge
getUnreadCount(userId) → number

// Get recent notifications for dropdown (default: 5)
getRecentNotifications(userId, limit?: 5) → Notification[]

// Get all notifications for lightbox (paginated, default: 10 per page)
getAllNotifications(userId, cursor?, limit?: 10) → {
  notifications: Notification[],
  nextCursor?: number,
  hasMore: boolean
}
```

### Player Mutations

```typescript
// Mark single notification as read (called when user clicks it)
markAsRead(notificationId)

// Mark all as read
markAllAsRead(userId)

// Clear all notifications (user clicked "Clear All")
clearAllNotifications(userId)

// Create notification (internal - called by other systems)
// Enforces 100-notification cap per user, auto-deletes oldest
createNotification({
  userId,
  type,
  title,
  subtitle?,
  linkTo?,
  linkParams?,
  sourceType?,
  sourceId?,
})

// Create notification (public - for testing)
// Also enforces 100-notification cap per user
createNotificationPublic({ ...same args... })
```

### Admin Queries

```typescript
// Get all notifications system-wide (paginated, enriched with user data)
adminGetAllNotifications(limit?, cursor?) → {
  notifications: EnrichedNotification[],
  nextCursor?: number,
  hasMore: boolean,
  totalCount: number
}

// Get notifications for specific player by wallet address
adminGetPlayerNotifications(walletAddress, limit?) → {
  notifications: Notification[],
  user: { id, walletAddress, companyName } | null,
  totalCount: number
}

// Get notification statistics for dashboard
adminGetNotificationStats() → {
  totalCount: number,
  unreadCount: number,
  readCount: number,
  typeCounts: Record<string, number>,
  recentCount: number,  // Last 24 hours
  uniqueUsers: number
}
```

### Admin Mutations

```typescript
// Send notification to specific player
adminSendNotification({
  walletAddress,
  type,
  title,
  subtitle?,
  linkTo?,
  linkParams?
})

// Broadcast notification to ALL players
adminBroadcastNotification({
  type,
  title,
  subtitle?,
  linkTo?,
  linkParams?
}) → { success, sentCount, broadcastId }

// Delete specific notification
adminDeleteNotification(notificationId)

// Clear all notifications for a player
adminClearPlayerNotifications(walletAddress)
```

### Internal Triggers

Called by other Convex functions when events occur:

```typescript
// When pit stop milestone is reached
onPitStopReached(userId, mekId, mekName, jobKey, pitStopNumber) {
  await createNotification({
    userId,
    type: "pit_stop_ready",
    title: "Pit Stop Ready!",
    subtitle: `${mekName} - Choose a buff for ${jobKey}`,
    linkTo: "/slots",
    linkParams: { mekId, openPitStop: true },
    sourceType: "pit_stop",
    sourceId: `${mekId}-${pitStopNumber}`,
  });
}

// When Mek reaches level-up threshold
onLevelUpReady(userId, mekId, mekName, newLevel) {
  await createNotification({
    userId,
    type: "job_level_up",
    title: "Level Up Ready!",
    subtitle: `${mekName} can advance to Level ${newLevel}`,
    linkTo: "/slots",
    linkParams: { mekId },
    sourceType: "mek_level",
    sourceId: `${mekId}-level-${newLevel}`,
  });
}
```

---

## Part 5: Frontend Components

### Component Structure

```
src/components/notifications/
├── NotificationBell.tsx           # Bell icon with badge
├── NotificationDropdown.tsx       # Quick-view dropdown
├── NotificationItem.tsx           # Individual notification row
├── NotificationLightbox.tsx       # Full "View All" modal
└── index.ts                       # Exports
```

### NotificationBell Component

**Responsibilities:**
- Render bell icon
- Show/hide badge with unread count
- Toggle dropdown on click
- Subscribe to `getUnreadNotificationCount` query

### NotificationDropdown Component

**Responsibilities:**
- Render dropdown panel when bell is clicked
- Show recent **5 notifications**
- "View All" button opens lightbox
- "Clear All" button clears everything
- Close when clicking outside

### NotificationLightbox Component

**Responsibilities:**
- Full-screen modal (portal to document.body)
- Paginated list of ALL notifications (**10 per page**, max 100 total)
- "Load More" button for pagination
- "Clear All" at bottom
- Close button

### NotificationItem Component

**Responsibilities:**
- Render single notification
- Show unread dot indicator
- Format relative timestamp
- Handle click → navigate + mark as read

---

## Part 6: Real-Time Updates

Convex provides built-in real-time reactivity:

1. Backend mutation creates notification
2. Convex pushes update to subscribed clients
3. `useQuery` hook receives new data automatically
4. Badge count updates immediately
5. Dropdown/lightbox refresh if open

**No polling required.**

---

## Part 7: Navigation & Deep Links

### Click Flow

When user clicks a notification:

1. Mark notification as read (mutation)
2. Close dropdown/lightbox
3. Navigate to `linkTo` path
4. Pass `linkParams` as query string or state

### Page-Specific Actions

Some notifications may trigger additional behavior:
- `pit_stop_ready` with `openPitStop: true` → Could auto-open pit stop modal
- `job_level_up` with `mekId` → Could highlight/scroll to that Mek's slot

---

## Part 8: Messaging System Integration (Future)

### Shared UI Pattern

The messaging system will use the **same UI pattern** as notifications:

| Feature | Notifications | Messages |
|---------|---------------|----------|
| Icon | Bell (🔔) | Paper airplane (✉️) |
| Badge | Unread notification count | Unread message count |
| Dropdown | Recent notifications | Recent conversations |
| Lightbox | All notifications | Full inbox |
| Item display | Title + subtitle | Corp name + 10-12 word preview |

### Messages Dropdown Preview

```
┌─────────────────────────────────────┐
│ MESSAGES                            │
├─────────────────────────────────────┤
│ ● Titan Industries                  │
│   "Hey, I wanted to ask about..."   │  ← First 10-12 words
│   2 minutes ago                     │
├─────────────────────────────────────┤
│   Mek Corp                          │
│   "Thanks for the trade! The..."    │
│   1 hour ago                        │
├─────────────────────────────────────┤
│        [View All Messages]          │
└─────────────────────────────────────┘
```

### Implementation Notes

The messaging system already exists (`convex/messaging.ts`) with:
- `getTotalUnreadCount` - For badge
- `getConversations` - For inbox with `lastMessagePreview`
- Company name lookups

**For the messages icon, we will:**
1. Reuse the dropdown/lightbox component patterns from notifications
2. Connect to existing messaging queries
3. Show `lastMessagePreview` truncated to ~10-12 words
4. Link to `/messages` or specific conversation

**This is FUTURE work** - build notifications first, then adapt the pattern.

---

## Part 9: Mobile Considerations

### Responsive Design

**Bell Icon:**
- Same position on mobile
- Larger touch target (min 44px)
- Badge scales appropriately

**Dropdown:**
- Full-width on small screens
- Adequate padding and touch targets
- May anchor to top on mobile

**Lightbox:**
- Near full-screen on mobile
- Large touch targets for items
- Easy dismiss (X button, backdrop tap)

---

## Implementation Priority

### Phase 1: Core System (MVP)

1. **Database Schema**
   - Add `notifications` table to Convex schema
   - Add indexes

2. **Backend Functions**
   - `getUnreadNotificationCount` query
   - `getRecentNotifications` query
   - `getAllNotifications` query (paginated)
   - `markNotificationAsRead` mutation
   - `clearAllNotifications` mutation
   - `createNotification` internal function

3. **Frontend Components**
   - `NotificationBell` with badge
   - `NotificationDropdown` with item list
   - `NotificationItem` component
   - `NotificationLightbox` for "View All"
   - Integration into UnifiedHeader

4. **First Notification Triggers**
   - Hook into tenure/pit stop system for `pit_stop_ready`
   - Hook into level-up detection for `job_level_up`

### Phase 2: Additional Types & Polish

5. **More Notification Types**
   - Achievement notifications
   - Essence milestones
   - System announcements

6. **Deep Link Enhancements**
   - Auto-open modals from notification params
   - Scroll to/highlight specific elements

### Phase 3: Messages Icon

7. **Messages Quick-View**
   - Reuse dropdown pattern for messages icon
   - Show recent conversations with 10-12 word preview
   - "View All" links to full messaging page

---

## Files to Create

```
convex/
├── notifications.ts           # Queries and mutations

src/components/notifications/
├── NotificationBell.tsx
├── NotificationDropdown.tsx
├── NotificationItem.tsx
├── NotificationLightbox.tsx
└── index.ts
```

## Files to Modify

```
convex/schema.ts               # Add notifications table
convex/tenure.ts               # Add notification triggers
src/components/UnifiedHeader.tsx  # Add NotificationBell + Messages icon
```

---

## Summary

| Component | Description |
|-----------|-------------|
| NotificationBell | Bell icon with unread count badge |
| NotificationDropdown | Quick-view of recent **5 notifications** |
| NotificationLightbox | Full paginated history (**10 per page**, max 100 total) |
| NotificationItem | Single notification with dot, text, timestamp |
| Clear All | Removes all notifications permanently |
| Messages Icon | Future - same pattern for messaging quick-view |

**Core Loop:**
1. Event occurs (pit stop, level up, etc.)
2. Backend creates notification
3. Convex pushes to client in real-time
4. Badge shows unread count
5. User clicks bell → sees dropdown
6. User clicks notification → navigates to page, marks as read
7. User can "View All" for full history
8. User can "Clear All" to remove everything

---

## Progress Tracking

### Completed
- [x] Planning document created
- [x] Add `notifications` table to schema (convex/schema.ts:3786-3813)
- [x] Create player backend queries and mutations (convex/notifications.ts)
- [x] Create admin backend queries and mutations (convex/notifications.ts:276-521)
  - `adminGetAllNotifications` - View all notifications system-wide
  - `adminGetPlayerNotifications` - View notifications for specific player
  - `adminGetNotificationStats` - Dashboard statistics
  - `adminSendNotification` - Send to specific player
  - `adminBroadcastNotification` - Send to all players
  - `adminDeleteNotification` - Delete specific notification
  - `adminClearPlayerNotifications` - Clear all for a player
- [x] Build NotificationItem component (src/components/notifications/NotificationItem.tsx)
- [x] Build NotificationDropdown component (src/components/notifications/NotificationDropdown.tsx)
- [x] Build NotificationLightbox component (src/components/notifications/NotificationLightbox.tsx)
- [x] Build NotificationBell component (src/components/notifications/NotificationBell.tsx)
- [x] Integrate into UnifiedHeader (src/components/UnifiedHeader.tsx:458)
- [x] Implement 100-notification cap with auto-delete oldest (convex/notifications.ts)
  - Constants: `MAX_NOTIFICATIONS_PER_USER = 100`, `DROPDOWN_LIMIT = 5`, `LIGHTBOX_PAGE_SIZE = 10`
  - Cap enforced in both `createNotification` (internal) and `createNotificationPublic`
  - Oldest notifications automatically deleted when cap reached

### Not Yet Built (Future)
- [ ] Admin UI page to view/manage notifications (backend ready, needs frontend)
- [ ] Hook into tenure/pit stop system for `pit_stop_ready` notifications
- [ ] Hook into level-up system for `job_level_up` notifications
- [ ] Add more notification types as needed
- [ ] Messages icon integration (Phase 3)

---

*This document tracks the notification system implementation. Update Progress Tracking as work proceeds.*
