// @ts-nocheck
/**
 * Interactive Onboarding System
 * Guides users through first-time setup
 */
import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to ClawTerm',
        description: 'Your AI-powered terminal for business automation\n\nPress Enter to continue...',
        type: 'welcome',
    },
    {
        id: 'name',
        title: 'What should I call you?',
        description: 'This will be used to personalize your experience',
        type: 'input',
        validate: (v) => v.length >= 2,
    },
    {
        id: 'provider',
        title: 'Choose your AI Provider',
        description: 'Select the AI model you want to use',
        type: 'select',
        options: [
            { label: 'OpenAI GPT-4', value: 'openai' },
            { label: 'Anthropic Claude', value: 'anthropic' },
            { label: 'Local LLM (Ollama)', value: 'local' },
        ],
    },
    {
        id: 'apiKey',
        title: 'Enter your API Key',
        description: 'Your key is stored securely and never shared',
        type: 'input',
        validate: (v) => v.startsWith('sk-') || v.startsWith('sk-ant-') || v.length > 10,
    },
    {
        id: 'features',
        title: 'Enable Business Agents?',
        description: '30 revenue-generating agents for AR recovery, dunning, etc.',
        type: 'confirm',
        skippable: true,
    },
    {
        id: 'complete',
        title: 'Setup Complete! 🎉',
        description: 'You\'re ready to start using ClawTerm\n\nPress Enter to begin...',
        type: 'complete',
    },
];
export const InteractiveOnboarding = ({ onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [config, setConfig] = useState({});
    const [input, setInput] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { exit } = useApp();
    const step = ONBOARDING_STEPS[currentStep];
    useInput((input, key) => {
        if (key.escape && step.skippable) {
            onSkip?.();
            return;
        }
        if (step.type === 'welcome' || step.type === 'complete') {
            if (key.return) {
                if (currentStep === ONBOARDING_STEPS.length - 1) {
                    onComplete(config);
                }
                else {
                    setCurrentStep(currentStep + 1);
                }
            }
            return;
        }
        if (step.type === 'confirm') {
            if (input === 'y' || input === 'Y') {
                setConfig({ ...config, [step.id]: true });
                setCurrentStep(currentStep + 1);
            }
            else if (input === 'n' || input === 'N') {
                setConfig({ ...config, [step.id]: false });
                setCurrentStep(currentStep + 1);
            }
            return;
        }
        if (step.type === 'select' && key.return) {
            const selected = step.options[selectedIndex];
            setConfig({ ...config, [step.id]: selected.value });
            setCurrentStep(currentStep + 1);
            setSelectedIndex(0);
        }
        if (step.type === 'input' && key.return) {
            if (step.validate && !step.validate(input)) {
                return; // Invalid input
            }
            setConfig({ ...config, [step.id]: input });
            setInput('');
            setCurrentStep(currentStep + 1);
        }
        if (key.upArrow && step.type === 'select') {
            setSelectedIndex(Math.max(0, selectedIndex - 1));
        }
        if (key.downArrow && step.type === 'select') {
            setSelectedIndex(Math.min(step.options.length - 1, selectedIndex + 1));
        }
    });
    const progress = Math.round(((currentStep + 1) / ONBOARDING_STEPS.length) * 100);
    return (React.createElement(Box, { flexDirection: "column", padding: 2 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557")),
        React.createElement(Box, { marginBottom: 1, justifyContent: "center" },
            React.createElement(Text, { bold: true, color: "cyan" }, step.title)),
        React.createElement(Box, { marginBottom: 2, justifyContent: "center" },
            React.createElement(Text, { color: "gray" }, step.description)),
        React.createElement(Box, { marginBottom: 2 },
            React.createElement(Text, { color: "green" }, '█'.repeat(Math.floor(progress / 5))),
            React.createElement(Text, { color: "gray" }, '░'.repeat(20 - Math.floor(progress / 5))),
            React.createElement(Text, null,
                " ",
                progress,
                "%")),
        React.createElement(Box, { marginTop: 1 },
            step.type === 'input' && (React.createElement(Box, null,
                React.createElement(Text, { color: "yellow" }, "\u203A "),
                React.createElement(TextInput, { value: input, onChange: setInput, mask: step.id === 'apiKey' ? '*' : undefined }))),
            step.type === 'select' && step.options && (React.createElement(Box, { flexDirection: "column" }, step.options.map((option, index) => (React.createElement(Box, { key: option.value },
                React.createElement(Text, { color: index === selectedIndex ? 'cyan' : 'white' },
                    index === selectedIndex ? '› ' : '  ',
                    option.label)))))),
            step.type === 'confirm' && (React.createElement(Box, { flexDirection: "column" },
                React.createElement(Text, null, "Enable this feature? (y/n)"),
                React.createElement(Box, { marginTop: 1 },
                    React.createElement(Text, { color: "gray" }, "Press Y to enable, N to skip")))),
            isLoading && (React.createElement(Box, null,
                React.createElement(Text, { color: "green" },
                    React.createElement(Spinner, { type: "dots" })),
                React.createElement(Text, null, " Validating...")))),
        React.createElement(Box, { marginTop: 2 },
            React.createElement(Text, { color: "gray" },
                step.skippable ? 'ESC to skip • ' : '',
                step.type === 'select' ? '↑↓ to navigate • Enter to select' : 'Enter to continue'))));
};
export default InteractiveOnboarding;
