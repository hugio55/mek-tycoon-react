const { exec, spawn } = require('child_process');
const puppeteer = require('puppeteer');
const readline = require('readline');

class BrowserMonitor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.devProcess = null;
  }

  // Start the dev server and monitor output
  async startDevServer() {
    console.log('Starting development server...');

    this.devProcess = spawn('npm', ['run', 'dev:all'], {
      shell: true,
      cwd: process.cwd()
    });

    // Monitor terminal output
    this.devProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Dev Server:', output);

      // Check if server is ready
      if (output.includes('Ready on http://localhost:3100')) {
        console.log('Server is ready! Opening browser...');
        this.openBrowser();
      }
    });

    this.devProcess.stderr.on('data', (data) => {
      console.error('Dev Server Error:', data.toString());
    });
  }

  // Open browser and navigate automatically
  async openBrowser() {
    try {
      // Launch Puppeteer browser
      this.browser = await puppeteer.launch({
        headless: false, // Show browser window
        defaultViewport: null,
        args: ['--start-maximized']
      });

      this.page = await this.browser.newPage();

      // Navigate to your app
      await this.page.goto('http://localhost:3100', {
        waitUntil: 'networkidle2'
      });

      console.log('Browser opened successfully!');

      // Monitor console logs from the page
      this.page.on('console', msg => {
        console.log('Browser Console:', msg.text());
      });

      // Monitor page errors
      this.page.on('error', err => {
        console.error('Browser Error:', err);
      });

      // Set up automatic actions
      await this.setupAutomation();

    } catch (error) {
      console.error('Failed to open browser:', error);
    }
  }

  // Set up automatic browser actions
  async setupAutomation() {
    // Example: Click on specific elements after page loads
    try {
      // Wait for navigation to be ready
      await this.page.waitForSelector('nav', { timeout: 5000 });

      // Example automated actions:
      // await this.page.click('button#hub-button');
      // await this.page.waitForNavigation();

      console.log('Automation setup complete');
    } catch (error) {
      console.log('Automation setup error:', error.message);
    }
  }

  // Take screenshot
  async takeScreenshot(filename = 'screenshot.png') {
    if (this.page) {
      await this.page.screenshot({ path: filename, fullPage: true });
      console.log(`Screenshot saved as ${filename}`);
    }
  }

  // Execute custom JavaScript in browser
  async executeInBrowser(code) {
    if (this.page) {
      const result = await this.page.evaluate(code);
      return result;
    }
  }

  // Read specific element text
  async readElement(selector) {
    if (this.page) {
      try {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        const text = await this.page.$eval(selector, el => el.textContent);
        return text;
      } catch (error) {
        console.error(`Could not read element ${selector}:`, error.message);
        return null;
      }
    }
  }

  // Click element
  async clickElement(selector) {
    if (this.page) {
      try {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        await this.page.click(selector);
        console.log(`Clicked ${selector}`);
      } catch (error) {
        console.error(`Could not click ${selector}:`, error.message);
      }
    }
  }

  // Navigate to different page
  async navigate(path) {
    if (this.page) {
      await this.page.goto(`http://localhost:3100${path}`, {
        waitUntil: 'networkidle2'
      });
      console.log(`Navigated to ${path}`);
    }
  }

  // Clean up
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.devProcess) {
      this.devProcess.kill();
    }
  }
}

// Interactive CLI for browser control
async function startInteractiveMode() {
  const monitor = new BrowserMonitor();

  // Start the dev server
  await monitor.startDevServer();

  // Set up readline for interactive commands
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'browser> '
  });

  console.log('\nBrowser Monitor Commands:');
  console.log('  navigate <path> - Navigate to a path');
  console.log('  click <selector> - Click an element');
  console.log('  read <selector> - Read element text');
  console.log('  screenshot [filename] - Take a screenshot');
  console.log('  eval <code> - Execute JavaScript in browser');
  console.log('  exit - Exit the monitor\n');

  rl.prompt();

  rl.on('line', async (line) => {
    const [command, ...args] = line.trim().split(' ');

    switch (command) {
      case 'navigate':
        await monitor.navigate(args.join(' '));
        break;
      case 'click':
        await monitor.clickElement(args.join(' '));
        break;
      case 'read':
        const text = await monitor.readElement(args.join(' '));
        console.log('Element text:', text);
        break;
      case 'screenshot':
        await monitor.takeScreenshot(args[0] || 'screenshot.png');
        break;
      case 'eval':
        const result = await monitor.executeInBrowser(args.join(' '));
        console.log('Result:', result);
        break;
      case 'exit':
        await monitor.cleanup();
        process.exit(0);
        break;
      default:
        console.log('Unknown command:', command);
    }

    rl.prompt();
  });

  rl.on('close', async () => {
    await monitor.cleanup();
    process.exit(0);
  });
}

// Start if run directly
if (require.main === module) {
  startInteractiveMode();
}

module.exports = BrowserMonitor;