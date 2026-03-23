/**
 * Computer Use - Desktop/UI automation and control
 * Screen capture, mouse/keyboard control, element detection
 */
export interface ScreenRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface UIElement {
    id: string;
    type: string;
    label?: string;
    bounds: ScreenRegion;
    clickable: boolean;
    enabled: boolean;
}
export interface Screenshot {
    path: string;
    width: number;
    height: number;
    timestamp: Date;
}
export declare class ComputerUse {
    private platform;
    private screenshotDir;
    constructor();
    private ensureDir;
    screenshot(region?: ScreenRegion): Promise<Screenshot>;
    click(x: number, y: number, button?: 'left' | 'right' | 'middle'): Promise<void>;
    doubleClick(x: number, y: number): Promise<void>;
    type(text: string): Promise<void>;
    keyPress(key: string, modifiers?: string[]): Promise<void>;
    scroll(direction: 'up' | 'down' | 'left' | 'right', amount?: number): Promise<void>;
    dragAndDrop(fromX: number, fromY: number, toX: number, toY: number): Promise<void>;
    getCursorPosition(): Promise<{
        x: number;
        y: number;
    }>;
    findElements(predicate: {
        label?: string;
        type?: string;
    }): Promise<UIElement[]>;
    waitFor(condition: () => Promise<boolean>, timeout?: number, interval?: number): Promise<boolean>;
    screenshotWithOCR(region?: ScreenRegion): Promise<{
        screenshot: Screenshot;
        text: string;
    }>;
    openApplication(appName: string): Promise<void>;
    closeApplication(appName: string): Promise<void>;
    getScreenDimensions(): Promise<{
        width: number;
        height: number;
    }>;
}
export default ComputerUse;
