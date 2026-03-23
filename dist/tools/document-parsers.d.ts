/**
 * Document Parsers - PDF, spreadsheets, slides, OCR
 * Extract structured content from various document formats
 */
export interface ParsedDocument {
    text: string;
    metadata: {
        title?: string;
        author?: string;
        created?: Date;
        pages?: number;
        format: string;
    };
    pages?: Array<{
        pageNum: number;
        text: string;
        images?: string[];
        tables?: any[];
    }>;
    tables?: any[];
    images?: string[];
}
export declare class DocumentParsers {
    parsePDF(filePath: string, options?: {
        extractImages?: boolean;
        extractTables?: boolean;
        ocr?: boolean;
    }): Promise<ParsedDocument>;
    parseDOCX(filePath: string): Promise<ParsedDocument>;
    parseSpreadsheet(filePath: string, options?: {
        sheet?: string | number;
        header?: boolean;
    }): Promise<ParsedDocument>;
    parsePPTX(filePath: string): Promise<ParsedDocument>;
    parseHTML(filePath: string): Promise<ParsedDocument>;
    parseImageOCR(filePath: string, options?: {
        language?: string;
        dpi?: number;
    }): Promise<ParsedDocument>;
    extractText(filePath: string): Promise<string>;
    private runPythonScript;
}
export default DocumentParsers;
