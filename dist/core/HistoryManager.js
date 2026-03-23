// @ts-nocheck
/**
 * History Manager for input history persistence
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
export class HistoryManager {
    static history = [];
    static loaded = false;
    static filePath = process.env.CLAW_HISTORY_FILE || '.claw_history';
    static maxSize = parseInt(process.env.CLAW_HISTORY_SIZE || '1000');
    static async load() {
        if (this.loaded)
            return;
        if (existsSync(this.filePath)) {
            try {
                const content = readFileSync(this.filePath, 'utf-8');
                this.history = content
                    .split('\n')
                    .filter(line => line.trim())
                    .slice(-this.maxSize);
            }
            catch {
                // Ignore errors
            }
        }
        this.loaded = true;
    }
    static add(content) {
        if (!content.trim())
            return;
        // Avoid duplicates at the end
        if (this.history[this.history.length - 1] === content) {
            return;
        }
        this.history.push(content);
        // Trim to max size
        if (this.history.length > this.maxSize) {
            this.history = this.history.slice(-this.maxSize);
        }
        // Persist
        try {
            appendFileSync(this.filePath, content + '\n');
        }
        catch {
            // Ignore write errors
        }
    }
    static getAll() {
        return [...this.history].reverse(); // Most recent first
    }
    static get(index) {
        const reversed = this.getAll();
        return reversed[index];
    }
    static async list(limit) {
        await this.load();
        return this.getAll()
            .slice(0, limit)
            .map(content => ({
            content,
            timestamp: new Date(), // In real impl, store timestamps
            preview: content.length > 50 ? content.slice(0, 50) + '...' : content,
        }));
    }
    static async clear() {
        this.history = [];
        try {
            writeFileSync(this.filePath, '');
        }
        catch {
            // Ignore
        }
    }
}
