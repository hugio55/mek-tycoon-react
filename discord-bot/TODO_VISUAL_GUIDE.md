# Discord Todo Bot - Visual Interface Guide

## What Users See

### Initial View (Empty List)
```
╔════════════════════════════════════════════════════╗
║                 ⚙️ MEK TASK MANAGER                ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  ╔═══════════════════════════════════════════════╗ ║
║  ║   PROGRESS: 0% [0/0]                          ║ ║
║  ║   ░░░░░░░░░░░░░░░░░░░░                        ║ ║
║  ╚═══════════════════════════════════════════════╝ ║
║                                                    ║
║  👁️ VIEW MODE                                      ║
║                                                    ║
║  No tasks yet. Click "Add Task" to begin.         ║
║                                                    ║
║  [✅ Complete] [🗑️ Delete] [➕ Add Task]            ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### View Mode (With Tasks)
```
╔════════════════════════════════════════════════════╗
║                 ⚙️ MEK TASK MANAGER                ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  ╔═══════════════════════════════════════════════╗ ║
║  ║   PROGRESS: 33% [2/6]                         ║ ║
║  ║   ███████░░░░░░░░░░░░░                        ║ ║
║  ╚═══════════════════════════════════════════════╝ ║
║                                                    ║
║  👁️ VIEW MODE                                      ║
║                                                    ║
║  ✅ [1] ~~Fix login bug~~                          ║
║  ⬜ [2] Add dark mode                              ║
║  ✅ [3] ~~Update documentation~~                   ║
║  ⬜ [4] Optimize database queries                  ║
║  ⬜ [5] Write unit tests                           ║
║  ⬜ [6] Deploy to production                       ║
║                                                    ║
║  [1] [2] [3] [4] [5]                               ║
║  [6] [7] [8] [9] [10]                              ║
║                                                    ║
║  [✅ Complete] [🗑️ Delete] [➕ Add Task] [🧹 Clear] ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### Complete Mode
```
╔════════════════════════════════════════════════════╗
║                 ⚙️ MEK TASK MANAGER                ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  ╔═══════════════════════════════════════════════╗ ║
║  ║   PROGRESS: 33% [2/6]                         ║ ║
║  ║   ███████░░░░░░░░░░░░░                        ║ ║
║  ╚═══════════════════════════════════════════════╝ ║
║                                                    ║
║  ✅ COMPLETE MODE    <- MODE CHANGED               ║
║                                                    ║
║  ✅ [1] ~~Fix login bug~~                          ║
║  ⬜ [2] Add dark mode                              ║
║  ✅ [3] ~~Update documentation~~                   ║
║  ⬜ [4] Optimize database queries                  ║
║  ⬜ [5] Write unit tests                           ║
║  ⬜ [6] Deploy to production                       ║
║                                                    ║
║  [1🟢] [2⚫] [3🟢] [4⚫] [5⚫]  <- Click to toggle   ║
║  [6⚫] [7] [8] [9] [10]                             ║
║                                                    ║
║  [👁️ Back] [➕ Add Task] [🧹 Clear]                 ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### Delete Mode
```
╔════════════════════════════════════════════════════╗
║                 ⚙️ MEK TASK MANAGER                ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  ╔═══════════════════════════════════════════════╗ ║
║  ║   PROGRESS: 33% [2/6]                         ║ ║
║  ║   ███████░░░░░░░░░░░░░                        ║ ║
║  ╚═══════════════════════════════════════════════╝ ║
║                                                    ║
║  🗑️ DELETE MODE    <- MODE CHANGED (RED THEME)    ║
║                                                    ║
║  ✅ [1] ~~Fix login bug~~                          ║
║  ⬜ [2] Add dark mode                              ║
║  ✅ [3] ~~Update documentation~~                   ║
║  ⬜ [4] Optimize database queries                  ║
║  ⬜ [5] Write unit tests                           ║
║  ⬜ [6] Deploy to production                       ║
║                                                    ║
║  [1🔴] [2🔴] [3🔴] [4🔴] [5🔴]  <- Click to delete ║
║  [6🔴] [7] [8] [9] [10]                            ║
║                                                    ║
║  [👁️ Back] [➕ Add Task] [🧹 Clear]                 ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### Add Task Modal
```
╔════════════════════════════════════════════════════╗
║               Add New Task                         ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  Task Description:                                 ║
║  ┌──────────────────────────────────────────────┐ ║
║  │ Type your task here...                       │ ║
║  │                                              │ ║
║  │                                              │ ║
║  │                                              │ ║
║  └──────────────────────────────────────────────┘ ║
║                                                    ║
║             [Cancel]  [Submit]                     ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### Pagination (Multiple Pages)
```
╔════════════════════════════════════════════════════╗
║                 ⚙️ MEK TASK MANAGER                ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  ╔═══════════════════════════════════════════════╗ ║
║  ║   PROGRESS: 45% [9/20]                        ║ ║
║  ║   █████████░░░░░░░░░░                         ║ ║
║  ╚═══════════════════════════════════════════════╝ ║
║                                                    ║
║  👁️ VIEW MODE                                      ║
║                                                    ║
║  ✅ [11] ~~Task eleven~~                           ║
║  ⬜ [12] Task twelve                               ║
║  ✅ [13] ~~Task thirteen~~                         ║
║  ⬜ [14] Task fourteen                             ║
║  ⬜ [15] Task fifteen                              ║
║  ⬜ [16] Task sixteen                              ║
║  ⬜ [17] Task seventeen                            ║
║  ⬜ [18] Task eighteen                             ║
║  ⬜ [19] Task nineteen                             ║
║  ✅ [20] ~~Task twenty~~                           ║
║                                                    ║
║  [11] [12] [13] [14] [15]                          ║
║  [16] [17] [18] [19] [20]                          ║
║                                                    ║
║  [✅ Complete] [🗑️ Delete] [➕ Add Task] [🧹 Clear] ║
║                                                    ║
║  [◀ Previous] [Next ▶]                             ║
║                                                    ║
║  Page 2/2 • 20 total tasks                         ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

## Button Color Guide

### Task Number Buttons
- **Gray (Secondary)** - Incomplete task in view mode
- **Green (Success)** - Completed task in any mode
- **Same style in Complete mode** - Click to toggle
- **Same style in Delete mode** - Click to delete

### Action Buttons
- **✅ Complete** - Blue (Primary)
- **🗑️ Delete** - Red (Danger)
- **👁️ Back to View** - Gray (Secondary)
- **➕ Add Task** - Green (Success)
- **🧹 Clear Done** - Gray (Secondary)

### Navigation Buttons
- **◀ Previous** - Gray (Secondary), disabled when on first page
- **Next ▶** - Gray (Secondary), disabled when on last page

## User Workflow Examples

### Example 1: Adding First Task
1. Type `/todo`
2. See empty list with "Add Task" button
3. Click "➕ Add Task"
4. Modal appears
5. Type "Buy groceries"
6. Click Submit
7. Task appears as "[1] Buy groceries"

### Example 2: Completing Tasks
1. Type `/todo` (list appears or updates)
2. Click "✅ Complete" button
3. Mode changes to "✅ COMPLETE MODE"
4. Click number button "3"
5. Task 3 turns green with strikethrough
6. Click "👁️ Back to View"
7. Returns to normal view

### Example 3: Deleting Tasks
1. In your todo list
2. Click "🗑️ Delete" button
3. Mode changes to "🗑️ DELETE MODE"
4. Click number button "5"
5. Confirmation message appears
6. Task 5 is removed from list
7. Click "👁️ Back to View"

### Example 4: Clearing Completed
1. Have some completed tasks (green)
2. Click "🧹 Clear Done" button
3. All green tasks disappear
4. Only incomplete tasks remain
5. Progress bar updates

### Example 5: Pagination
1. Have 15 tasks
2. See tasks 1-10 on page 1
3. "Next ▶" button appears at bottom
4. Click "Next ▶"
5. See tasks 11-15 on page 2
6. "◀ Previous" button appears
7. Click "◀ Previous" to go back

## Color Scheme (Mek Tycoon Industrial Theme)

- **Primary Gold**: `#FAB617` - Used for title, borders, progress bar
- **Completed Green**: `#4ade80` - Completed task checkmarks
- **Incomplete Gray**: `#AAAAAA` - Incomplete task checkmarks
- **Background**: Dark theme (Discord default)
- **Text**: White for tasks, gray for labels

## ANSI Color Codes (Progress Bar)
```
[2;33m = Dim yellow/gold for borders
[1;33m = Bright yellow/gold for values
[0m = Reset to default
```

This creates the industrial look:
```
[2;33m╔═══╗[0m  <- Dim gold border
[1;33m100%[0m  <- Bright gold value
```
