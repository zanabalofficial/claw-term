#!/usr/bin/env bun
/**
 * ClawTerm - Terminal AI Agent
 * Main CLI entry point
 */

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CLIOptions {
  config?: string;
  workspace?: string;
  debug?: boolean;
  provider?: string;
  model?: string;
  noTools?: boolean;
}

const program = new Command();

program
  .name('claw')
  .description('Terminal AI agent with full tool parity')
  .version('1.0.0');

program
  .option('-c, --config <path>', 'Config file path')
  .option('-w, --workspace <path>', 'Workspace directory', process.cwd())
  .option('-d, --debug', 'Enable debug mode', false)
  .option('-p, --provider <name>', 'AI provider (openai|anthropic|local)', 'openai')
  .option('-m, --model <name>', 'Model name', 'gpt-4')
  .option('--no-tools', 'Disable tool calling')
  .argument('[message]', 'Initial message to send')
  .action(async (message: string | undefined, options: CLIOptions) => {
    // Load and validate config
    const configPath = options.config || join(process.cwd(), '.clawrc.yaml');
    
    // Dynamic import to avoid bundling issues
    const { default: App } = await import('./ui/App.js');
    const { ConfigManager } = await import('./core/ConfigManager.js');
    const { SessionManager } = await import('./core/SessionManager.js');
    
    // Initialize configuration
    const config = await ConfigManager.load(configPath, {
      workspace: options.workspace,
      debug: options.debug,
      provider: options.provider,
      model: options.model,
      toolsEnabled: !options.noTools,
    });
    
    // Initialize or resume session
    const session = await SessionManager.initialize(config);
    
    // If message provided, queue it
    if (message) {
      session.queueMessage(message);
    }
    
    // Start TUI
    const { render } = await import('ink');
    const app = render(App({ session, config }));
    
    // Handle exit
    process.on('SIGINT', () => {
      app.unmount();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      app.unmount();
      process.exit(0);
    });
  });

program
  .command('config')
  .description('Configure ClawTerm settings')
  .option('--init', 'Initialize config file')
  .option('--show', 'Show current config')
  .action(async (options) => {
    const { ConfigManager } = await import('./core/ConfigManager.js');
    
    if (options.init) {
      await ConfigManager.initDefault(join(process.cwd(), '.clawrc.yaml'));
      console.log('✓ Config created at .clawrc.yaml');
    } else if (options.show) {
      const config = await ConfigManager.load();
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log('Use --init to create config or --show to view');
    }
  });

program
  .command('history')
  .description('View conversation history')
  .option('-n, --limit <number>', 'Number of entries', '20')
  .option('--clear', 'Clear history')
  .action(async (options) => {
    const { HistoryManager } = await import('./core/HistoryManager.js');
    
    if (options.clear) {
      await HistoryManager.clear();
      console.log('✓ History cleared');
    } else {
      const entries = await HistoryManager.list(parseInt(options.limit));
      entries.forEach((entry, i) => {
        console.log(`${i + 1}. ${entry.timestamp} - ${entry.preview}`);
      });
    }
  });

// Run CLI
program.parse();
