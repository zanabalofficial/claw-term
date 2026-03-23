// @ts-nocheck
/**
 * Computer Use - Desktop/UI automation and control
 * Screen capture, mouse/keyboard control, element detection
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
const execAsync = promisify(exec);
export class ComputerUse {
    platform;
    screenshotDir;
    constructor() {
        this.platform = process.platform;
        this.screenshotDir = join(tmpdir(), 'claw-screenshots');
        this.ensureDir();
    }
    async ensureDir() {
        if (!existsSync(this.screenshotDir)) {
            await mkdir(this.screenshotDir, { recursive: true });
        }
    }
    // Take screenshot
    async screenshot(region) {
        const timestamp = Date.now();
        const filename = `screenshot-${timestamp}.png`;
        const filepath = join(this.screenshotDir, filename);
        let command;
        if (this.platform === 'linux') {
            if (region) {
                command = `import -window root -crop ${region.width}x${region.height}+${region.x}+${region.y} "${filepath}"`;
            }
            else {
                command = `import -window root "${filepath}"`;
            }
        }
        else if (this.platform === 'darwin') {
            if (region) {
                command = `screencapture -R${region.x},${region.y},${region.width},${region.height} "${filepath}"`;
            }
            else {
                command = `screencapture "${filepath}"`;
            }
        }
        else {
            throw new Error('Windows not supported yet');
        }
        await execAsync(command);
        // Get dimensions
        const { stdout } = await execAsync(`identify -format "%w %h" "${filepath}"`);
        const [width, height] = stdout.trim().split(' ').map(Number);
        return {
            path: filepath,
            width,
            height,
            timestamp: new Date(),
        };
    }
    // Click at coordinates
    async click(x, y, button = 'left') {
        let command;
        if (this.platform === 'linux') {
            const btn = button === 'left' ? 1 : button === 'middle' ? 2 : 3;
            command = `xdotool mousemove ${x} ${y} click ${btn}`;
        }
        else if (this.platform === 'darwin') {
            const btn = button === 'left' ? 'left' : button === 'right' ? 'right' : 'middle';
            command = `cliclick c:${x},${y}`;
        }
        else {
            throw new Error('Windows not supported yet');
        }
        await execAsync(command);
    }
    // Double click
    async doubleClick(x, y) {
        let command;
        if (this.platform === 'linux') {
            command = `xdotool mousemove ${x} ${y} click --repeat 2 1`;
        }
        else if (this.platform === 'darwin') {
            command = `cliclick dc:${x},${y}`;
        }
        else {
            throw new Error('Windows not supported yet');
        }
        await execAsync(command);
    }
    // Type text
    async type(text) {
        let command;
        if (this.platform === 'linux') {
            // Escape special characters
            const escaped = text.replace(/"/g, '\\"');
            command = `xdotool type "${escaped}"`;
        }
        else if (this.platform === 'darwin') {
            const escaped = text.replace(/"/g, '\\"');
            command = `osascript -e 'tell application "System Events" to keystroke "${escaped}"'`;
        }
        else {
            throw new Error('Windows not supported yet');
        }
        await execAsync(command);
    }
    // Press key
    async keyPress(key, modifiers) {
        let command;
        if (this.platform === 'linux') {
            const modStr = modifiers?.map(m => `${m}+`).join('') || '';
            command = `xdotool key ${modStr}${key}`;
        }
        else if (this.platform === 'darwin') {
            const modMap = {
                'ctrl': '^',
                'alt': '∼',
                'shift': '$',
                'cmd': '@',
            };
            const modStr = modifiers?.map(m => modMap[m] || '').join('') || '';
            command = `osascript -e 'tell application "System Events" to keystroke "${key}" using {${modifiers?.map(m => `${m} down`).join(', ') || ''}}'`;
        }
        else {
            throw new Error('Windows not supported yet');
        }
        await execAsync(command);
    }
    // Scroll
    async scroll(direction, amount = 3) {
        let command;
        if (this.platform === 'linux') {
            const btn = direction === 'up' ? 4 : direction === 'down' ? 5 : direction === 'left' ? 6 : 7;
            command = `xdotool click --repeat ${amount} ${btn}`;
        }
        else {
            // macOS scroll via AppleScript is complex, use cliclick
            command = `cliclick w:${amount * 10}`;
        }
        await execAsync(command);
    }
    // Drag and drop
    async dragAndDrop(fromX, fromY, toX, toY) {
        let command;
        if (this.platform === 'linux') {
            command = `xdotool mousemove ${fromX} ${fromY} mousedown 1 mousemove ${toX} ${toY} mouseup 1`;
        }
        else if (this.platform === 'darwin') {
            command = `cliclick dd:${fromX},${fromY} dm:${toX},${toY} du:${toX},${toY}`;
        }
        else {
            throw new Error('Windows not supported yet');
        }
        await execAsync(command);
    }
    // Get cursor position
    async getCursorPosition() {
        let command;
        if (this.platform === 'linux') {
            command = `xdotool getmouselocation --shell`;
            const { stdout } = await execAsync(command);
            const x = parseInt(stdout.match(/X=(\d+)/)?.[1] || '0');
            const y = parseInt(stdout.match(/Y=(\d+)/)?.[1] || '0');
            return { x, y };
        }
        else if (this.platform === 'darwin') {
            // Requires external tool or AppleScript
            command = `osascript -e 'tell application "System Events" to get position of mouse'`;
            const { stdout } = await execAsync(command);
            const [x, y] = stdout.trim().split(',').map(Number);
            return { x, y };
        }
        throw new Error('Windows not supported yet');
    }
    // Find elements using accessibility (limited support)
    async findElements(predicate) {
        // This requires platform-specific accessibility APIs
        // For now, return mock data or use OCR-based detection
        if (this.platform === 'linux') {
            // Try using at-spi2 tools
            try {
                const { stdout } = await execAsync(`python3 -c "
import dbus
bus = dbus.SessionBus()
# This is a simplified example
print('[]')
"`);
                return JSON.parse(stdout);
            }
            catch {
                return [];
            }
        }
        return [];
    }
    // Wait for condition with polling
    async waitFor(condition, timeout = 30000, interval = 500) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        return false;
    }
    // Take screenshot and perform OCR
    async screenshotWithOCR(region) {
        const screenshot = await this.screenshot(region);
        // Use tesseract for OCR
        const { stdout } = await execAsync(`tesseract "${screenshot.path}" stdout`);
        return {
            screenshot,
            text: stdout,
        };
    }
    // Open application
    async openApplication(appName) {
        let command;
        if (this.platform === 'linux') {
            command = `${appName} &`;
        }
        else if (this.platform === 'darwin') {
            command = `open -a "${appName}"`;
        }
        else {
            throw new Error('Windows not supported yet');
        }
        await execAsync(command);
    }
    // Close application
    async closeApplication(appName) {
        let command;
        if (this.platform === 'linux') {
            command = `pkill -f "${appName}"`;
        }
        else if (this.platform === 'darwin') {
            command = `osascript -e 'quit app "${appName}"'`;
        }
        else {
            throw new Error('Windows not supported yet');
        }
        await execAsync(command);
    }
    // Get screen dimensions
    async getScreenDimensions() {
        let command;
        if (this.platform === 'linux') {
            command = `xdpyinfo | grep dimensions`;
            const { stdout } = await execAsync(command);
            const match = stdout.match(/(\d+)x(\d+) pixels/);
            if (match) {
                return { width: parseInt(match[1]), height: parseInt(match[2]) };
            }
        }
        else if (this.platform === 'darwin') {
            command = `system_profiler SPDisplaysDataType | grep Resolution`;
            const { stdout } = await execAsync(command);
            const match = stdout.match(/(\d+) x (\d+)/);
            if (match) {
                return { width: parseInt(match[1]), height: parseInt(match[2]) };
            }
        }
        return { width: 1920, height: 1080 }; // Default
    }
}
export default ComputerUse;
