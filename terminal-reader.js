const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TerminalReader {
  constructor(logFile = 'terminal-output.log') {
    this.logFile = logFile;
    this.processes = new Map();
    this.outputBuffer = [];
    this.maxBufferSize = 1000; // Keep last 1000 lines
  }

  // Run a command and capture its output
  runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const process = spawn(command, args, {
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        this.addToBuffer('STDOUT', text);
        this.logOutput('STDOUT', text);
      });

      process.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        this.addToBuffer('STDERR', text);
        this.logOutput('STDERR', text);
      });

      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        const result = {
          command: `${command} ${args.join(' ')}`,
          stdout,
          stderr,
          exitCode: code,
          duration,
          timestamp: new Date().toISOString()
        };
        resolve(result);
      });

      process.on('error', (error) => {
        reject(error);
      });

      // Store process reference
      this.processes.set(process.pid, process);
    });
  }

  // Start a long-running process and monitor it
  startProcess(name, command, args = [], options = {}) {
    const process = spawn(command, args, {
      shell: true,
      ...options
    });

    const processInfo = {
      name,
      command: `${command} ${args.join(' ')}`,
      pid: process.pid,
      startTime: new Date().toISOString(),
      process
    };

    // Monitor output
    process.stdout.on('data', (data) => {
      const text = data.toString();
      this.addToBuffer(`[${name}] STDOUT`, text);
      this.logOutput(`[${name}] STDOUT`, text);

      // Trigger callbacks for specific patterns
      this.checkPatterns(name, text);
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      this.addToBuffer(`[${name}] STDERR`, text);
      this.logOutput(`[${name}] STDERR`, text);
    });

    process.on('close', (code) => {
      console.log(`Process ${name} exited with code ${code}`);
      this.processes.delete(process.pid);
    });

    this.processes.set(process.pid, processInfo);
    return processInfo;
  }

  // Pattern matching for automatic actions
  checkPatterns(processName, output) {
    const patterns = {
      'dev:all': {
        'Ready on http://localhost:3100': () => {
          console.log('🚀 Server is ready! Opening browser...');
          this.openBrowser('http://localhost:3100');
        },
        'Convex functions ready': () => {
          console.log('✅ Convex backend ready!');
        },
        'Error': (match) => {
          console.error('❌ Error detected:', match);
        }
      }
    };

    if (patterns[processName]) {
      for (const [pattern, callback] of Object.entries(patterns[processName])) {
        if (output.includes(pattern)) {
          callback(output);
        }
      }
    }
  }

  // Open browser automatically
  openBrowser(url) {
    const start = process.platform === 'win32' ? 'start' :
                  process.platform === 'darwin' ? 'open' : 'xdg-open';

    spawn(start, [url], { shell: true });
  }

  // Add output to buffer
  addToBuffer(type, text) {
    const lines = text.split('\n').filter(line => line.trim());
    for (const line of lines) {
      this.outputBuffer.push({
        type,
        text: line,
        timestamp: new Date().toISOString()
      });
    }

    // Trim buffer if too large
    if (this.outputBuffer.length > this.maxBufferSize) {
      this.outputBuffer = this.outputBuffer.slice(-this.maxBufferSize);
    }
  }

  // Log output to file
  logOutput(type, text) {
    const logEntry = `[${new Date().toISOString()}] [${type}] ${text}`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  // Get recent output
  getRecentOutput(lines = 50) {
    return this.outputBuffer.slice(-lines);
  }

  // Search output for pattern
  searchOutput(pattern) {
    const regex = new RegExp(pattern, 'gi');
    return this.outputBuffer.filter(entry =>
      regex.test(entry.text)
    );
  }

  // Get process info
  getProcesses() {
    const info = [];
    for (const [pid, processInfo] of this.processes) {
      info.push({
        pid,
        name: processInfo.name || 'unnamed',
        command: processInfo.command,
        startTime: processInfo.startTime
      });
    }
    return info;
  }

  // Kill a process
  killProcess(pid) {
    const processInfo = this.processes.get(pid);
    if (processInfo && processInfo.process) {
      processInfo.process.kill();
      this.processes.delete(pid);
      return true;
    }
    return false;
  }

  // Clear log file
  clearLog() {
    fs.writeFileSync(this.logFile, '');
    this.outputBuffer = [];
  }
}

// Example usage for Mek Tycoon
async function monitorMekTycoon() {
  const reader = new TerminalReader('mek-tycoon.log');

  console.log('Starting Mek Tycoon monitoring...\n');

  // Start the dev server
  const devServer = reader.startProcess('dev:all', 'npm', ['run', 'dev:all']);
  console.log(`Started dev server (PID: ${devServer.pid})`);

  // Interactive commands
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'monitor> '
  });

  console.log('\nCommands:');
  console.log('  recent [n] - Show recent n lines (default 50)');
  console.log('  search <pattern> - Search output for pattern');
  console.log('  processes - List running processes');
  console.log('  kill <pid> - Kill a process');
  console.log('  clear - Clear log file');
  console.log('  exit - Exit monitor\n');

  rl.prompt();

  rl.on('line', (line) => {
    const [command, ...args] = line.trim().split(' ');

    switch (command) {
      case 'recent':
        const lines = parseInt(args[0]) || 50;
        const recent = reader.getRecentOutput(lines);
        recent.forEach(entry => {
          console.log(`[${entry.type}] ${entry.text}`);
        });
        break;

      case 'search':
        const pattern = args.join(' ');
        const results = reader.searchOutput(pattern);
        console.log(`Found ${results.length} matches:`);
        results.forEach(entry => {
          console.log(`[${entry.timestamp}] [${entry.type}] ${entry.text}`);
        });
        break;

      case 'processes':
        const processes = reader.getProcesses();
        processes.forEach(p => {
          console.log(`PID: ${p.pid}, Name: ${p.name}, Started: ${p.startTime}`);
        });
        break;

      case 'kill':
        const pid = parseInt(args[0]);
        if (reader.killProcess(pid)) {
          console.log(`Killed process ${pid}`);
        } else {
          console.log(`Process ${pid} not found`);
        }
        break;

      case 'clear':
        reader.clearLog();
        console.log('Log cleared');
        break;

      case 'exit':
        // Kill all processes
        reader.getProcesses().forEach(p => {
          reader.killProcess(p.pid);
        });
        process.exit(0);
        break;

      default:
        console.log('Unknown command:', command);
    }

    rl.prompt();
  });
}

// Start if run directly
if (require.main === module) {
  monitorMekTycoon();
}

module.exports = TerminalReader;