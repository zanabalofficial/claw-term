// @ts-nocheck
/**
 * Input Composer - Simplified
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	placeholder?: string;
}

export const InputComposer: React.FC<Props> = ({ value, onChange, onSubmit, placeholder }) => {
	const [history, setHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	useInput((input, key) => {
		// Handle up/down for history
		if (key.upArrow && history.length > 0) {
			const newIndex = Math.min(historyIndex + 1, history.length - 1);
			setHistoryIndex(newIndex);
			onChange(history[history.length - 1 - newIndex]);
		}
		if (key.downArrow && historyIndex > 0) {
			const newIndex = historyIndex - 1;
			setHistoryIndex(newIndex);
			onChange(history[history.length - 1 - newIndex]);
		}
	});

	const handleSubmit = () => {
		if (value.trim()) {
			setHistory(prev => [...prev, value]);
			setHistoryIndex(-1);
			onSubmit();
		}
	};

	return (
		<Box>
			<Text color="green">❯ </Text>
			<TextInput
				value={value}
				onChange={onChange}
				onSubmit={handleSubmit}
				placeholder={placeholder}
			/>
		</Box>
	);
};

export default InputComposer;