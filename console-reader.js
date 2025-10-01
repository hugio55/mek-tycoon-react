const puppeteer = require('puppeteer');
const chalk = require('chalk');

class ConsoleReader {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isConnected = false;
    this.consoleHistory = [];
    this.maxHistory = 100;
  }

  // Connect to existing Chrome instance
  async connectToExistingBrowser() {
    try {
      console.log(chalk.yellow('Connecting to existing Chrome tab...'));

      // Connect to Chrome DevTools Protocol
      // Chrome must be running with --remote-debugging-port=9222
      this.browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
      });

      // Get all pages/tabs
      const pages = await this.browser.pages();

      // Find the Mek Tycoon tab
      for (const page of pages) {
        const url = page.url();
        if (url.includes('localhost:3100')) {
          this.page = page;
          console.log(chalk.green(`✓ Connected to: ${url}`));
          break;
        }
      }

      if (!this.page) {
        console.log(chalk.yellow('No localhost:3100 tab found. Available tabs:'));
        pages.forEach(async (p, i) => {
          const title = await p.title();
          console.log(`  ${i + 1}. ${title} - ${p.url()}`);
        });

        // Use first tab as fallback
        this.page = pages[0];
        console.log(chalk.yellow(`Using first tab: ${await this.page.title()}`));
      }

      await this.setupListeners();
      this.isConnected = true;

    } catch (error) {
      if (error.message.includes('connect ECONNREFUSED')) {
        console.log(chalk.red('❌ Chrome is not running in debug mode!'));
        console.log(chalk.yellow('\nTo enable remote debugging:'));
        console.log('1. Close all Chrome windows');
        console.log('2. Run: ' + chalk.cyan('chrome-debug.bat'));
        console.log('3. Navigate to http://localhost:3100');
        console.log('4. Run this script again\n');
      } else {
        console.error('Connection error:', error.message);
      }
      return false;
    }
    return true;
  }

  // Set up console listeners
  async setupListeners() {
    // Listen to console events
    this.page.on('console', message => {
      const type = message.type();
      const text = message.text();
      const timestamp = new Date().toLocaleTimeString();

      // Add to history
      this.consoleHistory.push({ type, text, timestamp });
      if (this.consoleHistory.length > this.maxHistory) {
        this.consoleHistory.shift();
      }

      // Format and display
      this.displayConsoleMessage(type, text, timestamp);
    });

    // Listen to page errors
    this.page.on('pageerror', error => {
      console.log(chalk.red(`[ERROR] ${error.message}`));
      this.consoleHistory.push({
        type: 'error',
        text: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    });

    // Listen to request failures
    this.page.on('requestfailed', request => {
      const failure = request.failure();
      if (failure) {
        console.log(chalk.red(`[NETWORK] Failed: ${request.url()} - ${failure.errorText}`));
      }
    });

    console.log(chalk.green('✓ Console monitoring active\n'));
  }

  // Display formatted console message
  displayConsoleMessage(type, text, timestamp) {
    const prefix = `[${timestamp}]`;

    switch(type) {
      case 'log':
        console.log(chalk.gray(prefix), text);
        break;
      case 'error':
        console.log(chalk.red(prefix), chalk.red(text));
        break;
      case 'warning':
        console.log(chalk.yellow(prefix), chalk.yellow(text));
        break;
      case 'info':
        console.log(chalk.blue(prefix), text);
        break;
      case 'debug':
        console.log(chalk.magenta(prefix), chalk.gray(text));
        break;
      default:
        console.log(prefix, text);
    }
  }

  // Get recent console history
  getHistory(count = 20) {
    return this.consoleHistory.slice(-count);
  }

  // Clear console history
  clearHistory() {
    this.consoleHistory = [];
    console.log(chalk.green('Console history cleared'));
  }

  // Execute code in the browser
  async evaluate(code) {
    if (!this.page) {
      console.log(chalk.red('Not connected to any page'));
      return;
    }

    try {
      const result = await this.page.evaluate(code);
      console.log(chalk.green('Result:'), result);
      return result;
    } catch (error) {
      console.log(chalk.red('Evaluation error:'), error.message);
    }
  }

  // Reload the page
  async reload() {
    if (!this.page) {
      console.log(chalk.red('Not connected to any page'));
      return;
    }

    console.log(chalk.yellow('Reloading page...'));
    await this.page.reload({ waitUntil: 'networkidle2' });
    console.log(chalk.green('Page reloaded'));
  }

  // Get page metrics
  async getMetrics() {
    if (!this.page) return;

    const metrics = await this.page.metrics();
    console.log(chalk.cyan('\n=== Page Metrics ==='));
    console.log(`Timestamp: ${metrics.Timestamp}`);
    console.log(`DOM Nodes: ${metrics.Nodes}`);
    console.log(`JS Heap Used: ${(metrics.JSHeapUsedSize / 1048576).toFixed(2)} MB`);
    console.log(`JS Heap Total: ${(metrics.JSHeapTotalSize / 1048576).toFixed(2)} MB`);
    console.log('==================\n');
  }

  // Watch mode - just display console output
  async watchMode() {
    console.log(chalk.cyan('📺 Watch Mode - Displaying console output...'));
    console.log(chalk.gray('Press Ctrl+C to exit\n'));

    // Keep the script running
    await new Promise(() => {});
  }

  // Interactive mode with commands
  async interactiveMode() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('console> ')
    });

    console.log(chalk.cyan('\n=== Console Reader Commands ==='));
    console.log('  ' + chalk.yellow('history [n]') + '    - Show last n console messages');
    console.log('  ' + chalk.yellow('clear') + '         - Clear console history');
    console.log('  ' + chalk.yellow('eval <code>') + '   - Execute JavaScript in the page');
    console.log('  ' + chalk.yellow('reload') + '        - Reload the page');
    console.log('  ' + chalk.yellow('metrics') + '       - Show page performance metrics');
    console.log('  ' + chalk.yellow('watch') + '         - Enter watch mode (no commands)');
    console.log('  ' + chalk.yellow('exit') + '          - Exit the reader');
    console.log('===============================\n');

    rl.prompt();

    rl.on('line', async (line) => {
      const [command, ...args] = line.trim().split(' ');

      switch(command) {
        case 'history':
          const count = parseInt(args[0]) || 20;
          const history = this.getHistory(count);
          console.log(chalk.cyan(`\n=== Last ${count} Console Messages ===`));
          history.forEach(entry => {
            this.displayConsoleMessage(entry.type, entry.text, entry.timestamp);
          });
          console.log('');
          break;

        case 'clear':
          this.clearHistory();
          break;

        case 'eval':
          const code = args.join(' ');
          await this.evaluate(code);
          break;

        case 'reload':
          await this.reload();
          break;

        case 'metrics':
          await this.getMetrics();
          break;

        case 'watch':
          console.log(chalk.cyan('\nEntering watch mode...'));
          await this.watchMode();
          break;

        case 'exit':
          console.log(chalk.yellow('Goodbye!'));
          process.exit(0);

        default:
          if (command) {
            console.log(chalk.red(`Unknown command: ${command}`));
          }
      }

      rl.prompt();
    });

    rl.on('close', () => {
      console.log(chalk.yellow('\nGoodbye!'));
      process.exit(0);
    });
  }
}

// Check if chalk is installed
async function checkDependencies() {
  try {
    require('chalk');
  } catch (error) {
    console.log('Installing chalk for colored output...');
    require('child_process').execSync('npm install chalk', { stdio: 'inherit' });
  }
}

// Main execution
async function main() {
  await checkDependencies();

  const reader = new ConsoleReader();
  const connected = await reader.connectToExistingBrowser();

  if (connected) {
    // Check for command line arguments
    const args = process.argv.slice(2);

    if (args[0] === '--watch' || args[0] === '-w') {
      await reader.watchMode();
    } else {
      await reader.interactiveMode();
    }
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nExiting...'));
  process.exit(0);
});

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = ConsoleReader;