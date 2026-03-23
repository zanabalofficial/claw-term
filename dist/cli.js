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
    // Non-interactive mode - show welcome message
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
    // Try to start anyway - may work in some environments
    try {
        const { waitUntilExit } = render(React.createElement(App));
        waitUntilExit().then(() => {
            console.log('ClawTerm exited');
        }).catch(() => {
            // Silent fail for non-TTY
        });
    }
    catch (e) {
        // Silent fail
    }
}
else {
    // Interactive TTY mode
    const { waitUntilExit } = render(React.createElement(App));
    waitUntilExit().then(() => {
        console.log('ClawTerm exited');
    });
}
