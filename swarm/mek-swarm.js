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

if (isMainThread) {
  // ============ MAIN THREAD - ORCHESTRATOR ============
  
  class MekTycoonSwarm extends EventEmitter {
    constructor() {
      super();
      this.claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      this.agents = this.defineAgents();
      this.taskQueue = [];
      this.activeWorkers = new Map();
      this.messageHub = new Map(); // Inter-agent communication
      this.agentStatus = new Map();
      this.taskGraph = new Map(); // Task dependency graph
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
        
        // Send initial agent states
        socket.emit('agents', Object.values(this.agents));
        
        // Send current status
        this.agentStatus.forEach((status, agentId) => {
          socket.emit('agent-update', { agentId, ...status });
        });
      });

      const PORT = 4200;
      server.listen(PORT, () => {
        console.log(`\n🌐 Swarm Dashboard: http://localhost:${PORT}\n`);
      });
    }

    async runTask(userTask) {
      console.log('\n' + '='.repeat(80));
      console.log('🤖 MEK TYCOON SWARM ACTIVATED');
      console.log('='.repeat(80));
      console.log(`📋 MAIN TASK: ${userTask}`);
      console.log('='.repeat(80) + '\n');

      // Step 1: Orchestrator creates execution plan
      const executionPlan = await this.createExecutionPlan(userTask);
      
      // Step 2: Build task dependency graph
      this.buildDependencyGraph(executionPlan);
      
      // Step 3: Execute tasks in parallel waves based on dependencies
      const results = await this.executeParallelWaves(executionPlan);
      
      // Step 4: Orchestrator synthesizes results
      const synthesis = await this.synthesizeResults(results, userTask);
      
      return synthesis;
    }

    async createExecutionPlan(task) {
      this.updateAgentStatus('orchestrator', 'analyzing', 'Analyzing task and creating execution plan...');
      
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

Create a detailed execution plan. Consider:
1. Which agents are needed
2. What specific subtasks each should handle
3. Dependencies between tasks
4. Parallel execution opportunities

Return as JSON:
{
  "analysis": "brief task understanding",
  "execution_waves": [
    {
      "wave": 1,
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
      
      // Visualize the plan
      this.io?.emit('execution-plan', plan);
      
      console.log(`📊 Execution Plan Created:`);
      plan.execution_waves.forEach(wave => {
        console.log(`\n  Wave ${wave.wave}: ${wave.parallel_tasks.length} parallel tasks`);
        wave.parallel_tasks.forEach(t => {
          console.log(`    • ${this.agents[t.agent].name}: ${t.task.substring(0, 50)}...`);
        });
      });
      
      this.updateAgentStatus('orchestrator', 'ready', 'Execution plan complete');
      
      return plan;
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
      
      // Send graph to dashboard
      this.io?.emit('dependency-graph', Array.from(this.taskGraph.entries()));
    }

    async executeParallelWaves(plan) {
      const allResults = [];
      
      for (const wave of plan.execution_waves) {
        console.log(`\n🌊 Executing Wave ${wave.wave} (${wave.parallel_tasks.length} parallel tasks)`);
        
        // Create workers for all tasks in this wave
        const waveWorkers = await Promise.all(
          wave.parallel_tasks.map(task => this.createAgentWorker(task, wave.wave))
        );
        
        // Execute all tasks in parallel
        const waveResults = await Promise.all(
          waveWorkers.map(w => w.promise)
        );
        
        // Store results for next wave
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
      
      this.updateAgentStatus(taskDef.agent, 'starting', `Starting: ${taskDef.task.substring(0, 30)}...`);
      
      const worker = new Worker(fileURLToPath(import.meta.url), {
        workerData: {
          agentConfig: agent,
          task: taskDef,
          waveNumber,
          apiKey: process.env.ANTHROPIC_API_KEY,
          previousResults: this.gatherDependencies(taskDef.requires_from)
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
            case 'request':
              this.handleInterAgentRequest(msg, worker);
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

    handleInterAgentRequest(request, requesterWorker) {
      const targetAgent = request.targetAgent;
      const targetWorker = Array.from(this.activeWorkers.values())
        .find(w => w.worker.threadId === targetAgent);
      
      if (targetWorker) {
        targetWorker.worker.postMessage({
          type: 'agent_request',
          from: request.from,
          query: request.query
        });
      } else {
        requesterWorker.postMessage({
          type: 'request_response',
          data: this.messageHub.get(targetAgent)
        });
      }
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

    async synthesizeResults(results, originalTask) {
      console.log('\n' + '='.repeat(80));
      console.log('🎭 ORCHESTRATOR: Synthesizing final solution...');
      
      this.updateAgentStatus('orchestrator', 'synthesizing', 'Creating final solution...');
      
      const synthesis = await this.claude.messages.create({
        model: this.agents.orchestrator.model,
        max_tokens: 8192,
        messages: [{
          role: 'user',
          content: `As Orchestrator, synthesize these results into a cohesive solution.

Original Task: ${originalTask}

Agent Results:
${results.map(r => `
${this.agents[r.agent].name} (Wave ${r.wave}):
Result: ${r.result}
Deliverables: ${r.deliverables?.join(', ') || 'None'}
`).join('\n---\n')}

Provide:
1. Summary of what was accomplished
2. How the pieces fit together
3. Next steps or recommendations
4. Any conflicts or issues to resolve`
        }]
      });

      this.updateAgentStatus('orchestrator', 'complete', 'Synthesis complete');
      
      return synthesis.content[0].text;
    }
  }

  // ============ START SWARM ============
  
  (async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
      console.log('Please set it using: set ANTHROPIC_API_KEY=your-key-here');
      process.exit(1);
    }

    const swarm = new MekTycoonSwarm();
    
    const task = process.argv[2] || 
      "Create an engaging Three.js mini-game for Mek Tycoon where players stack blocks to earn essence. Include glass-morphism UI elements and smooth animations.";

    console.log('Starting swarm with task:', task);
    
    try {
      const result = await swarm.runTask(task);
      
      console.log('\n' + '='.repeat(80));
      console.log('📊 FINAL SYNTHESIZED SOLUTION:');
      console.log('='.repeat(80));
      console.log(result);
      console.log('='.repeat(80) + '\n');
      
      console.log('✨ Swarm execution complete! Check dashboard for details.');
    } catch (error) {
      console.error('❌ Swarm execution failed:', error);
    }
  })();

} else {
  // ============ WORKER THREAD - INDIVIDUAL AGENT ============
  
  class SwarmAgent {
    constructor(config) {
      this.config = config.agentConfig;
      this.task = config.task;
      this.wave = config.waveNumber;
      this.dependencies = config.previousResults || {};
      this.claude = new Anthropic({ apiKey: config.apiKey });
      this.tools = this.initializeTools();
    }

    initializeTools() {
      const tools = {};
      
      if (this.config.tools.includes('Read')) {
        tools.read = async (filepath) => {
          try {
            const content = await fs.readFile(filepath, 'utf-8');
            return content;
          } catch (err) {
            return `Error reading ${filepath}: ${err.message}`;
          }
        };
      }

      if (this.config.tools.includes('Write')) {
        tools.write = async (filepath, content) => {
          try {
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            await fs.writeFile(filepath, content);
            return `Successfully wrote to ${filepath}`;
          } catch (err) {
            return `Error writing ${filepath}: ${err.message}`;
          }
        };
      }

      if (this.config.tools.includes('Edit')) {
        tools.edit = async (filepath, searchStr, replaceStr) => {
          try {
            const content = await fs.readFile(filepath, 'utf-8');
            const updated = content.replace(searchStr, replaceStr);
            await fs.writeFile(filepath, updated);
            return `Successfully edited ${filepath}`;
          } catch (err) {
            return `Error editing ${filepath}: ${err.message}`;
          }
        };
      }

      if (this.config.tools.includes('Bash')) {
        tools.bash = async (command) => {
          try {
            const { stdout, stderr } = await execAsync(command);
            return stdout || stderr;
          } catch (err) {
            return `Command error: ${err.message}`;
          }
        };
      }

      if (this.config.tools.includes('WebSearch')) {
        tools.search = async (query) => {
          // Placeholder for actual web search
          return `Search results for: ${query} (implement actual search API)`;
        };
      }

      return tools;
    }

    async execute() {
      parentPort.postMessage({
        type: 'status',
        status: 'working',
        message: `Executing: ${this.task.task.substring(0, 50)}...`
      });

      const startTime = Date.now();

      try {
        // Build context with dependencies
        let dependencyContext = '';
        if (Object.keys(this.dependencies).length > 0) {
          dependencyContext = '\n\nResults from other agents:\n' +
            Object.entries(this.dependencies).map(([agent, data]) => 
              `${agent}: ${JSON.stringify(data.deliverables)}`
            ).join('\n');
        }

        // Build tool descriptions
        const toolDescriptions = Object.keys(this.tools).map(t => 
          `- ${t}: Available for use`
        ).join('\n');

        // Create prompt
        const response = await this.claude.messages.create({
          model: this.config.model,
          max_tokens: 8192,
          messages: [{
            role: 'user',
            content: `You are ${this.config.name}.
Role: ${this.config.role}
Personality: ${this.config.personality}
Capabilities: ${this.config.capabilities.join(', ')}

Your task: ${this.task.task}
Expected deliverables: ${this.task.deliverables?.join(', ') || 'Complete the task'}

Available tools:
${toolDescriptions}
${dependencyContext}

Instructions:
1. Complete your specific task thoroughly
2. Focus on your area of expertise
3. If you need to create files, use appropriate paths
4. Describe what you're doing and why
5. Provide specific, actionable output

Think step by step and be thorough in your specialized area.`
          }]
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        parentPort.postMessage({
          type: 'progress',
          progress: 100,
          detail: `Completed in ${elapsed}s`
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

    async requestFromAgent(agentId, query) {
      parentPort.postMessage({
        type: 'request',
        from: this.config.id,
        targetAgent: agentId,
        query: query
      });

      // Wait for response (simplified - in production use proper async handling)
      return new Promise(resolve => {
        const handler = (msg) => {
          if (msg.type === 'request_response') {
            parentPort.off('message', handler);
            resolve(msg.data);
          }
        };
        parentPort.on('message', handler);
      });
    }
  }

  // Start the agent
  const agent = new SwarmAgent(workerData);
  agent.execute();
}