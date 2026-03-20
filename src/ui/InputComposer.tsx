import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { HistoryManager } from '../core/HistoryManager';

interface InputComposerProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export const InputComposer: React.FC<InputComposerProps> = ({
  onSubmit,
  disabled = false,
  isLoading = false,
  placeholder = "Type your message..."
}) => {
  const [input, setInput] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(input);
  const [multiline, setMultiline] = useState(false);
  
  // Keep ref in sync
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Load initial history
  useEffect(() => {
    HistoryManager.load();
  }, []);

  const handleSubmit = useCallback(() => {
    if (input.trim() && !disabled) {
      onSubmit(input);
      HistoryManager.add(input);
      setInput('');
      setCursorPos(0);
      setHistoryIndex(-1);
      setDraft('');
    }
  }, [input, disabled, onSubmit]);

  useInput((char, key) => {
    if (disabled) {
      // Only allow Ctrl+C when disabled
      if (key.ctrl && char === 'c') {
        return;
      }
      return;
    }

    // Enter/Return - Submit
    if (key.return && !multiline) {
      handleSubmit();
      return;
    }

    // Shift+Enter or Tab+Enter - Newline in multiline mode
    if (key.return && (key.shift || multiline)) {
      const before = input.slice(0, cursorPos);
      const after = input.slice(cursorPos);
      setInput(before + '\n' + after);
      setCursorPos(cursorPos + 1);
      return;
    }

    // Ctrl+Enter - Force submit even in multiline
    if (key.return && key.ctrl) {
      handleSubmit();
      return;
    }

    // Tab - Insert newline or autocomplete
    if (key.tab) {
      if (key.shift) {
        handleSubmit();
      } else {
        const before = input.slice(0, cursorPos);
        const after = input.slice(cursorPos);
        setInput(before + '  ' + after);
        setCursorPos(cursorPos + 2);
      }
      return;
    }

    // Backspace
    if (key.backspace) {
      if (cursorPos > 0) {
        const before = input.slice(0, cursorPos - 1);
        const after = input.slice(cursorPos);
        setInput(before + after);
        setCursorPos(cursorPos - 1);
      }
      return;
    }

    // Delete
    if (key.delete) {
      const before = input.slice(0, cursorPos);
      const after = input.slice(cursorPos + 1);
      setInput(before + after);
      return;
    }

    // Arrow keys
    if (key.leftArrow) {
      setCursorPos(Math.max(0, cursorPos - 1));
      return;
    }

    if (key.rightArrow) {
      setCursorPos(Math.min(input.length, cursorPos + 1));
      return;
    }

    // Up arrow - History previous
    if (key.upArrow) {
      if (historyIndex === -1) {
        setDraft(input);
      }
      const history = HistoryManager.getAll();
      const newIndex = historyIndex + 1;
      if (newIndex < history.length) {
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
        setCursorPos(history[newIndex].length);
      }
      return;
    }

    // Down arrow - History next
    if (key.downArrow) {
      const history = HistoryManager.getAll();
      const newIndex = historyIndex - 1;
      if (newIndex >= 0) {
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
        setCursorPos(history[newIndex].length);
      } else if (newIndex === -1) {
        setHistoryIndex(-1);
        setInput(draft);
        setCursorPos(draft.length);
      }
      return;
    }

    // Home - Beginning of line
    if (key.home) {
      const lastNewline = input.lastIndexOf('\n', cursorPos - 1);
      setCursorPos(lastNewline + 1);
      return;
    }

    // End - End of line
    if (key.end) {
      const nextNewline = input.indexOf('\n', cursorPos);
      setCursorPos(nextNewline === -1 ? input.length : nextNewline);
      return;
    }

    // Ctrl+A - Beginning of input
    if (key.ctrl && char === 'a') {
      setCursorPos(0);
      return;
    }

    // Ctrl+E - End of input
    if (key.ctrl && char === 'e') {
      setCursorPos(input.length);
      return;
    }

    // Ctrl+K - Kill to end of line
    if (key.ctrl && char === 'k') {
      const nextNewline = input.indexOf('\n', cursorPos);
      const before = input.slice(0, cursorPos);
      setInput(before);
      return;
    }

    // Ctrl+U - Kill whole line
    if (key.ctrl && char === 'u') {
      setInput('');
      setCursorPos(0);
      return;
    }

    // Ctrl+W - Kill word back
    if (key.ctrl && char === 'w') {
      const before = input.slice(0, cursorPos);
      const match = before.match(/^(.*\s)\S+$/);
      if (match) {
        setInput(match[1] + input.slice(cursorPos));
        setCursorPos(match[1].length);
      } else {
        setInput(input.slice(cursorPos));
        setCursorPos(0);
      }
      return;
    }

    // Ctrl+R - Reverse search (simplified)
    if (key.ctrl && char === 'r') {
      // In a full implementation, this would open a search interface
      return;
    }

    // Regular character input
    if (char && !key.ctrl && !key.meta) {
      const before = input.slice(0, cursorPos);
      const after = input.slice(cursorPos);
      setInput(before + char + after);
      setCursorPos(cursorPos + char.length);
    }
  });

  // Render input with cursor
  const renderInput = () => {
    const before = input.slice(0, cursorPos);
    const cursor = input[cursorPos] || ' ';
    const after = input.slice(cursorPos + 1);

    if (disabled) {
      return (
        <Text dimColor>{placeholder}</Text>
      );
    }

    return (
      <Box flexDirection="column">
        {input.split('\n').map((line, i) => (
          <Box key={i}>
            <Text>{line}</Text>
          </Box>
        ))}
        {input === '' && <Text dimColor>{placeholder}</Text>}
      </Box>
    );
  };

  // Alternative: Show cursor position
  const renderWithCursor = () => {
    if (disabled) {
      return <Text dimColor>{placeholder}</Text>;
    }

    const lines = input.split('\n');
    let currentLine = 0;
    let currentCol = cursorPos;
    
    // Calculate line and column
    for (let i = 0; i < lines.length; i++) {
      if (currentCol <= lines[i].length) {
        currentLine = i;
        break;
      }
      currentCol -= lines[i].length + 1; // +1 for newline
    }

    return (
      <Box flexDirection="column">
        {lines.map((line, i) => (
          <Box key={i}>
            {i === currentLine ? (
              <>
                <Text>{line.slice(0, currentCol)}</Text>
                <Text backgroundColor="white" color="black">
                  {line[currentCol] || ' '}
                </Text>
                <Text>{line.slice(currentCol + 1)}</Text>
              </>
            ) : (
              <Text>{line}</Text>
            )}
          </Box>
        ))}
        {input === '' && <Text dimColor>{placeholder}</Text>}
      </Box>
    );
  };

  return (
    <Box 
      flexDirection="column" 
      borderStyle="single" 
      borderColor={disabled ? "gray" : "cyan"}
      paddingX={1}
      paddingY={0}
    >
      <Box>
        <Text bold color="cyan">{'>'} </Text>
        <Box flexGrow={1}>
          {renderWithCursor()}
        </Box>
      </Box>
      
      {/* Status line */}
      <Box justifyContent="space-between">
        <Text dimColor>
          {multiline ? '[Multi-line]' : '[Single-line]'} 
          Line {input.split('\n').length}, Col {cursorPos}
        </Text>
        <Text dimColor>
          Ctrl+H for help
        </Text>
      </Box>
    </Box>
  );
};
