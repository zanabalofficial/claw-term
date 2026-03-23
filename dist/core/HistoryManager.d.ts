export interface HistoryEntry {
    content: string;
    timestamp: Date;
    preview: string;
}
export declare class HistoryManager {
    private static history;
    private static loaded;
    private static filePath;
    private static maxSize;
    static load(): Promise<void>;
    static add(content: string): void;
    static getAll(): string[];
    static get(index: number): string | undefined;
    static list(limit: number): Promise<HistoryEntry[]>;
    static clear(): Promise<void>;
}
