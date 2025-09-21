# Mek Tycoon - Game Mechanics Documentation

## Story Climb System

### Mission Completion & Difficulty Locking

#### Difficulty System
- Each mission has 3 difficulty levels: Easy, Medium, Hard
- When a player completes a mission on a specific difficulty, that difficulty becomes **permanently locked**
- Locked difficulties display with a "Crossed Out" visual style
- Hovering over a locked difficulty shows tooltip: "⚠️ ALREADY COMPLETED - You have already completed this contract on [DIFFICULTY] difficulty."

#### Auto-Selection Logic
- A difficulty must always be selected
- If current difficulty is locked, system auto-selects the leftmost available difficulty
- If all difficulties are completed, the last selected difficulty remains active (but unusable)

#### Visual States

**Locked Difficulty Button Style:**
- Uses "Crossed Out" method (locked in as the permanent style)
- Red diagonal lines cross through the button
- Button becomes non-interactive
- Enhanced tooltip with larger font appears on hover

**Fully Completed Missions:**
- When all 3 difficulties are completed:
  1. "COMPLETE" overlay appears across the mission card
  2. Node on the canvas gets a special gold frame
  3. Mission becomes non-playable but remains visible

### Gold Frame Styles (for fully completed nodes)

Nodes with all difficulties completed display special gold frames that:
- Replace the normal node stroke (not an additional outer frame)
- Hug the node shape tightly
- Match node type (circular for event/normal nodes, square for boss nodes)
- **Locked Style**: Classical Laurel Wreath (Style 5) - stationary ornate design with laurel leaves

**Implementation Files:**
- `/src/components/StoryMissionCard.tsx` - Mission card UI and difficulty selection
- `/src/components/StoryMissionCard-buttonStyles.tsx` - Button rendering and locked state visuals
- `/src/app/scrap-yard/story-climb/page.tsx` - Canvas rendering and gold frame drawing

### Node Types & Visual Hierarchy

#### Node Categories
1. **Start Node** - Entry point of the story tree
2. **Normal Nodes** - Standard story progression points (circular)
3. **Event Nodes** - Special story events (circular with unique positioning)
4. **Boss Nodes** - Major encounters (square shape)

#### Visual Positioning
- Non-start nodes positioned 45px higher than base position
- Event nodes offset 7px left and 3px up for visual alignment
- Connections drawn between parent and child nodes

### Data Persistence

#### Completed Difficulties Storage
- Stored in component state as `completedDifficulties: Set<string>`
- Format: `nodeId-difficulty` (e.g., "node1-easy", "node1-medium")
- Persists across session (implementation pending for database storage)

#### Completed Nodes
- Tracked separately as `completedNodes: Set<string>`
- A node is "completed" when all 3 difficulties are finished
- Triggers gold frame rendering on canvas

## Future Considerations

### Database Integration
- Need to implement Convex mutations for saving completion states
- Should sync with user profile/save system
- Consider achievement triggers for full completions

### Rewards System
- Gold/XP values configured per difficulty
- Completion rewards need to be granted only once per difficulty
- Integration with main game economy pending

---

*This document should be updated whenever game mechanics are added or modified during development sessions.*