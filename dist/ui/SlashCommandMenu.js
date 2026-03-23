// @ts-nocheck
/**
 * Slash Command System with Dropdown Menu
 * Quick access to all features via /commands
 */
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
const SLASH_COMMANDS = [
    // Business Agents
    { id: 'ar-recovery', name: '/ar-recovery', description: 'Run AR Recovery Agent', category: 'agent', shortcut: 'Ctrl+R', action: () => { } },
    { id: 'chargeback', name: '/chargeback', description: 'Run Chargeback Dispute Agent', category: 'agent', action: () => { } },
    { id: 'dunning', name: '/dunning', description: 'Run Subscription Dunning Agent', category: 'agent', action: () => { } },
    { id: 'invoice-audit', name: '/invoice-audit', description: 'Run Invoice Audit Agent', category: 'agent', action: () => { } },
    { id: 'lead-reactivate', name: '/lead-reactivate', description: 'Run Lead Reactivation Agent', category: 'agent', action: () => { } },
    // Tools
    { id: 'web-search', name: '/search', description: 'Search the web', category: 'tool', shortcut: 'Ctrl+S', action: () => { } },
    { id: 'file-read', name: '/read', description: 'Read a file', category: 'tool', action: () => { } },
    { id: 'file-write', name: '/write', description: 'Write to a file', category: 'tool', action: () => { } },
    { id: 'execute', name: '/exec', description: 'Execute shell command', category: 'tool', shortcut: 'Ctrl+E', action: () => { } },
    { id: 'git', name: '/git', description: 'Git operations', category: 'tool', action: () => { } },
    { id: 'swarm', name: '/swarm', description: 'Activate Agent Swarm', category: 'tool', action: () => { } },
    { id: 'local-llm', name: '/local-llm', description: 'Start local LLM server', category: 'tool', action: () => { } },
    // Config
    { id: 'settings', name: '/settings', description: 'Open settings', category: 'config', shortcut: 'Ctrl+,', action: () => { } },
    { id: 'models', name: '/models', description: 'Switch AI model', category: 'config', action: () => { } },
    { id: 'clear', name: '/clear', description: 'Clear conversation', category: 'config', shortcut: 'Ctrl+L', action: () => { } },
    { id: 'export', name: '/export', description: 'Export conversation', category: 'config', action: () => { } },
    // Help
    { id: 'help', name: '/help', description: 'Show help', category: 'help', shortcut: 'Ctrl+?', action: () => { } },
    { id: 'commands', name: '/commands', description: 'List all commands', category: 'help', action: () => { } },
    { id: 'about', name: '/about', description: 'About ClawTerm', category: 'help', action: () => { } },
    { id: 'version', name: '/version', description: 'Show version', category: 'help', action: () => { } },
];
export const SlashCommandMenu = ({ query, onSelect, onCancel, visible, }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);
    useEffect(() => {
        if (!query) {
            setFilteredCommands(SLASH_COMMANDS);
            return;
        }
        // Simple filter - no external dependency
        const filtered = SLASH_COMMANDS.filter(cmd => cmd.name.toLowerCase().includes(query.toLowerCase()) ||
            cmd.description.toLowerCase().includes(query.toLowerCase()));
        setFilteredCommands(filtered);
        setSelectedIndex(0);
    }, [query]);
    useInput((input, key) => {
        if (!visible)
            return;
        if (key.escape) {
            onCancel();
            return;
        }
        if (key.return && filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
            return;
        }
        if (key.upArrow) {
            setSelectedIndex(Math.max(0, selectedIndex - 1));
        }
        if (key.downArrow) {
            setSelectedIndex(Math.min(filteredCommands.length - 1, selectedIndex + 1));
        }
    });
    if (!visible || filteredCommands.length === 0) {
        return null;
    }
    const categoryColors = {
        agent: 'green',
        tool: 'blue',
        config: 'yellow',
        help: 'gray',
    };
    return (React.createElement(Box, { flexDirection: "column", borderStyle: "single", borderColor: "cyan", padding: 1, marginTop: 1 },
        React.createElement(Text, { bold: true, color: "cyan" }, "Commands"),
        React.createElement(Box, { marginY: 1 }, filteredCommands.slice(0, 8).map((cmd, index) => (React.createElement(Box, { key: cmd.id },
            React.createElement(Text, { color: index === selectedIndex ? 'cyan' : 'white' },
                index === selectedIndex ? '› ' : '  ',
                React.createElement(Text, { bold: true, color: categoryColors[cmd.category] }, cmd.name),
                React.createElement(Text, { color: "gray" },
                    " - ",
                    cmd.description),
                cmd.shortcut && (React.createElement(Text, { color: "yellow" },
                    " [",
                    cmd.shortcut,
                    "]"))))))),
        React.createElement(Text, { color: "gray" }, "\u2191\u2193 to navigate \u2022 Enter to select \u2022 ESC to cancel")));
};
// Hook to detect slash commands
export const useSlashCommand = (input) => {
    const [state, setState] = useState({
        isSlashCommand: false,
        query: '',
        showMenu: false,
    });
    useEffect(() => {
        if (input.startsWith('/')) {
            setState({
                isSlashCommand: true,
                query: input,
                showMenu: true,
            });
        }
        else {
            setState({
                isSlashCommand: false,
                query: '',
                showMenu: false,
            });
        }
    }, [input]);
    return state;
};
export default SlashCommandMenu;
