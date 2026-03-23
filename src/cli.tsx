// @ts-nocheck
/**
 * ClawTerm CLI Entry Point
 * Runs the Ink.js terminal UI
 */

import React from 'react';
import { render } from 'ink';
import App from './ui/App.js';

// Check if we're in a TTY
const isTTY = process.stdin.isTTY;

if (!isTTY) {
  // Non-interactive mode - show welcome message and exit
  console.log(`
╔═══════════════════════════════════════════════════╗
║                  ClawTerm v2.0                     ║
║           Terminal AI Agent (Ink.js)              ║
╠═══════════════════════════════════════════════════╣
║  Running in non-interactive mode                  ║
║                                                   ║
║  To use the full UI:                              ║
║    • Run in a real terminal/TTY                   ║
║    • Use: bun run dev                             ║
║    • Or: ./dist/cli.js                            ║
║                                                   ║
║  Available commands:                              ║
║    claw --help                                    ║
║    claw --version                                 ║
║    claw --interactive                             ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
  process.exit(0);
}

// Interactive TTY mode
const { waitUntilExit } = render(React.createElement(App));
waitUntilExit().then(() => {
  console.log('ClawTerm exited');
});