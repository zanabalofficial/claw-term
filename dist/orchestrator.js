// @ts-nocheck
/**
 * Orchestrator Entry Point
 * Simplified version for CLI
 */
console.log('ClawTerm Orchestrator starting...');
// Parse args
const args = process.argv.slice(2);
// If no args, just show version
if (args.length === 0 || args[0] === '--version') {
    console.log('ClawTerm v2.0.0');
    console.log('Run "claw" to start the terminal');
    process.exit(0);
}
// Otherwise just start the CLI
console.log('Starting ClawTerm CLI...');
