# Mek Tycoon Development Swarm

A specialized AI agent swarm for rapidly developing the Mek Tycoon frontend with focus on UI/UX, animations, and game mechanics.

## Installation

1. **Install claude-swarm** (if not already installed):
   ```bash
   git clone https://github.com/parruda/claude-swarm
   cd claude-swarm
   # Follow their installation instructions
   ```

2. **Add claude-swarm to PATH**:
   - Add the claude-swarm binary location to your system PATH
   - Verify with: `claude-swarm --version`

## Quick Start

### Method 1: Start Full Swarm
Double-click `start-swarm.bat` or run:
```bash
cd swarm
start-swarm.bat
```

### Method 2: Chat with Specific Agent
Double-click `swarm-chat.bat` and select an agent:
- 1: UI/UX Architect (Lead)
- 2: React/Next.js Specialist
- 3: CSS Animation Expert
- 4: Three.js Game Developer
- 5: Asset & Data Manager
- 6: Component Library Architect
- 7: Game Mechanics Developer

### Method 3: Run a Workflow
Double-click `run-workflow.bat` and choose:
- `new-feature`: Implement a new UI feature
- `minigame`: Create a Three.js minigame
- `crafting-system`: Enhance crafting system

## Agent Roles

### UI/UX Architect (Lead)
- Maintains design consistency
- Coordinates between specialists
- Makes architectural decisions
- Reviews implementations

### React/Next.js Specialist
- Implements React components
- Manages state and data flow
- Integrates with Convex backend
- Optimizes performance

### CSS Animation Expert
- Creates glass-morphism effects
- Implements animations/transitions
- Guards Tailwind v3 (never v4!)
- Optimizes visual performance

### Three.js Game Developer
- Builds 3D minigames
- Handles WebGL optimization
- Implements game physics
- Creates 3D visualizations

### Asset & Data Manager
- Organizes 309 Mek variations
- Manages Convex schemas
- Processes data imports
- Optimizes image loading

### Component Library Architect
- Designs reusable components
- Maintains design system
- Ensures consistency
- Documents patterns

### Game Mechanics Developer
- Implements idle/tycoon logic
- Balances economy
- Creates progression systems
- Designs crafting mechanics

## Example Tasks

### Creating a New Page
```
Workflow: new-feature
Task: Create a marketplace page where players can buy and sell Meks with glass-morphism cards and hover effects
```

### Adding a Minigame
```
Workflow: minigame  
Task: Build a 3D memory match game using Three.js where players match Mek heads to earn gold
```

### Updating Crafting UI
```
Workflow: crafting-system
Task: Redesign the crafting interface with animated component selection and rarity indicators
```

## Direct Agent Communication

For specific tasks, chat directly with agents:

```bash
# Ask the CSS expert about animations
claude-swarm chat --agent css-animator

# Get React help
claude-swarm chat --agent react-dev

# Discuss game balance
claude-swarm chat --agent game-mechanics
```

## Configuration

The swarm configuration is in `mek-tycoon-swarm.json`:
- Agents have specific directories and tools
- Workflows define multi-step processes
- Each agent has a specialized prompt

## Tips

1. **Start with the Architect** for planning new features
2. **Use workflows** for complex multi-agent tasks
3. **Chat directly** for specific technical questions
4. **Check prompts/** to understand each agent's expertise
5. **The CSS agent** guards against Tailwind v4 upgrades

## Troubleshooting

- **"claude-swarm not found"**: Install and add to PATH
- **Agent errors**: Check API keys and model access
- **Workflow fails**: Ensure all agents are configured
- **Connection issues**: Verify network and API limits

## Project Context

Each agent knows:
- Mek Tycoon is an idle/tycoon game
- 102 heads, 112 bodies, 95 traits
- Dark futuristic theme with yellow accents
- Glass-morphism UI effects
- Tailwind v3 (NEVER v4)
- Next.js 15.4.6 with Convex backend