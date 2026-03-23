/**
 * Advanced Code Analysis - AST parsing, dependency graphs, security scanning
 * Deep code understanding for better AI assistance
 */
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
export declare class CodeAnalyzer {
    private projectRoot;
    constructor(projectRoot?: string);
    analyzeFile(filePath: string): Promise<CodeAnalysis>;
    analyzeProject(pattern?: string): Promise<CodeAnalysis[]>;
    generateDependencyGraph(analyses: CodeAnalysis[]): string;
    findCircularDependencies(analyses: CodeAnalysis[]): string[][];
    findDeadCode(analyses: CodeAnalysis[]): string[];
    generateProjectSummary(analyses: CodeAnalysis[]): {
        totalFiles: number;
        totalLines: number;
        totalFunctions: number;
        averageComplexity: number;
        securityIssues: number;
        languageBreakdown: Record<string, number>;
    };
    private scanSecurity;
    private runBandit;
    private runSemgrep;
    private detectLanguage;
    private extractImports;
    private extractExports;
    private extractFunctions;
    private extractClasses;
    private buildDependencyGraph;
    private calculateComplexity;
    private generateSuggestions;
    private findFiles;
}
export default CodeAnalyzer;
