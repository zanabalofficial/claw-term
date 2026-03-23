// @ts-nocheck
/**
 * Natural Language Shell - Convert natural language to shell commands
 * AI-powered command generation with safety validation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { createProvider } from '../providers/adapters';

const execAsync = promisify(exec);

export interface NLCommand {
  naturalLanguage: string;
  shellCommand: string;
  explanation: string;
  dangerous: boolean;
  safeAlternative?: string;
}

export class NaturalLanguageShell {
  private apiKey: string;
  private provider: string;
  private history: NLCommand[] = [];

  constructor(config: { apiKey: string; provider: string }) {
    this.apiKey = config.apiKey;
    this.provider = config.provider;
  }

  // Convert natural language to shell command
  async translate(naturalLanguage: string, context?: string): Promise<NLCommand> {
    const provider = createProvider(this.provider as any, {
      apiKey: this.apiKey,
      model: 'gpt-4',
      temperature: 0.2,
    });

    const systemPrompt = `You are a shell command translator. Convert natural language to bash commands.
Rules:
1. Generate ONLY the shell command, no explanation in the command
2. Mark dangerous commands (rm, dd, mkfs, etc.) as dangerous: true
3. Provide explanation separately
4. For dangerous commands, suggest safer alternatives
5. Prefer modern tools (ripgrep over grep, fd over find)
6. Use absolute paths when appropriate

Respond in JSON format:
{
  "command": "the shell command",
  "explanation": "what this does",
  "dangerous": boolean,
  "safeAlternative": "safer version if dangerous"
}`;

    let response = '';
    
    await provider.streamResponse(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context ? `Context: ${context}\n\nCommand: ${naturalLanguage}` : naturalLanguage },
      ],
      {
        onToken: (token) => { response += token; },
        onToolCall: () => {},
        onComplete: () => {},
        onError: () => {},
      }
    );

    // Parse JSON response
    let parsed: any;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    } catch {
      parsed = {
        command: response.trim(),
        explanation: 'Generated command',
        dangerous: this.isDangerous(response),
      };
    }

    const command: NLCommand = {
      naturalLanguage,
      shellCommand: parsed.command || response.trim(),
      explanation: parsed.explanation || 'No explanation provided',
      dangerous: parsed.dangerous || this.isDangerous(parsed.command),
      safeAlternative: parsed.safeAlternative,
    };

    this.history.push(command);
    return command;
  }

  // Execute with confirmation for dangerous commands
  async executeWithSafety(command: NLCommand, confirmed: boolean = false): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    if (command.dangerous && !confirmed) {
      throw new Error(`Dangerous command requires confirmation: ${command.shellCommand}`);
    }

    try {
      const { stdout, stderr } = await execAsync(command.shellCommand, {
        timeout: 60000,
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || 1,
      };
    }
  }

  // Interactive mode - ask for confirmation
  async interactiveExecute(naturalLanguage: string): Promise<string> {
    const command = await this.translate(naturalLanguage);
    
    console.log(`Command: ${command.shellCommand}`);
    console.log(`Explanation: ${command.explanation}`);
    
    if (command.dangerous) {
      console.log(`⚠️  DANGEROUS: This command may cause data loss`);
      if (command.safeAlternative) {
        console.log(`Safe alternative: ${command.safeAlternative}`);
      }
      // In TUI, would prompt for confirmation here
      return 'Confirmation required for dangerous command';
    }
    
    const result = await this.executeWithSafety(command, true);
    return result.stdout || result.stderr || 'Command executed';
  }

  // Get command history
  getHistory(): NLCommand[] {
    return [...this.history];
  }

  // Clear history
  clearHistory(): void {
    this.history = [];
  }

  // Check if command is dangerous
  private isDangerous(command: string): boolean {
    const dangerousPatterns = [
      /\brm\s+-rf\s+\//,
      />\s*\/dev\/sda/,
      /mkfs\./,
      /dd\s+if=.*of=\/dev/,
      /:(){ :|:& };:/, // Fork bomb
      /curl.*\|.*sh/,
      /wget.*\|.*sh/,
      /eval\s*\(/,
    ];

    return dangerousPatterns.some(pattern => pattern.test(command));
  }

  // Generate command suggestions based on context
  async suggestCommands(currentDirectory: string, recentFiles: string[]): Promise<string[]> {
    const provider = createProvider(this.provider as any, {
      apiKey: this.apiKey,
      model: 'gpt-4',
      temperature: 0.7,
    });

    const prompt = `Current directory: ${currentDirectory}\nRecent files: ${recentFiles.join(', ')}\n\nSuggest 5 useful shell commands for this context.`;

    let response = '';
    await provider.streamResponse(
      [{ role: 'user', content: prompt }],
      {
        onToken: (token) => { response += token; },
        onToolCall: () => {},
        onComplete: () => {},
        onError: () => {},
      }
    );

    return response.split('\n').filter(line => line.trim().startsWith('-') || line.includes('$'));
  }
}

export default NaturalLanguageShell;
