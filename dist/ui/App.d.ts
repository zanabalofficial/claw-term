/**
 * ClawTerm - Main App Component
 * Terminal AI Agent with streaming, onboarding, slash commands
 */
import React from 'react';
interface Config {
    provider: 'openai' | 'anthropic' | 'local';
    model: string;
    apiKey: string;
    workspace: string;
    debug: boolean;
}
export declare const App: React.FC<{
    session?: any;
    config?: Config;
}>;
export default App;
