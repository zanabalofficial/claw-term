/**
 * Tool Panel - Shows available tools
 */

import React from 'react';
import { Box, Text } from 'ink';

interface Tool {
	name: string;
	description: string;
	available: boolean;
}

interface Props {
	tools?: Tool[];
}

const defaultTools: Tool[] = [
	{ name: 'read', description: 'Read file', available: true },
	{ name: 'write', description: 'Write file', available: true },
	{ name: 'exec', description: 'Execute command', available: true },
	{ name: 'web_search', description: 'Web search', available: true },
	{ name: 'browser', description: 'Control browser', available: true },
	{ name: 'memory', description: 'Memory search', available: true },
];

export const ToolPanel: React.FC<Props> = ({ tools = defaultTools }) => {
	return (
		<Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
			<Text bold color="cyan">Available Tools</Text>
			{tools.map(tool => (
				<Text key={tool.name} color={tool.available ? 'green' : 'red'}>
					{tool.available ? '✓' : '✗'} {tool.name} - {tool.description}
				</Text>
			))}
		</Box>
	);
};

export default ToolPanel;