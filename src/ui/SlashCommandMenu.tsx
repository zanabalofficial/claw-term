// @ts-nocheck
/**
 * Slash Command System with Dropdown Menu
 * Quick access to all features via /commands
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  category: 'agent' | 'tool' | 'config' | 'help';
  shortcut?: string;
  action: () => void;
}

const SLASH_COMMANDS: SlashCommand[] = [
  // Business Agents
  { id: 'ar-recovery', name: '/ar-recovery', description: 'Run AR Recovery Agent', category: 'agent', shortcut: 'Ctrl+R', action: () => {} },
  { id: 'chargeback', name: '/chargeback', description: 'Run Chargeback Dispute Agent', category: 'agent', action: () => {} },
  { id: 'dunning', name: '/dunning', description: 'Run Subscription Dunning Agent', category: 'agent', action: () => {} },
  { id: 'invoice-audit', name: '/invoice-audit', description: 'Run Invoice Audit Agent', category: 'agent', action: () => {} },
  { id: 'lead-reactivate', name: '/lead-reactivate', description: 'Run Lead Reactivation Agent', category: 'agent', action: () => {} },
  
  // Tools
  { id: 'web-search', name: '/search', description: 'Search the web', category: 'tool', shortcut: 'Ctrl+S', action: () => {} },
  { id: 'file-read', name: '/read', description: 'Read a file', category: 'tool', action: () => {} },
  { id: 'file-write', name: '/write', description: 'Write to a file', category: 'tool', action: () => {} },
  { id: 'execute', name: '/exec', description: 'Execute shell command', category: 'tool', shortcut: 'Ctrl+E', action: () => {} },
  { id: 'git', name: '/git', description: 'Git operations', category: 'tool', action: () => {} },
  { id: 'swarm', name: '/swarm', description: 'Activate Agent Swarm', category: 'tool', action: () => {} },
  { id: 'local-llm', name: '/local-llm', description: 'Start local LLM server', category: 'tool', action: () => {} },
  
  // Config
  { id: 'settings', name: '/settings', description: 'Open settings', category: 'config', shortcut: 'Ctrl+,', action: () => {} },
  { id: 'models', name: '/models', description: 'Switch AI model', category: 'config', action: () => {} },
  { id: 'clear', name: '/clear', description: 'Clear conversation', category: 'config', shortcut: 'Ctrl+L', action: () => {} },
  { id: 'export', name: '/export', description: 'Export conversation', category: 'config', action: () => {} },
  
  // Help
  { id: 'help', name: '/help', description: 'Show help', category: 'help', shortcut: 'Ctrl+?', action: () => {} },
  { id: 'commands', name: '/commands', description: 'List all commands', category: 'help', action: () => {} },
  { id: 'about', name: '/about', description: 'About ClawTerm', category: 'help', action: () => {} },
  { id: 'version', name: '/version', description: 'Show version', category: 'help', action: () => {} },
];

interface SlashCommandMenuProps {
  query: string;
  onSelect: (command: SlashCommand) => void;
  onCancel: () => void;
  visible: boolean;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  query,
  onSelect,
  onCancel,
  visible,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);

  useEffect(() => {
    if (!query) {
      setFilteredCommands(SLASH_COMMANDS);
      return;
    }

    // Simple filter - no external dependency
    const filtered = SLASH_COMMANDS.filter(cmd => 
      cmd.name.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [query]);

  useInput((input, key) => {
    if (!visible) return;

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

  const categoryColors: Record<string, string> = {
    agent: 'green',
    tool: 'blue',
    config: 'yellow',
    help: 'gray',
  };

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" padding={1} marginTop={1}>
      <Text bold color="cyan">Commands</Text>
      <Box marginY={1}>
        {filteredCommands.slice(0, 8).map((cmd, index) => (
          <Box key={cmd.id}>
            <Text color={index === selectedIndex ? 'cyan' : 'white'}>
              {index === selectedIndex ? '› ' : '  '}
              <Text bold color={categoryColors[cmd.category] as any}>{cmd.name}</Text>
              <Text color="gray"> - {cmd.description}</Text>
              {cmd.shortcut && (
                <Text color="yellow"> [{cmd.shortcut}]</Text>
              )}
            </Text>
          </Box>
        ))}
      </Box>
      <Text color="gray">↑↓ to navigate • Enter to select • ESC to cancel</Text>
    </Box>
  );
};

// Hook to detect slash commands
export const useSlashCommand = (
  input: string
): { isSlashCommand: boolean; query: string; showMenu: boolean } => {
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
    } else {
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