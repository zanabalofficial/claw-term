/**
 * Natural Language Shell - Convert natural language to shell commands
 * AI-powered command generation with safety validation
 */
export interface NLCommand {
    naturalLanguage: string;
    shellCommand: string;
    explanation: string;
    dangerous: boolean;
    safeAlternative?: string;
}
export declare class NaturalLanguageShell {
    private apiKey;
    private provider;
    private history;
    constructor(config: {
        apiKey: string;
        provider: string;
    });
    translate(naturalLanguage: string, context?: string): Promise<NLCommand>;
    executeWithSafety(command: NLCommand, confirmed?: boolean): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
    }>;
    interactiveExecute(naturalLanguage: string): Promise<string>;
    getHistory(): NLCommand[];
    clearHistory(): void;
    private isDangerous;
    suggestCommands(currentDirectory: string, recentFiles: string[]): Promise<string[]>;
}
export default NaturalLanguageShell;
