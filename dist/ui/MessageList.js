/**
 * Message List - Simplified
 */
import React from 'react';
import { Box, Text } from 'ink';
export const MessageList = ({ messages }) => {
    return (React.createElement(Box, { flexDirection: "column" }, messages.map(msg => (React.createElement(Box, { key: msg.id, paddingX: 2, paddingY: 1 },
        React.createElement(Text, { color: msg.role === 'user' ? 'green' : 'white' },
            React.createElement(Text, { bold: true, color: msg.role === 'user' ? 'green' : 'cyan' }, msg.role === 'user' ? '❯ ' : '▸ '),
            msg.content))))));
};
export default MessageList;
