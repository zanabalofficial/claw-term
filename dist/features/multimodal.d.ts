/**
 * Multi-Modal Support - Handle images, audio, video in terminal
 * Displays images in terminal using kitty/iterm/sixel protocols
 * Plays audio via system players
 * Extracts frames from video
 */
export interface MediaFile {
    path: string;
    type: 'image' | 'audio' | 'video';
    mimeType: string;
}
export interface MultimodalConfig {
    imageProtocol: 'kitty' | 'iterm' | 'sixel' | 'none';
    autoPlayAudio: boolean;
    maxImageSize: number;
}
export interface ImageDisplayOptions {
    width?: number;
    height?: number;
    preserveAspect: boolean;
    fallback?: string;
}
export interface TerminalProtocol {
    supportsImages: boolean;
    supportsColor: boolean;
    supports256: boolean;
}
export declare class MultiModalProcessor {
    private static detectImageProtocol;
    static displayImage(imagePath: string, options?: {
        width?: number;
        height?: number;
        preserveAspectRatio?: boolean;
    }): Promise<string>;
    private static displayKitty;
    private static displayIterm;
    private static displaySixel;
    private static displayAscii;
    static playAudio(audioPath: string): Promise<void>;
    static displayVideoFrame(videoPath: string, timestamp?: string): Promise<string>;
    static transcribeAudio(audioPath: string): Promise<string>;
    static extractTextFromImage(imagePath: string): Promise<string>;
}
export default MultiModalProcessor;
