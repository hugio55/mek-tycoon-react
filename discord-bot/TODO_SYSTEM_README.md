# Discord Todo Bot - Complete Redesign

## Overview
The Discord todo bot has been completely redesigned with a persistent message interface, button-based interactions, and industrial sci-fi styling matching the Mek Tycoon aesthetic.

## Key Features

### Single Persistent Message
- Each user has ONE message that continuously updates with their todo list
- All interactions edit the same message - no message spam
- When user runs `/todo`, it either:
  - Creates a new persistent message if none exists
  - Updates the existing message and notifies user

### Button-Based Interface
Users interact entirely through buttons (no slash command parameters):

**Action Buttons:**
- **Add Task (➕)** - Opens modal to type new task
- **Complete (✅)** - Switches to complete mode
- **Delete (🗑️)** - Switches to delete mode
- **Clear Done (🧹)** - Removes all completed tasks
- **Back to View (👁️)** - Returns to view mode

**Task Number Buttons (1-10):**
- In **View Mode**: Clicking shows a message to switch modes
- In **Complete Mode**: Click to toggle task completion status
- In **Delete Mode**: Click to permanently delete task
- Buttons are green when task is complete, gray when incomplete

**Navigation Buttons:**
- **◀ Previous** - Go to previous page (disabled on page 1)
- **Next ▶** - Go to next page (disabled on last page)
- Only shown when there are multiple pages

### Three Interaction Modes

1. **View Mode (👁️)** - Default mode
   - Task numbers are displayed but clicking them does nothing
   - Must switch to Complete or Delete mode to interact
   - Shows "Complete" and "Delete" mode buttons

2. **Complete Mode (✅)**
   - Click task numbers to toggle completion
   - Completed tasks show as green buttons with strikethrough text
   - Shows "Back to View" button
   - Perfect for quickly marking tasks done

3. **Delete Mode (🗑️)**
   - Click task numbers to permanently delete
   - Shows "Back to View" button
   - Use for cleaning up unwanted tasks

### Visual Design - Industrial Sci-Fi Aesthetic

**Colors:**
- Gold accent: `#FAB617` (matching Mek Tycoon brand)
- Progress bars use gold gradient
- Completed tasks show green
- Delete mode uses red danger styling

**Progress Display:**
```
╔═══════════════════════════════════════════════╗
║   PROGRESS: 50% [5/10]                        ║
║   ████████████░░░░░░░░░░                      ║
╚═══════════════════════════════════════════════╝
```

**Mode Indicators:**
- 👁️ VIEW MODE
- ✅ COMPLETE MODE
- 🗑️ DELETE MODE

**Task Display:**
- Format: `✅ [1] ~~Task text~~` (completed)
- Format: `⬜ [2] Task text` (incomplete)
- Task numbers in brackets for clarity

### Modal for Adding Tasks
When user clicks "Add Task":
1. Discord modal pops up with text input field
2. User types task (max 500 characters)
3. On submit, task is added and persistent message updates
4. Ephemeral confirmation message shown

### Pagination
- 10 tasks per page maximum
- Previous/Next buttons appear when needed
- Footer shows: `Page 1/3 • 25 total tasks`
- Page state is saved per user

## Data Structure

**File:** `discord-bot/todos.json`

```json
{
  "userId": {
    "messageId": "1234567890",
    "channelId": "0987654321",
    "tasks": [
      {
        "id": 1,
        "text": "Task description",
        "completed": false,
        "createdAt": 1234567890
      }
    ],
    "page": 1,
    "mode": "view"
  }
}
```

**Fields:**
- `messageId` - ID of the persistent Discord message
- `channelId` - Channel where the message lives
- `tasks` - Array of task objects
- `page` - Current page number (1-indexed)
- `mode` - Current interaction mode ("view", "complete", "delete")

## Command Structure

### Slash Commands
Only one slash command exists now:

**`/todo`** - Opens your personal todo list
- If persistent message exists: Updates it and sends ephemeral notification
- If no message exists: Creates new persistent message

## Button Interaction IDs

**Mode Buttons:**
- `todo_mode_view` - Switch to view mode
- `todo_mode_complete` - Switch to complete mode
- `todo_mode_delete` - Switch to delete mode

**Action Buttons:**
- `todo_add` - Show add task modal
- `todo_clear` - Clear all completed tasks

**Navigation:**
- `todo_prev` - Previous page
- `todo_next` - Next page

**Task Buttons:**
- `todo_task_1` through `todo_task_10` - Task number buttons
- Behavior changes based on current mode

## Technical Implementation

### Functions

**Data Management:**
- `loadTodos()` - Load from JSON file
- `saveTodos(todos)` - Save to JSON file
- `getUserData(userId)` - Get user's data object
- `setMessageInfo(userId, messageId, channelId)` - Store message location
- `setMode(userId, mode)` - Change interaction mode
- `setPage(userId, page)` - Change current page

**Task Operations:**
- `addTask(userId, taskText)` - Add new task
- `toggleTask(userId, taskNumber)` - Toggle completion status
- `deleteTask(userId, taskNumber)` - Delete task permanently
- `clearCompleted(userId)` - Remove all completed tasks

**UI Builders:**
- `buildTodoEmbed(userData)` - Create Discord embed with task list
- `buildTodoButtons(userData)` - Create button components based on state

### Interaction Handlers

**Modal Submit Handler:**
```javascript
if (interaction.isModalSubmit()) {
  // Handle "todo_add_modal" submission
  // Add task and update persistent message
}
```

**Button Click Handler:**
```javascript
if (interaction.isButton() && interaction.customId.startsWith('todo_')) {
  // Handle all todo button interactions
  // Update state and refresh message
}
```

**Command Handler:**
```javascript
if (commandName === 'todo') {
  // Check if persistent message exists
  // Either update existing or create new
}
```

## User Experience Flow

### First Time Use
1. User types `/todo`
2. Bot creates persistent message with empty state
3. User clicks "Add Task" button
4. Modal appears, user types task
5. Task appears in list with number button

### Daily Use
1. User types `/todo` (from anywhere)
2. Bot updates their existing message
3. User clicks number button in Complete mode
4. Task marked done instantly
5. Message updates in place

### Managing Tasks
1. Switch to Complete mode
2. Click numbers to mark done (turns green)
3. Click again to unmark (turns gray)
4. Switch to Delete mode when needed
5. Click numbers to delete permanently
6. Use "Clear Done" to bulk remove completed

## Benefits Over Old System

**Before (Slash Commands):**
- `/todo add` - Create new message
- `/todo list` - Create new message
- `/todo complete 5` - Create new message
- Resulted in message spam
- Hard to remember command syntax
- Required typing task numbers

**After (Persistent Buttons):**
- `/todo` - One message, updated forever
- Click buttons to do everything
- Visual, intuitive interface
- No command syntax to remember
- Instant visual feedback

## Deployment

1. Updated `bot.js` with new system
2. Updated `todos.json` structure
3. No new dependencies needed
4. Commands auto-register on bot startup

To deploy:
```bash
cd discord-bot
npm start
```

Bot will:
1. Register the simplified `/todo` command
2. Start listening for interactions
3. Handle both old and new data structures

## Migration Notes

Existing user data in `todos.json` will automatically migrate:
- Old array format converts to new object format
- `messageId` and `channelId` start as `null`
- First `/todo` use creates persistent message
- After that, message location is saved

No manual migration needed!
