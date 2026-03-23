/**
 * Tool Panel - Shows available tools
 */
import React from 'react';
import { Box, Text } from 'ink';
const defaultTools = [
    { name: 'read', description: 'Read file', available: true },
    { name: 'write', description: 'Write file', available: true },
    { name: 'exec', description: 'Execute command', available: true },
    { name: 'web_search', description: 'Web search', available: true },
    { name: 'browser', description: 'Control browser', available: true },
    { name: 'memory', description: 'Memory search', available: true },
];
export const ToolPanel = ({ tools = defaultTools }) => {
    return (React.createElement(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", padding: 1 },
        React.createElement(Text, { bold: true, color: "cyan" }, "Available Tools"),
        tools.map(tool => (React.createElement(Text, { key: tool.name, color: tool.available ? 'green' : 'red' },
            tool.available ? '✓' : '✗',
            " ",
            tool.name,
            " - ",
            tool.description)))));
};
export default ToolPanel;
