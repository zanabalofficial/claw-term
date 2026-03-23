// @ts-nocheck
/**
 * Multi-Modal Support - Handle images, audio, video in terminal
 * Displays images in terminal using kitty/iterm/sixel protocols
 * Plays audio via system players
 * Extracts frames from video
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

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

export class MultiModalProcessor {
  // Detect terminal image support
  private static async detectImageProtocol(): Promise<'kitty' | 'iterm' | 'sixel' | 'none'> {
    const term = process.env.TERM || '';
    const termProgram = process.env.TERM_PROGRAM || '';
    
    if (termProgram === 'iTerm.app' || process.env.LC_TERMINAL === 'iTerm2') {
      return 'iterm';
    }
    if (process.env.KITTY_WINDOW_ID) {
      return 'kitty';
    }
    // Check for sixel support
    try {
      const { stdout } = await execAsync('tput Sxl 2>/dev/null || echo -n "none"');
      if (stdout.includes('4')) return 'sixel';
    } catch {}
    
    return 'none';
  }

  // Display image in terminal
  static async displayImage(imagePath: string, options: {
    width?: number;
    height?: number;
    preserveAspectRatio?: boolean;
  } = {}): Promise<string> {
    if (!existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }

    const protocol = await this.detectImageProtocol();
    const dims = options.width && options.height 
      ? `${options.width}x${options.height}` 
      : 'auto';

    switch (protocol) {
      case 'kitty':
        return this.displayKitty(imagePath, dims);
      case 'iterm':
        return this.displayIterm(imagePath, dims);
      case 'sixel':
        return this.displaySixel(imagePath, dims);
      default:
        // Fallback: ASCII art via chafa or similar
        return this.displayAscii(imagePath, dims);
    }
  }

  private static async displayKitty(imagePath: string, dims: string): Promise<string> {
    // Kitty graphics protocol
    const data = await readFile(imagePath);
    const base64 = data.toString('base64');
    
    // Escape sequences for kitty
    const ESC = '\x1b';
    const GC = '_G'; // Graphics control
    
    // Build kitty graphics command
    const chunks = base64.match(/.{1,4096}/g) || [];
    let output = '';
    
    for (let i = 0; i < chunks.length; i++) {
      const m = i === chunks.length - 1 ? '0' : '1'; // m=0 is final chunk
      output += `${ESC}${GC}f=100,a=T,m=${m},q=2;${chunks[i]}${ESC}\\`;
    }
    
    return output;
  }

  private static async displayIterm(imagePath: string, dims: string): Promise<string> {
    // iTerm2 inline images protocol
    const data = await readFile(imagePath);
    const base64 = data.toString('base64');
    const filename = imagePath.split('/').pop() || 'image';
    
    // OSC 1337 ; File=name=Base64EncodedName;inline=1;size=Base64DataSize;base64,Base64Data
    const osc = '\x1b]1337;';
    const st = '\x07';
    
    return `${osc}File=name=${Buffer.from(filename).toString('base64')};inline=1:${base64}${st}`;
  }

  private static async displaySixel(imagePath: string, dims: string): Promise<string> {
    // Convert to sixel using img2sixel or similar
    try {
      const { stdout } = await execAsync(`img2sixel -w ${dims} "${imagePath}" 2>/dev/null`);
      return stdout;
    } catch {
      return this.displayAscii(imagePath, dims);
    }
  }

  private static async displayAscii(imagePath: string, dims: string): Promise<string> {
    // Use chafa or convert to ASCII
    try {
      const { stdout } = await execAsync(`chafa --size=${dims} --format=symbols "${imagePath}" 2>/dev/null`);
      return stdout;
    } catch {
      return `[Image: ${imagePath}] (Install chafa for ASCII preview)`;
    }
  }

  // Play audio file
  static async playAudio(audioPath: string): Promise<void> {
    if (!existsSync(audioPath)) {
      throw new Error(`Audio not found: ${audioPath}`);
    }

    // Try different audio players
    const players = ['afplay', 'paplay', 'mplayer', 'mpg123', 'vlc --intf dummy'];
    
    for (const player of players) {
      try {
        await execAsync(`${player} "${audioPath}" 2>/dev/null`);
        return;
      } catch {}
    }
    
    throw new Error('No suitable audio player found');
  }

  // Extract and display video frame
  static async displayVideoFrame(videoPath: string, timestamp: string = '00:00:01'): Promise<string> {
    if (!existsSync(videoPath)) {
      throw new Error(`Video not found: ${videoPath}`);
    }

    // Extract frame using ffmpeg
    const tmpPath = `/tmp/claw_frame_${Date.now()}.png`;
    
    try {
      await execAsync(`ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -y "${tmpPath}" 2>/dev/null`);
      const result = await this.displayImage(tmpPath);
      await execAsync(`rm -f "${tmpPath}"`);
      return result;
    } catch {
      return `[Video: ${videoPath} at ${timestamp}]`;
    }
  }

  // Transcribe audio (requires whisper.cpp or similar)
  static async transcribeAudio(audioPath: string): Promise<string> {
    // This would integrate with a local whisper model or API
    return `[Transcription: Audio file ${audioPath} - integration required]`;
  }

  // Extract text from image (OCR)
  static async extractTextFromImage(imagePath: string): Promise<string> {
    try {
      // Try tesseract OCR
      const { stdout } = await execAsync(`tesseract "${imagePath}" stdout 2>/dev/null`);
      return stdout.trim();
    } catch {
      return `[OCR: Could not extract text from ${imagePath}]`;
    }
  }
}

// Tool registration for multimodal
export default MultiModalProcessor;
