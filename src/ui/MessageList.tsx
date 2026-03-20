import React, { useRef, useEffect, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import { Message } from '../core/SessionManager';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

// Configure marked for terminal
marked.setOptions({
  renderer: new TerminalRenderer({
    code: (code: string) => `\x1b[36m${code}\x1b[0m`,
    blockquote: (quote: string) => `\x1b[90m${quote}\x1b[0m`,
    heading: (text: string) => `\x1b[1m${text}\x1b[0m`,
    strong: (text: string) => `\x1b[1m${text}\x1b[0m`,
    em: (text: string) => `\x1b[3m${text}\x1b[0m`,
  }),
});

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  maxHeight: number;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isStreaming,
  maxHeight 
}) => {
  const scrollRef = useRef<number>(0);
  const { stdout } = useStdout();
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > maxHeight) {
      scrollRef.current = messages.length - maxHeight;
    }
  }, [messages.length, maxHeight]);

  const visibleMessages = messages.slice(scrollRef.current);

  return (
    <Box 
      flexDirection="column" 
      flexGrow={1}
      overflow="hidden"
      paddingX={1}
    >
      {visibleMessages.map((msg, index) => (
        <MessageItem 
          key={msg.id} 
          message={msg} 
          isLast={index === visibleMessages.length - 1 && isStreaming}
        />
      ))}
      
      {isStreaming && (
        <Box marginY={1}>
          <Text color="yellow">●</Text>
          <Text dimColor> Thinking...</Text>
        </Box>
      )}
    </Box>
  );
};

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLast }) => {
  const renderContent = () => {
    switch (message.role) {
      case 'user':
        return (
          <Box flexDirection="column" marginY={1}>
            <Box>
              <Text bold color="green">You </Text>
              <Text dimColor>{formatTime(message.timestamp)}</Text>
            </Box>
            <Box marginLeft={2}>
              <Text>{message.content}</Text>
            </Box>
          </Box>
        );
        
      case 'assistant':
        return (
          <Box flexDirection="column" marginY={1}>
            <Box>
              <Text bold color="cyan">Assistant </Text>
              <Text dimColor>{formatTime(message.timestamp)}</Text>
            </Box>
            <Box marginLeft={2}>
              <MarkdownContent content={message.content} />
            </Box>
          </Box>
        );
        
      case 'system':
        return (
          <Box marginY={1} paddingX={2} backgroundColor="gray">
            <Text color="black">{message.content}</Text>
          </Box>
        );
        
      case 'tool-call':
        return (
          <Box flexDirection="column" marginY={1} borderStyle="single" borderColor="yellow" paddingX={1}>
            <Box>
              <Text bold color="yellow">🔧 Tool Call: {message.toolName}</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>{JSON.stringify(message.toolInput, null, 2)}</Text>
            </Box>
          </Box>
        );
        
      case 'tool-result':
        return (
          <Box flexDirection="column" marginY={1} borderStyle="single" borderColor="green" paddingX={1}>
            <Box>
              <Text bold color="green">✓ Tool Result: {message.toolName}</Text>
            </Box>
            <Box marginLeft={2}>
              <Text>{formatToolResult(message.content)}</Text>
            </Box>
          </Box>
        );
        
      case 'error':
        return (
          <Box flexDirection="column" marginY={1} borderStyle="single" borderColor="red" paddingX={1}>
            <Box>
              <Text bold color="red">✗ Error</Text>
            </Box>
            <Box marginLeft={2}>
              <Text color="red">{message.content}</Text>
            </Box>
          </Box>
        );
        
      default:
        return (
          <Box marginY={1}>
            <Text>{message.content}</Text>
          </Box>
        );
    }
  };

  return renderContent();
};

// Markdown rendering component
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  try {
    // Simple markdown rendering for terminal
    const lines = content.split('\n');
    
    return (
      <Box flexDirection="column">
        {lines.map((line, i) => {
          // Code blocks
          if (line.startsWith('```')) {
            return (
              <Box key={i} backgroundColor="gray" paddingX={1}>
                <Text color="black">{line}</Text>
              </Box>
            );
          }
          
          // Headers
          if (line.startsWith('# ')) {
            return (
              <Box key={i} marginY={1}>
                <Text bold underline>{line.slice(2)}</Text>
              </Box>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <Box key={i} marginTop={1}>
                <Text bold>{line.slice(3)}</Text>
              </Box>
            );
          }
          
          // Lists
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <Box key={i} marginLeft={2}>
                <Text>• {line.slice(2)}</Text>
              </Box>
            );
          }
          
          // Inline code
          if (line.includes('`')) {
            const parts = line.split(/(`[^`]+`)/);
            return (
              <Box key={i} flexDirection="row" flexWrap="wrap">
                {parts.map((part, j) => {
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return <Text key={j} color="cyan">{part}</Text>;
                  }
                  return <Text key={j}>{part}</Text>;
                })}
              </Box>
            );
          }
          
          // Regular text
          return <Text key={i}>{line || ' '}</Text>;
        })}
      </Box>
    );
  } catch {
    return <Text>{content}</Text>;
  }
};

// Helper functions
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

function formatToolResult(result: any): string {
  if (typeof result === 'string') {
    // Truncate long results
    if (result.length > 500) {
      return result.slice(0, 500) + '\n... (truncated)';
    }
    return result;
  }
  return JSON.stringify(result, null, 2);
}
