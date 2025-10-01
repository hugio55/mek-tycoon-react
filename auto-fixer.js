const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

// Simple color functions as fallback
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// Try to load chalk, fall back to simple colors
let chalk;
try {
  const chalkModule = require('chalk');
  chalk = chalkModule.default || chalkModule;
} catch (e) {
  chalk = colors;
}

class AutoFixer {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errorQueue = [];
    this.fixHistory = [];
    this.isFixing = false;
    this.knownFixes = this.loadKnownFixes();
  }

  // Load known error patterns and their fixes
  loadKnownFixes() {
    return {
      // React/Next.js common errors
      "Cannot read properties of undefined": {
        pattern: /Cannot read properties of undefined \(reading '([^']+)'\)/,
        fix: async (match, file) => {
          const property = match[1];
          console.log(chalk.yellow(`Fixing undefined property: ${property}`));
          return this.addNullCheck(file, property);
        }
      },

      "is not defined": {
        pattern: /([A-Za-z_]\w+) is not defined/,
        fix: async (match, file) => {
          const variable = match[1];
          console.log(chalk.yellow(`Fixing undefined variable: ${variable}`));
          return this.addMissingImport(file, variable);
        }
      },

      "Module not found": {
        pattern: /Module not found: Can't resolve '([^']+)'/,
        fix: async (match) => {
          const module = match[1];
          console.log(chalk.yellow(`Installing missing module: ${module}`));
          return this.installPackage(module);
        }
      },

      "Expected": {
        pattern: /Expected '([^']+)' but got '([^']+)'/,
        fix: async (match, file) => {
          const [expected, got] = [match[1], match[2]];
          console.log(chalk.yellow(`Fixing type mismatch: expected ${expected}, got ${got}`));
          return this.fixTypeMismatch(file, expected, got);
        }
      },

      "Hydration failed": {
        pattern: /Hydration failed/,
        fix: async (match, file) => {
          console.log(chalk.yellow('Fixing hydration error'));
          return this.fixHydrationError(file);
        }
      },

      "useState is not defined": {
        pattern: /useState is not defined/,
        fix: async (match, file) => {
          console.log(chalk.yellow('Adding React hooks import'));
          return this.addReactImport(file, 'useState');
        }
      },

      "useEffect is not defined": {
        pattern: /useEffect is not defined/,
        fix: async (match, file) => {
          console.log(chalk.yellow('Adding React hooks import'));
          return this.addReactImport(file, 'useEffect');
        }
      }
    };
  }

  // Connect to Chrome and start monitoring
  async connect() {
    try {
      this.browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
      });

      const pages = await this.browser.pages();
      for (const page of pages) {
        if (page.url().includes('localhost:3100')) {
          this.page = page;
          break;
        }
      }

      if (!this.page && pages.length > 0) {
        this.page = pages[0];
      }

      await this.setupErrorCapture();
      console.log(chalk.green('✓ Auto-fixer connected and monitoring'));

    } catch (error) {
      console.log(chalk.red('Failed to connect. Make sure Chrome is running with --remote-debugging-port=9222'));
      return false;
    }
    return true;
  }

  // Set up error capture
  async setupErrorCapture() {
    // Capture console errors
    this.page.on('console', async message => {
      if (message.type() === 'error') {
        const errorText = message.text();
        const stackTrace = message.stackTrace();

        this.errorQueue.push({
          text: errorText,
          stack: stackTrace,
          timestamp: new Date(),
          url: this.page.url()
        });

        console.log(chalk.red(`[ERROR DETECTED] ${errorText}`));

        // Auto-fix if not already fixing
        if (!this.isFixing) {
          await this.processErrorQueue();
        }
      }
    });

    // Capture page errors
    this.page.on('pageerror', async error => {
      this.errorQueue.push({
        text: error.message,
        stack: error.stack,
        timestamp: new Date(),
        url: this.page.url()
      });

      console.log(chalk.red(`[PAGE ERROR] ${error.message}`));

      if (!this.isFixing) {
        await this.processErrorQueue();
      }
    });

    // Capture unhandled promise rejections
    await this.page.evaluateOnNewDocument(() => {
      window.addEventListener('unhandledrejection', event => {
        console.error('Unhandled promise rejection:', event.reason);
      });
    });
  }

  // Process error queue and apply fixes
  async processErrorQueue() {
    if (this.errorQueue.length === 0) return;

    this.isFixing = true;
    console.log(chalk.cyan('\n🔧 Auto-fixing detected errors...\n'));

    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift();
      await this.attemptFix(error);
    }

    this.isFixing = false;

    // Reload page after fixes
    console.log(chalk.yellow('\n↻ Reloading page to verify fixes...'));
    await this.page.reload({ waitUntil: 'networkidle2' });

    // Check if errors persist after reload
    setTimeout(() => {
      if (this.errorQueue.length === 0) {
        console.log(chalk.green('✓ All errors fixed successfully!\n'));
      }
    }, 3000);
  }

  // Attempt to fix an error
  async attemptFix(error) {
    console.log(chalk.yellow(`Attempting to fix: ${error.text.substring(0, 100)}...`));

    // Try known fixes
    for (const [fixName, fixData] of Object.entries(this.knownFixes)) {
      const match = error.text.match(fixData.pattern);
      if (match) {
        console.log(chalk.cyan(`Applying fix: ${fixName}`));

        // Determine which file to fix
        const file = await this.findSourceFile(error);

        // Apply the fix
        const result = await fixData.fix(match, file);

        if (result) {
          this.fixHistory.push({
            error: error.text,
            fix: fixName,
            file: file,
            timestamp: new Date(),
            success: true
          });

          console.log(chalk.green(`✓ Fix applied: ${fixName}\n`));
          return true;
        }
      }
    }

    // If no known fix, try AI-powered fix
    console.log(chalk.yellow('No known fix found. Attempting AI-powered fix...'));
    return await this.aiPoweredFix(error);
  }

  // Find source file from error stack trace
  async findSourceFile(error) {
    if (error.stack && error.stack.length > 0) {
      const frame = error.stack[0];
      if (frame && frame.url) {
        // Extract file path from URL
        const match = frame.url.match(/src\/(.+\.(jsx?|tsx?))/);
        if (match) {
          return path.join(process.cwd(), 'src', match[1]);
        }
      }
    }

    // Try to extract from error message
    const fileMatch = error.text.match(/(\w+\.(jsx?|tsx?))/);
    if (fileMatch) {
      // Search for file
      const fileName = fileMatch[1];
      return await this.findFileByName(fileName);
    }

    return null;
  }

  // Find file by name in project
  async findFileByName(fileName) {
    const srcDir = path.join(process.cwd(), 'src');

    async function searchDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const result = await searchDir(fullPath);
          if (result) return result;
        } else if (entry.name === fileName) {
          return fullPath;
        }
      }

      return null;
    }

    return await searchDir(srcDir);
  }

  // Fix methods
  async addNullCheck(file, property) {
    if (!file) return false;

    try {
      const content = await fs.readFile(file, 'utf-8');

      // Find usage of the property
      const regex = new RegExp(`(\\w+)\\.${property}`, 'g');
      const newContent = content.replace(regex, (match, obj) => {
        return `${obj}?.${property}`;
      });

      await fs.writeFile(file, newContent);
      console.log(chalk.green(`Added null checks for ${property} in ${file}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Failed to add null check: ${error.message}`));
      return false;
    }
  }

  async addMissingImport(file, variable) {
    if (!file) return false;

    // Common imports map
    const commonImports = {
      'useState': "import { useState } from 'react';",
      'useEffect': "import { useEffect } from 'react';",
      'useContext': "import { useContext } from 'react';",
      'Link': "import Link from 'next/link';",
      'Image': "import Image from 'next/image';",
      'useRouter': "import { useRouter } from 'next/navigation';",
    };

    if (commonImports[variable]) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Check if import already exists
        if (!content.includes(commonImports[variable])) {
          // Add import at the top
          const newContent = commonImports[variable] + '\n' + content;
          await fs.writeFile(file, newContent);
          console.log(chalk.green(`Added import for ${variable}`));
        }

        return true;
      } catch (error) {
        console.error(chalk.red(`Failed to add import: ${error.message}`));
      }
    }

    return false;
  }

  async installPackage(packageName) {
    return new Promise((resolve) => {
      console.log(chalk.yellow(`Installing ${packageName}...`));

      exec(`npm install ${packageName}`, (error, stdout, stderr) => {
        if (error) {
          console.error(chalk.red(`Failed to install: ${error.message}`));
          resolve(false);
        } else {
          console.log(chalk.green(`✓ Installed ${packageName}`));
          resolve(true);
        }
      });
    });
  }

  async fixTypeMismatch(file, expected, got) {
    // This would require more complex AST manipulation
    console.log(chalk.yellow(`Type mismatch requires manual intervention`));
    return false;
  }

  async fixHydrationError(file) {
    if (!file) return false;

    try {
      const content = await fs.readFile(file, 'utf-8');

      // Add suppressHydrationWarning to problematic elements
      const newContent = content.replace(
        /<div([^>]*)>/g,
        (match, attrs) => {
          if (!attrs.includes('suppressHydrationWarning')) {
            return `<div${attrs} suppressHydrationWarning>`;
          }
          return match;
        }
      );

      await fs.writeFile(file, newContent);
      console.log(chalk.green('Added hydration suppression'));
      return true;
    } catch (error) {
      console.error(chalk.red(`Failed to fix hydration: ${error.message}`));
      return false;
    }
  }

  async addReactImport(file, hook) {
    if (!file) return false;

    try {
      const content = await fs.readFile(file, 'utf-8');

      // Check if React is already imported
      if (content.includes(`import React`)) {
        // Add to existing import
        const newContent = content.replace(
          /import React(, \{[^}]*\})? from 'react';/,
          (match, imports) => {
            if (imports && !imports.includes(hook)) {
              return match.replace('}', `, ${hook}}`);
            } else if (!imports) {
              return `import React, { ${hook} } from 'react';`;
            }
            return match;
          }
        );
        await fs.writeFile(file, newContent);
      } else {
        // Add new import
        const newContent = `import { ${hook} } from 'react';\n` + content;
        await fs.writeFile(file, newContent);
      }

      console.log(chalk.green(`Added ${hook} import`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Failed to add React import: ${error.message}`));
      return false;
    }
  }

  // AI-powered fix using Claude
  async aiPoweredFix(error) {
    console.log(chalk.cyan('Analyzing error with AI...'));

    // Create a prompt for Claude
    const prompt = `
Error in React/Next.js application:
${error.text}

Stack trace: ${error.stack ? JSON.stringify(error.stack) : 'Not available'}
URL: ${error.url}

Please provide a fix for this error.
    `;

    // This would integrate with Claude API
    // For now, log the error for manual review
    console.log(chalk.yellow('AI fix not implemented yet. Error logged for manual review.'));

    // Save error to file for review
    const errorLog = {
      error: error.text,
      stack: error.stack,
      url: error.url,
      timestamp: error.timestamp
    };

    await fs.appendFile(
      'error-log.json',
      JSON.stringify(errorLog, null, 2) + ',\n'
    );

    return false;
  }

  // Start monitoring
  async start() {
    const connected = await this.connect();
    if (!connected) return;

    console.log(chalk.cyan('\n🤖 Auto-Fixer Active\n'));
    console.log(chalk.gray('Monitoring for errors and applying automatic fixes...'));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    // Show fix statistics periodically
    setInterval(() => {
      if (this.fixHistory.length > 0) {
        console.log(chalk.cyan('\n📊 Fix Statistics:'));
        console.log(chalk.gray(`Total fixes applied: ${this.fixHistory.length}`));

        const successCount = this.fixHistory.filter(f => f.success).length;
        console.log(chalk.green(`Successful: ${successCount}`));
        console.log(chalk.red(`Failed: ${this.fixHistory.length - successCount}\n`));
      }
    }, 60000); // Every minute

    // Keep running
    await new Promise(() => {});
  }
}

// Run if executed directly
if (require.main === module) {
  const fixer = new AutoFixer();
  fixer.start();
}

module.exports = AutoFixer;