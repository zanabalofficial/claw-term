/**
 * Automated Testing - Generate and run tests automatically
 * AI-powered test generation, execution, and coverage analysis
 */
export interface TestResult {
    file: string;
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
}
export interface CoverageReport {
    lines: {
        total: number;
        covered: number;
        percentage: number;
    };
    functions: {
        total: number;
        covered: number;
        percentage: number;
    };
    statements: {
        total: number;
        covered: number;
        percentage: number;
    };
}
export declare class AutomatedTesting {
    private projectRoot;
    constructor(projectRoot?: string);
    detectFramework(): Promise<'jest' | 'vitest' | 'mocha' | 'bun' | null>;
    runTests(pattern?: string): Promise<{
        results: TestResult[];
        passed: number;
        failed: number;
        duration: number;
    }>;
    runCoverage(): Promise<CoverageReport>;
    generateTestFile(sourcePath: string): Promise<string>;
    private parseTestOutput;
    private extractExports;
}
export default AutomatedTesting;
