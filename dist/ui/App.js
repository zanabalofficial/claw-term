// @ts-nocheck
/**
 * ClawTerm - Terminal AI Agent
 * Main CLI entry point
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
// Streaming response hook
const useStreamingResponse = () => {
    const [response, setResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const streamResponse = useCallback(async (prompt) => {
        setIsStreaming(true);
        setResponse('');
        // Simulate streaming response
        const words = ['Hello', 'I am', 'ClawTerm', 'your', 'AI', 'assistant', 'in', 'the', 'terminal.'];
        for (const word of words) {
            await new Promise(r => setTimeout(r, 100));
            setResponse(prev => prev + (prev ? ' ' : '') + word);
        }
        setIsStreaming(false);
    }, []);
    return { response, isStreaming, streamResponse };
};
// Interactive Onboarding Component
const Onboarding = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [input, setInput] = useState('');
    const [config, setConfig] = useState({ provider: 'openai', model: 'gpt-4', apiKey: '' });
    const steps = [
        { title: 'Welcome to ClawTerm!', desc: 'Your AI-powered terminal assistant' },
        { title: 'Choose Provider', desc: 'Select AI provider (↑↓ to navigate, Enter to select)' },
        { title: 'Enter API Key', desc: 'Your key is stored securely' },
    ];
    useInput((input, key) => {
        if (step === 0) {
            setStep(1);
        }
        else if (step === 1) {
            if (key.upArrow)
                setConfig(c => ({ ...c, provider: c.provider === 'openai' ? 'local' : 'openai' }));
            if (key.downArrow)
                setConfig(c => ({ ...c, provider: c.provider === 'openai' ? 'local' : 'openai' }));
            if (key.return)
                setStep(2);
        }
        else if (step === 2) {
            if (key.return && input) {
                setConfig(c => ({ ...c, apiKey: input }));
                onComplete(config);
            }
        }
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 2 },
        React.createElement(Text, { bold: true, color: "cyan" }, steps[step].title),
        React.createElement(Text, { color: "gray" }, steps[step].desc),
        step === 1 && (React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: config.provider === 'openai' ? 'green' : 'gray' },
                config.provider === 'openai' ? '► ' : '  ',
                "OpenAI GPT-4"),
            config.provider === 'local' && React.createElement(Text, null, "  (select)"))),
        step === 2 && (React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: "yellow" }, "API Key: "),
            React.createElement(TextInput, { value: input, onChange: setInput, mask: "*" }))),
        React.createElement(Text, { color: "gray", dimColor: true }, "Press Enter to continue...")));
};
const commands = [
    { name: '/ar-recovery', desc: 'Run AR Recovery Agent', action: () => { } },
    { name: '/search', desc: 'Search the web', action: () => { } },
    { name: '/read', desc: 'Read a file', action: () => { } },
    { name: '/write', desc: 'Write to a file', action: () => { } },
    { name: '/exec', desc: 'Execute command', action: () => { } },
    { name: '/clear', desc: 'Clear conversation', action: () => { } },
    { name: '/help', desc: 'Show all commands', action: () => { } },
    { name: '/settings', desc: 'Open settings', action: () => { } },
];
const SlashMenu = ({ visible, onSelect }) => {
    const [selected, setSelected] = useState(0);
    useInput((input, key) => {
        if (!visible)
            return;
        if (key.upArrow)
            setSelected(s => Math.max(0, s - 1));
        if (key.downArrow)
            setSelected(s => Math.min(commands.length - 1, s + 1));
        if (key.return)
            onSelect(commands[selected]);
    });
    if (!visible)
        return null;
    return (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", padding: 1, marginY: 1 },
        React.createElement(Text, { bold: true, color: "cyan" }, "Commands"),
        commands.map((cmd, i) => (React.createElement(Text, { key: cmd.name, color: i === selected ? 'green' : 'white' },
            i === selected ? '► ' : '  ',
            cmd.name,
            " - ",
            cmd.desc))),
        React.createElement(Text, { color: "gray", dimColor: true }, "\u2191\u2193 navigate \u2022 Enter select \u2022 Esc close")));
};
// Tool Usage Display
const ToolUI = ({ toolName, status }) => {
    const colors = { running: 'yellow', success: 'green', error: 'red' };
    const icons = { running: '⚙', success: '✓', error: '✗' };
    return (React.createElement(Box, null,
        React.createElement(Text, { color: colors[status] }, icons[status]),
        React.createElement(Text, { color: "gray" }, " Using tool: "),
        React.createElement(Text, { color: "cyan" }, toolName),
        status === 'running' && React.createElement(Spinner, { type: "dots" })));
};
// Main App Component
const App = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [config, setConfig] = useState({ provider: 'openai', model: 'gpt-4', apiKey: '' });
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);
    const [toolStatus, setToolStatus] = useState(null);
    const { exit } = useApp();
    const { response, isStreaming, streamResponse } = useStreamingResponse();
    // Handle slash commands
    useEffect(() => {
        if (input.startsWith('/')) {
            setShowSlashMenu(true);
        }
        else {
            setShowSlashMenu(false);
        }
    }, [input]);
    const handleSubmit = async () => {
        if (!input.trim())
            return;
        // Add user message
        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        // Simulate tool usage for certain commands
        if (input.startsWith('/')) {
            setSelectedTool('slash-command');
            setToolStatus('running');
            setTimeout(() => setToolStatus('success'), 500);
        }
        // Get AI response
        setInput('');
        await streamResponse(input);
        // Add assistant response
        const asstMsg = {
            id: Date.now().toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, asstMsg]);
    };
    const handleOnboardingComplete = (cfg) => {
        setConfig(cfg);
        setShowOnboarding(false);
    };
    if (showOnboarding) {
        return React.createElement(Onboarding, { onComplete: handleOnboardingComplete });
    }
    return (React.createElement(Box, { flexDirection: "column", height: "100%" },
        React.createElement(Box, { borderStyle: "bold", borderColor: "cyan", padding: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, "\uD83E\uDD80 ClawTerm v2.0"),
            React.createElement(Text, { color: "gray" },
                " | ",
                config.provider,
                " | ",
                config.model)),
        React.createElement(Box, { flexDirection: "column", flexGrow: 1 },
            messages.map(msg => (React.createElement(Box, { key: msg.id, paddingX: 2, paddingY: 1 },
                React.createElement(Text, { color: msg.role === 'user' ? 'green' : 'white' },
                    React.createElement(Text, { bold: true, color: msg.role === 'user' ? 'green' : 'cyan' }, msg.role === 'user' ? '❯ ' : '▸ '),
                    msg.content)))),
            isStreaming && (React.createElement(Box, { paddingX: 2 },
                React.createElement(Text, { color: "yellow" },
                    React.createElement(Spinner, { type: "dots" })),
                React.createElement(Text, { color: "gray" },
                    " ",
                    response,
                    "_")))),
        React.createElement(SlashMenu, { visible: showSlashMenu, onSelect: (cmd) => {
                setInput(cmd.name + ' ');
                setShowSlashMenu(false);
            } }),
        toolStatus && selectedTool && (React.createElement(ToolUI, { toolName: selectedTool, status: toolStatus })),
        React.createElement(Box, { borderStyle: "round", borderColor: "gray", padding: 1, marginY: 1 },
            React.createElement(Text, { color: "green" }, "\u276F "),
            React.createElement(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit, placeholder: "Type message or / for commands..." })),
        React.createElement(Box, { borderStyle: "single", paddingX: 2 },
            React.createElement(Text, { color: "gray" }, "Commands: /help /clear /settings"),
            React.createElement(Text, { color: "gray" }, " | "),
            React.createElement(Text, { color: "gray" },
                messages.length,
                " messages"))));
};
export default App;
