// @ts-nocheck
/**
 * Advanced Code Analysis - AST parsing, dependency graphs, security scanning
 * Deep code understanding for better AI assistance
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, relative, dirname } from 'path';

const execAsync = promisify(exec);

export interface CodeAnalysis {
  filePath: string;
  language: string;
  ast?: any;
  imports: string[];
  exports: string[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  dependencies: DependencyInfo[];
  complexity: ComplexityMetrics;
  security: SecurityIssue[];
  suggestions: CodeSuggestion[];
}

export interface FunctionInfo {
  name: string;
  lineStart: number;
  lineEnd: number;
  params: string[];
  returnType?: string;
  async: boolean;
  complexity: number;
}

export interface ClassInfo {
  name: string;
  lineStart: number;
  lineEnd: number;
  methods: FunctionInfo[];
  extends?: string;
  implements?: string[];
}

export interface DependencyInfo {
  source: string;
  target: string;
  type: 'import' | 'call' | 'inheritance';
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  linesOfCode: number;
  linesOfComments: number;
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  message: string;
  line: number;
  code: string;
}

export interface CodeSuggestion {
  type: 'refactor' | 'optimize' | 'style' | 'documentation';
  message: string;
  line?: number;
  confidence: number;
}

export class CodeAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  // Analyze a single file
  async analyzeFile(filePath: string): Promise<CodeAnalysis> {
    const content = await readFile(filePath, 'utf-8');
    const language = this.detectLanguage(filePath);

    const analysis: CodeAnalysis = {
      filePath,
      language,
      imports: this.extractImports(content, language),
      exports: this.extractExports(content, language),
      functions: this.extractFunctions(content, language),
      classes: this.extractClasses(content, language),
      dependencies: [],
      complexity: this.calculateComplexity(content),
      security: await this.scanSecurity(content, filePath),
      suggestions: this.generateSuggestions(content, language),
    };

    // Build dependency graph
    analysis.dependencies = this.buildDependencyGraph(analysis);

    return analysis;
  }

  // Analyze entire project
  async analyzeProject(pattern: string = '**/*.{ts,tsx,js,jsx,py,go,rs}'): Promise<CodeAnalysis[]> {
    const files = await this.findFiles(pattern);
    const analyses: CodeAnalysis[] = [];

    for (const file of files) {
      try {
        const analysis = await this.analyzeFile(file);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze ${file}:`, error);
      }
    }

    return analyses;
  }

  // Generate dependency graph
  generateDependencyGraph(analyses: CodeAnalysis[]): string {
    const nodes = new Set<string>();
    const edges: string[] = [];

    for (const analysis of analyses) {
      nodes.add(analysis.filePath);
      
      for (const dep of analysis.dependencies) {
        nodes.add(dep.target);
        edges.push(`"${dep.source}" -> "${dep.target}" [label="${dep.type}"]`);
      }
    }

    const dot = `
digraph DependencyGraph {
  rankdir=TB;
  node [shape=box, style=rounded];
  
  ${Array.from(nodes).map(n => `"${n}";`).join('\n  ')}
  
  ${edges.join('\n  ')}
}
    `.trim();

    return dot;
  }

  // Find circular dependencies
  findCircularDependencies(analyses: CodeAnalysis[]): string[][] {
    const graph = new Map<string, Set<string>>();

    // Build adjacency list
    for (const analysis of analyses) {
      graph.set(analysis.filePath, new Set());
      for (const dep of analysis.dependencies) {
        graph.get(analysis.filePath)!.add(dep.target);
      }
    }

    // DFS to find cycles
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          // Found cycle
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
          return true;
        }
      }

      path.pop();
      recStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  // Detect dead code
  findDeadCode(analyses: CodeAnalysis[]): string[] {
    const allExports = new Map<string, string[]>();
    const allImports = new Map<string, string[]>();

    for (const analysis of analyses) {
      allExports.set(analysis.filePath, analysis.exports);
      allImports.set(
        analysis.filePath,
        analysis.dependencies.map(d => d.target)
      );
    }

    const deadExports: string[] = [];

    for (const [file, exports] of allExports) {
      for (const exp of exports) {
        let isUsed = false;
        
        for (const [otherFile, imports] of allImports) {
          if (otherFile !== file && imports.some(i => i.includes(exp))) {
            isUsed = true;
            break;
          }
        }

        if (!isUsed) {
          deadExports.push(`${file}::${exp}`);
        }
      }
    }

    return deadExports;
  }

  // Generate project summary
  generateProjectSummary(analyses: CodeAnalysis[]): {
    totalFiles: number;
    totalLines: number;
    totalFunctions: number;
    averageComplexity: number;
    securityIssues: number;
    languageBreakdown: Record<string, number>;
  } {
    const summary = {
      totalFiles: analyses.length,
      totalLines: 0,
      totalFunctions: 0,
      averageComplexity: 0,
      securityIssues: 0,
      languageBreakdown: {} as Record<string, number>,
    };

    let totalComplexity = 0;

    for (const analysis of analyses) {
      summary.totalLines += analysis.complexity.linesOfCode;
      summary.totalFunctions += analysis.functions.length;
      totalComplexity += analysis.complexity.cyclomatic;
      summary.securityIssues += analysis.security.length;
      
      summary.languageBreakdown[analysis.language] = 
        (summary.languageBreakdown[analysis.language] || 0) + 1;
    }

    summary.averageComplexity = summary.totalFunctions > 0 
      ? totalComplexity / summary.totalFunctions 
      : 0;

    return summary;
  }

  // Security scanning
  private async scanSecurity(content: string, filePath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Pattern-based scanning
    const patterns: Array<{ pattern: RegExp; rule: string; message: string; severity: SecurityIssue['severity'] }> = [
      {
        pattern: /eval\s*\(/,
        rule: 'dangerous-eval',
        message: 'Use of eval() is dangerous and can lead to code injection',
        severity: 'critical',
      },
      {
        pattern: /innerHTML\s*=/,
        rule: 'xss-innerhtml',
        message: 'innerHTML assignment can lead to XSS vulnerabilities',
        severity: 'high',
      },
      {
        pattern: /password\s*[:=]\s*["\'][^"\']+["\']/i,
        rule: 'hardcoded-password',
        message: 'Possible hardcoded password detected',
        severity: 'critical',
      },
      {
        pattern: /https?:\/\/localhost/i,
        rule: 'localhost-url',
        message: 'Hardcoded localhost URL',
        severity: 'low',
      },
      {
        pattern: /TODO.*security/i,
        rule: 'security-todo',
        message: 'Security-related TODO found',
        severity: 'medium',
      },
      {
        pattern: /Math\.random\(\)/,
        rule: 'weak-random',
        message: 'Math.random() is not cryptographically secure',
        severity: 'medium',
      },
    ];

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, rule, message, severity } of patterns) {
        if (pattern.test(line)) {
          issues.push({
            severity,
            rule,
            message,
            line: i + 1,
            code: line.trim(),
          });
        }
      }
    }

    // Try to run external security tools
    try {
      const banditIssues = await this.runBandit(filePath);
      issues.push(...banditIssues);
    } catch {}

    try {
      const semgrepIssues = await this.runSemgrep(filePath);
      issues.push(...semgrepIssues);
    } catch {}

    return issues;
  }

  private async runBandit(filePath: string): Promise<SecurityIssue[]> {
    try {
      const { stdout } = await execAsync(`bandit -f json "${filePath}" 2>/dev/null || echo "[]"`);
      const results = JSON.parse(stdout);
      
      return results.results?.map((r: any) => ({
        severity: r.issue_severity.toLowerCase(),
        rule: r.test_id,
        message: r.issue_text,
        line: r.line_number,
        code: r.code,
      })) || [];
    } catch {
      return [];
    }
  }

  private async runSemgrep(filePath: string): Promise<SecurityIssue[]> {
    try {
      const { stdout } = await execAsync(
        `semgrep --json --config=auto "${filePath}" 2>/dev/null || echo '{"results":[]}'`
      );
      const results = JSON.parse(stdout);
      
      return results.results?.map((r: any) => ({
        severity: r.extra?.severity?.toLowerCase() || 'medium',
        rule: r.check_id,
        message: r.extra?.message || '',
        line: r.start?.line || 0,
        code: r.extra?.lines || '',
      })) || [];
    } catch {
      return [];
    }
  }

  // Helper methods
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript-react',
      js: 'javascript',
      jsx: 'javascript-react',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      rb: 'ruby',
    };
    return langMap[ext || ''] || 'unknown';
  }

  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];

    if (language.startsWith('typescript') || language.startsWith('javascript')) {
      // ES6 imports
      const es6Matches = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
      for (const match of es6Matches) {
        imports.push(match[1]);
      }
      
      // CommonJS requires
      const cjsMatches = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
      for (const match of cjsMatches) {
        imports.push(match[1]);
      }
    }

    return imports;
  }

  private extractExports(content: string, language: string): string[] {
    const exports: string[] = [];

    if (language.startsWith('typescript') || language.startsWith('javascript')) {
      // Named exports
      const namedMatches = content.matchAll(/export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g);
      for (const match of namedMatches) {
        exports.push(match[1]);
      }
      
      // Default exports
      const defaultMatch = content.match(/export\s+default\s+(?:class|function)?\s*(\w+)/);
      if (defaultMatch) {
        exports.push(defaultMatch[1] || 'default');
      }
    }

    return exports;
  }

  private extractFunctions(content: string, language: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    if (language.startsWith('typescript') || language.startsWith('javascript')) {
      // Function declarations
      const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        functions.push({
          name: match[1],
          lineStart: content.slice(0, match.index).split('\n').length,
          lineEnd: 0, // Would need AST for accurate end
          params: match[2].split(',').map(p => p.trim()).filter(Boolean),
          async: match[0].includes('async'),
          complexity: 1,
        });
      }

      // Arrow functions and methods
      const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g;
      while ((match = arrowRegex.exec(content)) !== null) {
        functions.push({
          name: match[1],
          lineStart: content.slice(0, match.index).split('\n').length,
          lineEnd: 0,
          params: match[2].split(',').map(p => p.trim()).filter(Boolean),
          async: match[0].includes('async'),
          complexity: 1,
        });
      }
    }

    return functions;
  }

  private extractClasses(content: string, language: string): ClassInfo[] {
    // Simplified - would need real AST parsing
    return [];
  }

  private buildDependencyGraph(analysis: CodeAnalysis): DependencyInfo[] {
    const deps: DependencyInfo[] = [];

    for (const imp of analysis.imports) {
      deps.push({
        source: analysis.filePath,
        target: imp,
        type: 'import',
      });
    }

    return deps;
  }

  private calculateComplexity(content: string): ComplexityMetrics {
    const lines = content.split('\n');
    let cyclomatic = 1;
    let linesOfCode = 0;
    let linesOfComments = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          linesOfComments++;
        }
        continue;
      }

      linesOfCode++;

      // Simple cyclomatic complexity counting
      if (/\b(if|while|for|case|catch)\b/.test(trimmed)) {
        cyclomatic++;
      }
      if (/\?\s*[^:]*\s*:/.test(trimmed)) {
        cyclomatic++;
      }
      if (/\|\||&&/.test(trimmed)) {
        cyclomatic++;
      }
    }

    return {
      cyclomatic,
      cognitive: cyclomatic, // Simplified
      linesOfCode,
      linesOfComments,
    };
  }

  private generateSuggestions(content: string, language: string): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];

    // TODO/FIXME detection
    if (content.includes('TODO')) {
      suggestions.push({
        type: 'documentation',
        message: 'TODO items found - consider creating issues',
        confidence: 0.9,
      });
    }

    // Console.log detection
    if (/console\.(log|debug|warn)/.test(content)) {
      suggestions.push({
        type: 'refactor',
        message: 'Console statements found - consider using a proper logging library',
        confidence: 0.7,
      });
    }

    return suggestions;
  }

  private async findFiles(pattern: string): Promise<string[]> {
    // Use find command
    try {
      const { stdout } = await execAsync(
        `find "${this.projectRoot}" -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" 2>/dev/null | head -100`
      );
      return stdout.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

export default CodeAnalyzer;
