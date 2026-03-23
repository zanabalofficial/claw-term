// @ts-nocheck
/**
 * ClawTerm - Terminal AI Agent
 * Main CLI entry point
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp, Newline } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { EventEmitter } from 'events';

// Types
interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
	timestamp: Date;
}

interface Config {
	provider: string;
	model: string;
	apiKey: string;
}

// Streaming response hook
const useStreamingResponse = () => {
	const [response, setResponse] = useState('');
	const [isStreaming, setIsStreaming] = useState(false);

	const streamResponse = useCallback(async (prompt: string) => {
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
const Onboarding = ({ onComplete }: { onComplete: (config: Config) => void }) => {
	const [step, setStep] = useState(0);
	const [input, setInput] = useState('');
	const [config, setConfig] = useState<Config>({ provider: 'openai', model: 'gpt-4', apiKey: '' });
	
	const steps = [
		{ title: 'Welcome to ClawTerm!', desc: 'Your AI-powered terminal assistant' },
		{ title: 'Choose Provider', desc: 'Select AI provider (↑↓ to navigate, Enter to select)' },
		{ title: 'Enter API Key', desc: 'Your key is stored securely' },
	];

	useInput((input, key) => {
		if (step === 0) {
			setStep(1);
		} else if (step === 1) {
			if (key.upArrow) setConfig(c => ({ ...c, provider: c.provider === 'openai' ? 'local' : 'openai' }));
			if (key.downArrow) setConfig(c => ({ ...c, provider: c.provider === 'openai' ? 'local' : 'openai' }));
			if (key.return) setStep(2);
		} else if (step === 2) {
			if (key.return && input) {
				setConfig(c => ({ ...c, apiKey: input }));
				onComplete(config);
			}
		}
	});

	return (
		<Box flexDirection="column" padding={2}>
			<Text bold color="cyan">{steps[step].title}</Text>
			<Text color="gray">{steps[step].desc}</Text>
			{step === 1 && (
				<Box marginTop={1}>
					<Text color={config.provider === 'openai' ? 'green' : 'gray'}>
						{config.provider === 'openai' ? '► ' : '  '}OpenAI GPT-4
					</Text>
					{config.provider === 'local' && <Text>  (select)</Text>}
				</Box>
			)}
			{step === 2 && (
				<Box marginTop={1}>
					<Text color="yellow">API Key: </Text>
					<TextInput value={input} onChange={setInput} mask="*" />
				</Box>
			)}
			<Text color="gray" dimColor>Press Enter to continue...</Text>
		</Box>
	);
};

// Slash Command Menu
interface Command {
	name: string;
	desc: string;
	action: () => void;
}

const commands: Command[] = [
	{ name: '/ar-recovery', desc: 'Run AR Recovery Agent', action: () => {} },
	{ name: '/search', desc: 'Search the web', action: () => {} },
	{ name: '/read', desc: 'Read a file', action: () => {} },
	{ name: '/write', desc: 'Write to a file', action: () => {} },
	{ name: '/exec', desc: 'Execute command', action: () => {} },
	{ name: '/clear', desc: 'Clear conversation', action: () => {} },
	{ name: '/help', desc: 'Show all commands', action: () => {} },
	{ name: '/settings', desc: 'Open settings', action: () => {} },
];

const SlashMenu = ({ visible, onSelect }: { visible: boolean; onSelect: (cmd: Command) => void }) => {
	const [selected, setSelected] = useState(0);
	
	useInput((input, key) => {
		if (!visible) return;
		if (key.upArrow) setSelected(s => Math.max(0, s - 1));
		if (key.downArrow) setSelected(s => Math.min(commands.length - 1, s + 1));
		if (key.return) onSelect(commands[selected]);
	});

	if (!visible) return null;

	return (
		<Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1} marginY={1}>
			<Text bold color="cyan">Commands</Text>
			{commands.map((cmd, i) => (
				<Text key={cmd.name} color={i === selected ? 'green' : 'white'}>
					{i === selected ? '► ' : '  '}{cmd.name} - {cmd.desc}
				</Text>
			))
			}
			<Text color="gray" dimColor>↑↓ navigate • Enter select • Esc close</Text>
		</Box>
	);
};

// Tool Usage Display
const ToolUI = ({ toolName, status }: { toolName: string; status: 'running' | 'success' | 'error' }) => {
	const colors = { running: 'yellow', success: 'green', error: 'red' };
	const icons = { running: '⚙', success: '✓', error: '✗' };
	
	return (
		<Box>
			<Text color={colors[status]}>{icons[status]}</Text>
			<Text color="gray"> Using tool: </Text>
			<Text color="cyan">{toolName}</Text>
			{status === 'running' && <Spinner type="dots" />}
		</Box>
	);
};

// Main App Component
const App = () => {
	const [input, setInput] = useState('');
	const [messages, setMessages] = useState<Message[]>([]);
	const [showOnboarding, setShowOnboarding] = useState(true);
	const [config, setConfig] = useState<Config>({ provider: 'openai', model: 'gpt-4', apiKey: '' });
	const [showSlashMenu, setShowSlashMenu] = useState(false);
	const [selectedTool, setSelectedTool] = useState<string | null>(null);
	const [toolStatus, setToolStatus] = useState<'running' | 'success' | 'error' | null>(null);
	const { exit } = useApp();
	
	const { response, isStreaming, streamResponse } = useStreamingResponse();

	// Handle slash commands
	useEffect(() => {
		if (input.startsWith('/')) {
			setShowSlashMenu(true);
		} else {
			setShowSlashMenu(false);
		}
	}, [input]);

	const handleSubmit = async () => {
		if (!input.trim()) return;

		// Add user message
		const userMsg: Message = {
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
		const asstMsg: Message = {
			id: Date.now().toString(),
			role: 'assistant',
			content: response,
			timestamp: new Date(),
		};
		setMessages(prev => [...prev, asstMsg]);
	};

	const handleOnboardingComplete = (cfg: Config) => {
		setConfig(cfg);
		setShowOnboarding(false);
	};

	if (showOnboarding) {
		return <Onboarding onComplete={handleOnboardingComplete} />;
	}

	return (
		<Box flexDirection="column" height="100%">
			{/* Header */}
			<Box borderStyle="bold" borderColor="cyan" padding={1}>
				<Text bold color="cyan">🦀 ClawTerm v2.0</Text>
				<Text color="gray"> | {config.provider} | {config.model}</Text>
			</Box>

			{/* Messages */}
			<Box flexDirection="column" flexGrow={1}>
				{messages.map(msg => (
					<Box key={msg.id} paddingX={2} paddingY={1}>
						<Text color={msg.role === 'user' ? 'green' : 'white'}>
							<Text bold color={msg.role === 'user' ? 'green' : 'cyan'}>
								{msg.role === 'user' ? '❯ ' : '▸ '}
							</Text>
							{msg.content}
						</Text>
					</Box>
				))}
				{isStreaming && (
					<Box paddingX={2}>
						<Text color="yellow"><Spinner type="dots" /></Text>
						<Text color="gray"> {response}_</Text>
					</Box>
				)}
			</Box>

			{/* Slash Command Menu */}
			<SlashMenu visible={showSlashMenu} onSelect={(cmd) => {
				setInput(cmd.name + ' ');
				setShowSlashMenu(false);
			}} />

			{/* Tool Usage Display */}
			{toolStatus && selectedTool && (
				<ToolUI toolName={selectedTool} status={toolStatus} />
			)}

			{/* Input Area */}
			<Box borderStyle="round" borderColor="gray" padding={1} marginY={1}>
				<Text color="green">❯ </Text>
				<TextInput
					value={input}
					onChange={setInput}
					onSubmit={handleSubmit}
					placeholder="Type message or / for commands..."
				/>
			</Box>

			{/* Status Bar */}
			<Box borderStyle="single" paddingX={2}>
				<Text color="gray">Commands: /help /clear /settings</Text>
				<Text color="gray"> | </Text>
				<Text color="gray">{messages.length} messages</Text>
			</Box>
		</Box>
	);
};

export default App;