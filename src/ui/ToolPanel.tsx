import React from 'react';
import { Box, Text, useInput } from 'ink';
import { TOOL_REGISTRY, TOOL_CATEGORIES, ToolName } from '../tools/registry';

interface ToolPanelProps {
  onSelectTool: (tool: string | null) => void;
  activeTool: string | null;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({ onSelectTool, activeTool }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedTool, setSelectedTool] = React.useState<number>(0);
  
  const categories = Object.entries(TOOL_CATEGORIES);
  
  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedTool(Math.max(0, selectedTool - 1));
    }
    if (key.downArrow) {
      const tools = selectedCategory ? TOOL_CATEGORIES[selectedCategory as keyof typeof TOOL_CATEGORIES] : [];
      setSelectedTool(Math.min(tools.length - 1, selectedTool + 1));
    }
    if (key.return) {
      if (selectedCategory) {
        const tools = TOOL_CATEGORIES[selectedCategory as keyof typeof TOOL_CATEGORIES];
        onSelectTool(tools[selectedTool]);
      }
    }
    if (key.escape) {
      onSelectTool(null);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold underline>Tools</Text>
      <Box marginY={1} flexDirection="column">
        {categories.map(([category, tools]) => (
          <Box key={category} flexDirection="column" marginY={1}>
            <Text bold color="cyan">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            {tools.map((toolName, i) => {
              const tool = TOOL_REGISTRY[toolName as ToolName];
              const isSelected = selectedCategory === category && selectedTool === i;
              return (
                <Box key={toolName} marginLeft={1}>
                  <Text color={isSelected ? 'yellow' : 'white'}>
                    {isSelected ? '> ' : '  '}
                    {toolName}
                  </Text>
                  {tool.availability === 'conditional' && (
                    <Text dimColor> *</Text>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>* = conditional</Text>
      </Box>
    </Box>
  );
};
