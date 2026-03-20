import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Session } from '../core/SessionManager';
import { Config } from '../core/ConfigManager';
import { MessageList } from './MessageList';
import { InputComposer } from './InputComposer';
import { StatusBar } from './StatusBar';
import { ToolPanel } from './ToolPanel';
import { useStreaming } from '../hooks/useStreaming';
import { useToolExecution } from '../hooks/useToolExecution';

interface AppProps {
  session: Session;
  config: Config;
}

export const App: React.FC<AppProps> = ({ session, config }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState(session.getMessages());
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const { streamResponse, cancelStream } = useStreaming(session, config);
  const { executeTool, isExecuting } = useToolExecution(session);

  // Sync messages with session
  useEffect(() => {
    const unsubscribe = session.onMessagesChange(setMessages);
    return unsubscribe;
  }, [session]);

  // Handle message submission
  const handleSubmit = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;
    
    // Add user message
    session.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    });

    setIsStreaming(true);
    
    try {
      await streamResponse(content, {
        onToken: (token) => {
          session.appendToLastMessage(token);
        },
        onToolCall: (toolCall) => {
          session.addMessage({
            id: crypto.randomUUID(),
            role: 'tool-call',
            toolName: toolCall.name,
            toolInput: toolCall.arguments,
            timestamp: new Date(),
          });
          
          // Execute tool
          executeTool(toolCall.name, toolCall.arguments)
            .then(result => {
              session.addMessage({
                id: crypto.randomUUID(),
                role: 'tool-result',
                toolName: toolCall.name,
                content: result,
                timestamp: new Date(),
              });
            })
            .catch(error => {
              session.addMessage({
                id: crypto.randomUUID(),
                role: 'error',
                content: `Tool error: ${error.message}`,
                timestamp: new Date(),
              });
            });
        },
        onComplete: () => {
          setIsStreaming(false);
        },
        onError: (error) => {
          session.addMessage({
            id: crypto.randomUUID(),
            role: 'error',
            content: error.message,
            timestamp: new Date(),
          });
          setIsStreaming(false);
        },
      });
    } catch (error) {
      setIsStreaming(false);
    }
  }, [session, isStreaming, streamResponse, executeTool]);

  // Keyboard shortcuts
  useInput((input, key) => {
    // Ctrl+C - Cancel/Exit
    if (key.ctrl && input === 'c') {
      if (isStreaming) {
        cancelStream();
        setIsStreaming(false);
      } else {
        exit();
      }
    }
    
    // Ctrl+T - Toggle tool panel
    if (key.ctrl && input === 't') {
      setShowTools(!showTools);
    }
    
    // Ctrl+H - Toggle help
    if (key.ctrl && input === 'h') {
      setShowHelp(!showHelp);
    }
    
    // Ctrl+L - Clear screen
    if (key.ctrl && input === 'l') {
      // Implementation depends on terminal
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box paddingX={1} paddingY={0}>
        <Text bold color="cyan">
          ╔══════════════════════════════════════════════════════════╗
        </Text>
      </Box>
      <Box paddingX={1}>
        <Text bold color="cyan">
          ║{'  '}🐾 ClawTerm v1.0.0 - Terminal AI Agent{'              '}║
        </Text>
      </Box>
      <Box paddingX={1}>
        <Text bold color="cyan">
          ╚══════════════════════════════════════════════════════════╝
        </Text>
      </Box>

      {/* Main content area */}
      <Box flexDirection="row" flexGrow={1}>
        {/* Message viewport */}
        <Box flexGrow={1} flexDirection="column">
          <MessageList 
            messages={messages} 
            isStreaming={isStreaming}
            maxHeight={process.stdout.rows - 8}
          />
        </Box>

        {/* Tool panel (conditional) */}
        {showTools && (
          <Box width={30} flexDirection="column" borderStyle="single" paddingX={1}>
            <ToolPanel 
              onSelectTool={setActiveTool}
              activeTool={activeTool}
            />
          </Box>
        )}
      </Box>

      {/* Help modal (conditional) */}
      {showHelp && (
        <Box 
          position="absolute" 
          top={3} 
          left="10%" 
          width="80%" 
          height="60%"
          borderStyle="double"
          backgroundColor="black"
          padding={1}
        >
          <HelpContent onClose={() => setShowHelp(false)} />
        </Box>
      )}

      {/* Input composer */}
      <Box flexDirection="column">
        <InputComposer 
          onSubmit={handleSubmit}
          disabled={isStreaming}
          isLoading={isStreaming}
          placeholder={isStreaming ? "Generating... (Ctrl+C to cancel)" : "Type your message..."}
        />
      </Box>

      {/* Status bar */}
      <StatusBar 
        session={session}
        config={config}
        isStreaming={isStreaming}
        toolCount={21}
      />
    </Box>
  );
};

// Help content component
const HelpContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c') || input === 'q') {
      onClose();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold underline>Keyboard Shortcuts</Text>
      <Box marginY={1}>
        <Box flexDirection="column">
          <Text>Enter          Submit message</Text>
          <Text>Ctrl+C         Cancel stream / Exit</Text>
          <Text>Ctrl+T         Toggle tool panel</Text>
          <Text>Ctrl+H         Toggle help</Text>
          <Text>Ctrl+L         Clear screen</Text>
          <Text>↑/↓            Navigate history</Text>
          <Text>Ctrl+R          Reverse search history</Text>
          <Text>Tab            Insert newline</Text>
          <Text>Shift+Tab      Submit</Text>
        </Box>
      </Box>
      <Text dimColor>Press ESC, q, or Ctrl+C to close</Text>
    </Box>
  );
};
