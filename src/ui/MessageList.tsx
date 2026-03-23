/**
 * Message List - Simplified
 */

import React from 'react';
import { Box, Text } from 'ink';

interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
	timestamp: Date;
}

interface Props {
	messages: Message[];
}

export const MessageList: React.FC<Props> = ({ messages }) => {
	return (
		<Box flexDirection="column">
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
		</Box>
	);
};

export default MessageList;