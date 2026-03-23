/**
 * Status Bar - Simplified
 */
import React from 'react';
import { Box, Text } from 'ink';
export const StatusBar = ({ provider = 'openai', model = 'gpt-4', messageCount = 0 }) => {
    return (React.createElement(Box, { paddingX: 2, paddingY: 1 },
        React.createElement(Text, { color: "gray" }, "Commands: /help /clear /settings"),
        React.createElement(Text, { color: "gray" }, " | "),
        React.createElement(Text, { color: "gray" },
            provider,
            "/",
            model),
        React.createElement(Text, { color: "gray" }, " | "),
        React.createElement(Text, { color: "gray" },
            messageCount,
            " msgs")));
};
export default StatusBar;
