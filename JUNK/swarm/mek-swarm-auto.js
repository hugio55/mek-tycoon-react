import Anthropic from '@anthropic-ai/sdk';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

// Path to your actual Mek Tycoon project
const PROJECT_ROOT = 'C:\\Users\\Ben Meyers\\Documents\\Mek Tycoon\\mek-tycoon-react';

if (isMainThread) {
  // ============ MAIN THREAD - ORCHESTRATOR ============
  
  class MekTycoonSwarmAuto extends EventEmitter {
    constructor() {
      super();
      this.claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      this.agents = this.defineAgents();
      this.taskQueue = [];
      this.activeWorkers = new Map();
      this.messageHub = new Map();
      this.agentStatus = new Map();
      this.taskGraph = new Map();
      this.implementedFiles = []; // Track what we create
      this.setupDashboard();
    }

    defineAgents() {
      return {
        orchestrator: {
          id: 'orchestrator',
          name: '🎭 Orchestrator',
          role: 'Analyzes tasks, creates execution plans, delegates work to specialists',
          personality: 'Strategic thinker who sees the big picture and optimizes task distribution',
          capabilities: ['task_analysis', 'delegation', 'dependency_resolution', 'synthesis'],
          tools: ['Read', 'WebSearch'],
          model: 'claude-3-5-sonnet-20241022',
          color: '#FFD700',
          canDelegate: true
        },
        
        implementation_specialist: {
          id: 'implementation_specialist',
          name: '⚡ Implementation Specialist',
          role: 'Takes designs and writes actual code files to the project',
          personality: 'Pragmatic coder who turns ideas into working implementations',
          capabilities: ['file_writing', 'code_generation', 'integration', 'hot_reload'],
          tools: ['Read', 'Write', 'Edit', 'Bash'],
          model: 'claude-3-5-sonnet-20241022',
          color: '#FF1493',
          canDelegate: false
        },
        
        threejs_specialist: {
          id: 'threejs_specialist',
          name: '🎮 Three.js Game Dev',
          role: 'Creates 3D mini-games, handles WebGL rendering, game physics',
          personality: 'Game developer who loves creating engaging, juicy interactions',
          capabilities: ['three.js', 'game_loops', 'physics', 'tweening', 'webgl'],
          tools: ['Read', 'Write', 'Edit'],
          model: 'claude-3-5-sonnet-20241022',
          color: '#00CED1',
          canDelegate: false
        },
        
        glass_ui_designer: {
          id: 'glass_ui_designer',
          name: '✨ Glass UI Designer',
          role: 'Creates glass-morphism UI, manages dark theme aesthetics',
          personality: 'Visual perfectionist obsessed with subtle details and polish',
          capabilities: ['glassmorphism', 'tailwind_v3', 'animations', 'responsive_design'],
          tools: ['Read', 'Edit', 'Write'],
          model: 'claude-3-5-sonnet-20241022',
          color: '#9370DB',
          canDelegate: false
        },
        
        mek_asset_coordinator: {
          id: 'mek_asset_coordinator',
          name: '🖼️ Mek Asset Manager',
          role: 'Manages NFT images, syncs visual assets with data attributes',
          personality: 'Detail-oriented curator who ensures every Mek looks perfect',
          capabilities: ['image_optimization', 'asset_pipeline', 'rarity_systems', 'nft_metadata'],
          tools: ['Read', 'Write', 'Bash'],
          model: 'claude-3-5-sonnet-20241022',
          color: '#FF69B4',
          canDelegate: false
        },
        
        nextjs_architect: {
          id: 'nextjs_architect',
          name: '🏗️ Next.js Architect',
          role: 'Manages routes, SSR/SSG, API routes, page transitions',
          personality: 'Framework expert who makes everything load instantly',
          capabilities: ['app_router', 'ssr_optimization', 'code_splitting', 'routing'],
          tools: ['Read', 'Edit', 'Write', 'Bash'],
          model: 'claude-3-5-sonnet-20241022',
          color: '#4169E1',
          canDelegate: false
        },
        
        convex_state_manager: {
          id: 'convex_state_manager',
          name: '📊 Convex State Manager',
          role: 'Handles real-time state, database schemas, subscriptions',
          personality: 'Data architect who keeps everything in perfect sync',
          capabilities: ['convex_mutations', 'realtime_sync', 'schema_design', 'caching'],
          tools: ['Read', 'Edit', 'Write'],
          model: 'claude-3-5-sonnet-20241022',
          color: '#32CD32',
          canDelegate: false
        },
        
        animation_engineer: {
          id: 'animation_engineer',
          name: '🎬 Animation Engineer',
          role: 'Creates animations, particle effects, screen transitions, game juice',
          personality: 'Motion designer who makes everything feel alive and responsive',
          capabilities: ['gsap', 'css_animations', 'particles', 'transitions', 'game_feel'],
          tools: ['Read', 'Edit', 'Write'],
          model: 'claude-3-5-sonnet-20241022',
          color: '#FF6347',
          canDelegate: false
        },
        
        minigame_builder: {
          id: 'minigame_builder',
          name: '🕹️ Mini-Game Builder',
          role: 'Creates idle clickers, puzzle games, reaction games integrated with economy',
          personality: 'Gameplay designer who makes addictive, rewarding experiences',
          capabilities: ['game_design', 'idle_mechanics', 'progression_systems', 'rewards'],
          tools: ['Read', 'Write', 'Edit'],
          model: 'claude-3-5-sonnet-20241022',
          color: '#FFA500',
          canDelegate: false
        }
      };
    }

    setupDashboard() {
      const app = express();
      const server = createServer(app);
      this.io = new Server(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      app.use(express.static(path.join(__dirname, 'dashboard')));
      
      this.io.on('connection', (socket) => {
        console.log('Dashboard connected');
        socket.emit('agents', Object.values(this.agents));
        this.agentStatus.forEach((status, agentId) => {
          socket.emit('agent-update', { agentId, ...status });
        });
      });

      const PORT = 4200;
      server.listen(PORT, () => {
        console.log(`\n🌐 Swarm Dashboard: http://localhost:${PORT}\n`);
      });
    }

    async runTask(userTask, targetLocation = null) {
      console.log('\n' + '='.repeat(80));
      console.log('🤖 MEK TYCOON AUTO-IMPLEMENTING SWARM ACTIVATED');
      console.log('='.repeat(80));
      console.log(`📋 MAIN TASK: ${userTask}`);
      if (targetLocation) {
        console.log(`📍 TARGET LOCATION: ${targetLocation}`);
      }
      console.log('='.repeat(80) + '\n');

      // Step 1: Orchestrator creates execution plan
      const executionPlan = await this.createExecutionPlan(userTask, targetLocation);
      
      // Step 2: Build task dependency graph
      this.buildDependencyGraph(executionPlan);
      
      // Step 3: Execute tasks in parallel waves
      const results = await this.executeParallelWaves(executionPlan);
      
      // Step 4: Implementation phase - write actual files
      const implementation = await this.implementSolution(results, userTask, targetLocation);
      
      // Step 5: Final synthesis
      const synthesis = await this.synthesizeResults(results, userTask, implementation);
      
      return synthesis;
    }

    async createExecutionPlan(task, targetLocation) {
      this.updateAgentStatus('orchestrator', 'analyzing', 'Creating execution plan...');
      
      const response = await this.claude.messages.create({
        model: this.agents.orchestrator.model,
        max_tokens: 8192,
        messages: [{
          role: 'user',
          content: `You are the Orchestrator for the Mek Tycoon development swarm.

Your specialists:
${Object.entries(this.agents).filter(([k]) => k !== 'orchestrator').map(([k,v]) => 
  `- ${v.name} (${k}): ${v.role}
   Capabilities: ${v.capabilities.join(', ')}`
).join('\n\n')}

Main task: ${task}
${targetLocation ? `Target location: ${targetLocation}` : ''}

Create a detailed execution plan that includes:
1. Design and planning phases (waves 1-3)
2. Implementation phase (wave 4) - MUST include implementation_specialist
3. Integration phase (wave 5) - connecting to existing app

Return as JSON:
{
  "analysis": "brief task understanding",
  "targetFiles": ["list of files that will be created/modified"],
  "execution_waves": [
    {
      "wave": 1,
      "phase": "planning/design/implementation",
      "parallel_tasks": [
        {
          "agent": "agent_id",
          "task": "specific task",
          "deliverables": ["what this produces"],
          "requires_from": {}
        }
      ]
    }
  ],
  "coordination": {
    "agent_pairs": [["agent1", "agent2"]],
    "shared_resources": ["resource names"]
  }
}`
        }]
      });

      const plan = JSON.parse(response.content[0].text);
      this.io?.emit('execution-plan', plan);
      
      console.log(`📊 Execution Plan Created:`);
      plan.execution_waves.forEach(wave => {
        console.log(`\n  Wave ${wave.wave} (${wave.phase}): ${wave.parallel_tasks.length} tasks`);
        wave.parallel_tasks.forEach(t => {
          console.log(`    • ${this.agents[t.agent].name}: ${t.task.substring(0, 50)}...`);
        });
      });
      
      this.updateAgentStatus('orchestrator', 'ready', 'Plan complete');
      return plan;
    }

    async implementSolution(results, task, targetLocation) {
      console.log('\n' + '='.repeat(80));
      console.log('⚡ IMPLEMENTATION PHASE: Writing actual files...');
      console.log('='.repeat(80));
      
      this.updateAgentStatus('implementation_specialist', 'working', 'Implementing solution...');
      
      // Gather all code/designs from previous waves
      const codeSnippets = results.map(r => r.result).join('\n\n---\n\n');
      
      const implementation = await this.claude.messages.create({
        model: this.agents.implementation_specialist.model,
        max_tokens: 8192,
        messages: [{
          role: 'user',
          content: `You are the Implementation Specialist. Your job is to write ACTUAL code files.

Project root: ${PROJECT_ROOT}
Target location: ${targetLocation || 'Choose appropriate location'}
Task: ${task}

Based on these designs from other agents:
${codeSnippets}

IMPORTANT: You must create REAL, WORKING code files. For the block stacking game:

1. Create the main game component at: src/app/scrap-yard/page.tsx (or specified location)
2. Include all Three.js setup, game logic, and UI
3. Make it fully functional and integrated with existing navigation
4. Use proper Next.js client components ('use client')
5. Include glass-morphism styling with Tailwind v3

Return a JSON with actual file contents:
{
  "files": [
    {
      "path": "src/app/scrap-yard/page.tsx",
      "content": "FULL FILE CONTENT HERE",
      "action": "create"
    }
  ],
  "summary": "What was implemented"
}`
        }]
      });

      const implData = JSON.parse(implementation.content[0].text);
      
      // Actually write the files
      for (const file of implData.files) {
        const fullPath = path.join(PROJECT_ROOT, file.path);
        console.log(`📝 Writing: ${file.path}`);
        
        try {
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          
          if (file.action === 'create' || file.action === 'overwrite') {
            await fs.writeFile(fullPath, file.content);
          } else if (file.action === 'edit') {
            // Handle edits if needed
            const existing = await fs.readFile(fullPath, 'utf-8');
            const updated = existing.replace(file.oldContent, file.content);
            await fs.writeFile(fullPath, updated);
          }
          
          this.implementedFiles.push(file.path);
          console.log(`✅ Implemented: ${file.path}`);
        } catch (error) {
          console.error(`❌ Failed to write ${file.path}: ${error.message}`);
        }
      }
      
      this.updateAgentStatus('implementation_specialist', 'complete', 'Files written');
      
      return {
        files: this.implementedFiles,
        summary: implData.summary
      };
    }

    buildDependencyGraph(plan) {
      this.taskGraph.clear();
      plan.execution_waves.forEach(wave => {
        wave.parallel_tasks.forEach(task => {
          this.taskGraph.set(`${task.agent}_w${wave.wave}`, {
            agent: task.agent,
            task: task.task,
            wave: wave.wave,
            dependencies: task.requires_from || {},
            deliverables: task.deliverables || []
          });
        });
      });
      this.io?.emit('dependency-graph', Array.from(this.taskGraph.entries()));
    }

    async executeParallelWaves(plan) {
      const allResults = [];
      
      for (const wave of plan.execution_waves) {
        console.log(`\n🌊 Executing Wave ${wave.wave} - ${wave.phase} (${wave.parallel_tasks.length} tasks)`);
        
        const waveWorkers = await Promise.all(
          wave.parallel_tasks.map(task => this.createAgentWorker(task, wave.wave))
        );
        
        const waveResults = await Promise.all(waveWorkers.map(w => w.promise));
        
        waveResults.forEach(result => {
          this.messageHub.set(result.agent, result);
          allResults.push(result);
        });
        
        console.log(`✅ Wave ${wave.wave} complete`);
      }
      
      return allResults;
    }

    async createAgentWorker(taskDef, waveNumber) {
      const agent = this.agents[taskDef.agent];
      const workerId = `${taskDef.agent}_w${waveNumber}`;
      
      this.updateAgentStatus(taskDef.agent, 'starting', `${taskDef.task.substring(0, 30)}...`);
      
      const worker = new Worker(fileURLToPath(import.meta.url), {
        workerData: {
          agentConfig: agent,
          task: taskDef,
          waveNumber,
          apiKey: process.env.ANTHROPIC_API_KEY,
          previousResults: this.gatherDependencies(taskDef.requires_from),
          projectRoot: PROJECT_ROOT
        }
      });

      const promise = new Promise((resolve, reject) => {
        const messages = [];
        
        worker.on('message', (msg) => {
          switch(msg.type) {
            case 'status':
              this.updateAgentStatus(taskDef.agent, msg.status, msg.message);
              break;
            case 'progress':
              this.io?.emit('agent-progress', {
                agentId: taskDef.agent,
                progress: msg.progress,
                detail: msg.detail
              });
              break;
            case 'result':
              this.updateAgentStatus(taskDef.agent, 'complete', 'Task complete');
              resolve({
                agent: taskDef.agent,
                wave: waveNumber,
                result: msg.data,
                deliverables: msg.deliverables,
                messages
              });
              break;
            case 'error':
              this.updateAgentStatus(taskDef.agent, 'error', msg.error);
              reject(new Error(msg.error));
              break;
          }
          messages.push(msg);
        });

        worker.on('error', (err) => {
          this.updateAgentStatus(taskDef.agent, 'error', err.message);
          reject(err);
        });
      });

      this.activeWorkers.set(workerId, { worker, promise });
      return { worker, promise };
    }

    gatherDependencies(requirements) {
      if (!requirements || Object.keys(requirements).length === 0) return {};
      
      const deps = {};
      Object.entries(requirements).forEach(([agent, items]) => {
        const agentResult = this.messageHub.get(agent);
        if (agentResult) {
          deps[agent] = {
            deliverables: agentResult.deliverables,
            result: agentResult.result
          };
        }
      });
      return deps;
    }

    updateAgentStatus(agentId, status, message) {
      const statusData = {
        status,
        message,
        timestamp: Date.now()
      };
      
      this.agentStatus.set(agentId, statusData);
      this.io?.emit('agent-update', { agentId, ...statusData });
    }

    async synthesizeResults(results, originalTask, implementation) {
      console.log('\n' + '='.repeat(80));
      console.log('🎭 FINAL SYNTHESIS');
      console.log('='.repeat(80));
      
      this.updateAgentStatus('orchestrator', 'synthesizing', 'Creating final report...');
      
      const synthesis = await this.claude.messages.create({
        model: this.agents.orchestrator.model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Synthesize the final results.

Original Task: ${originalTask}

Implementation Summary:
- Files created: ${implementation.files.join(', ')}
- ${implementation.summary}

Provide a brief summary of:
1. What was built
2. Where it was placed
3. How to access it
4. Any manual steps needed`
        }]
      });

      this.updateAgentStatus('orchestrator', 'complete', 'Complete!');
      
      return synthesis.content[0].text;
    }
  }

  // ============ START SWARM ============
  
  (async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ Error: ANTHROPIC_API_KEY not set');
      process.exit(1);
    }

    const swarm = new MekTycoonSwarmAuto();
    
    // Parse command line args
    const args = process.argv.slice(2);
    const task = args[0] || "Create a Three.js block stacking mini-game";
    const location = args[1] || "src/app/scrap-yard/page.tsx";
    
    try {
      const result = await swarm.runTask(task, location);
      
      console.log('\n' + '='.repeat(80));
      console.log('✨ AUTO-IMPLEMENTATION COMPLETE!');
      console.log('='.repeat(80));
      console.log(result);
      console.log('='.repeat(80));
      
      console.log('\n📁 Files created:');
      swarm.implementedFiles.forEach(f => console.log(`  ✅ ${f}`));
      console.log('\n🚀 Your app at http://localhost:3100 should auto-reload!');
      
    } catch (error) {
      console.error('❌ Swarm execution failed:', error);
    }
  })();

} else {
  // ============ WORKER THREAD ============
  
  class SwarmAgent {
    constructor(config) {
      this.config = config.agentConfig;
      this.task = config.task;
      this.wave = config.waveNumber;
      this.dependencies = config.previousResults || {};
      this.projectRoot = config.projectRoot;
      this.claude = new Anthropic({ apiKey: config.apiKey });
      this.tools = this.initializeTools();
    }

    initializeTools() {
      const tools = {};
      
      if (this.config.tools.includes('Read')) {
        tools.read = async (filepath) => {
          try {
            const fullPath = path.isAbsolute(filepath) 
              ? filepath 
              : path.join(this.projectRoot, filepath);
            return await fs.readFile(fullPath, 'utf-8');
          } catch (err) {
            return `Error reading: ${err.message}`;
          }
        };
      }

      if (this.config.tools.includes('Write')) {
        tools.write = async (filepath, content) => {
          try {
            const fullPath = path.isAbsolute(filepath)
              ? filepath
              : path.join(this.projectRoot, filepath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
            return `Written to ${filepath}`;
          } catch (err) {
            return `Error writing: ${err.message}`;
          }
        };
      }

      if (this.config.tools.includes('Edit')) {
        tools.edit = async (filepath, searchStr, replaceStr) => {
          try {
            const fullPath = path.isAbsolute(filepath)
              ? filepath  
              : path.join(this.projectRoot, filepath);
            const content = await fs.readFile(fullPath, 'utf-8');
            const updated = content.replace(searchStr, replaceStr);
            await fs.writeFile(fullPath, updated);
            return `Edited ${filepath}`;
          } catch (err) {
            return `Error editing: ${err.message}`;
          }
        };
      }

      if (this.config.tools.includes('Bash')) {
        tools.bash = async (command) => {
          try {
            const { stdout, stderr } = await execAsync(command, { cwd: this.projectRoot });
            return stdout || stderr;
          } catch (err) {
            return `Command error: ${err.message}`;
          }
        };
      }

      return tools;
    }

    async execute() {
      parentPort.postMessage({
        type: 'status',
        status: 'working',
        message: `${this.task.task.substring(0, 50)}...`
      });

      try {
        const response = await this.claude.messages.create({
          model: this.config.model,
          max_tokens: 8192,
          messages: [{
            role: 'user',
            content: `You are ${this.config.name}.
Role: ${this.config.role}
Task: ${this.task.task}

${this.config.id === 'implementation_specialist' ? 
`IMPORTANT: You must generate ACTUAL, COMPLETE code files.
Project uses: Next.js 15, React, TypeScript, Tailwind v3, Convex
Create working components with full implementations.` : 
`Provide detailed designs/specifications for your area of expertise.`}

Be thorough and specific.`
          }]
        });

        parentPort.postMessage({
          type: 'progress',
          progress: 100,
          detail: 'Complete'
        });

        parentPort.postMessage({
          type: 'result',
          data: response.content[0].text,
          deliverables: this.task.deliverables
        });

      } catch (error) {
        parentPort.postMessage({
          type: 'error',
          error: error.message
        });
      }
    }
  }

  const agent = new SwarmAgent(workerData);
  agent.execute();
}