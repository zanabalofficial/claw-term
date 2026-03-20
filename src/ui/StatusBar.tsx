import React from 'react';
import { Box, Text } from 'ink';
import { Session } from '../core/SessionManager';
import { Config } from '../core/ConfigManager';

interface StatusBarProps {
  session: Session;
  config: Config;
  isStreaming: boolean;
  toolCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  session,
  config,
  isStreaming,
  toolCount
}) => {
  const messageCount = session.getMessages().length;
  const sessionTime = session.getDuration();
  
  return (
    <Box 
      flexDirection="row" 
      justifyContent="space-between"
      backgroundColor="black"
      paddingX={1}
    >
      {/* Left: Session info */}
      <Box flexDirection="row" gap={2}>
        <Text dimColor>
          Session: <Text color="cyan">{session.id.slice(0, 8)}</Text>
        </Text>
        <Text dimColor>
          Messages: <Text color="green">{messageCount}</Text>
        </Text>
        <Text dimColor>
          Time: <Text color="yellow">{formatDuration(sessionTime)}</Text>
        </Text>
      </Box>

      {/* Center: Status */}
      <Box>
        {isStreaming ? (
          <Text color="yellow">● Streaming</Text>
        ) : (
          <Text color="green">● Ready</Text>
        )}
      </Box>

      {/* Right: Config info */}
      <Box flexDirection="row" gap={2}>
        <Text dimColor>
          Provider: <Text color="magenta">{config.provider}</Text>
        </Text>
        <Text dimColor>
          Model: <Text color="magenta">{config.model}</Text>
        </Text>
        <Text dimColor>
          Tools: <Text color="blue">{toolCount}</Text>
        </Text>
      </Box>
    </Box>
  );
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
