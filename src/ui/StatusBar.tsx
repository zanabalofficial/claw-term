/**
 * Status Bar - Simplified
 */

import React from 'react';
import { Box, Text } from 'ink';

interface Props {
	provider?: string;
	model?: string;
	messageCount?: number;
}

export const StatusBar: React.FC<Props> = ({ provider = 'openai', model = 'gpt-4', messageCount = 0 }) => {
	return (
		<Box paddingX={2} paddingY={1}>
			<Text color="gray">Commands: /help /clear /settings</Text>
			<Text color="gray"> | </Text>
			<Text color="gray">{provider}/{model}</Text>
			<Text color="gray"> | </Text>
			<Text color="gray">{messageCount} msgs</Text>
		</Box>
	);
};

export default StatusBar;