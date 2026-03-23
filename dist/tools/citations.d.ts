/**
 * Citation and Provenance Tools
 * Source tracking, passage grounding, evidence packaging
 */
export interface Citation {
    id: string;
    source: string;
    sourceType: 'document' | 'web' | 'database' | 'tool' | 'memory';
    content: string;
    location?: {
        page?: number;
        line?: number;
        section?: string;
        url?: string;
    };
    timestamp: Date;
    confidence: number;
}
export interface ProvenanceChain {
    id: string;
    originalSource: Citation;
    transformations: Array<{
        operation: string;
        timestamp: Date;
        result: string;
    }>;
    finalOutput: string;
}
export declare class CitationManager {
    private citations;
    private provenanceChains;
    addCitation(citation: Omit<Citation, 'id' | 'timestamp'>): Citation;
    packageCitations(citationIds: string[]): {
        citations: Citation[];
        format: 'inline' | 'footnote' | 'appendix';
    };
    createProvenanceChain(originalSource: Citation, finalOutput: string): ProvenanceChain;
    addTransformation(chainId: string, operation: string, result: string): void;
    verifyCitation(citationId: string): {
        valid: boolean;
        citation?: Citation;
        error?: string;
    };
    extractCitations(text: string): Array<{
        text: string;
        citationId?: string;
    }>;
    formatCitation(citation: Citation, style?: 'apa' | 'mla' | 'chicago' | 'ieee'): string;
    groundPassage(passage: string, source: string, location: Citation['location']): {
        grounded: boolean;
        citations: Citation[];
        ungroundedSegments: string[];
    };
    getAllCitations(): Citation[];
    export(format: 'json' | 'bibtex' | 'ris'): string;
    private generateId;
}
export default CitationManager;
