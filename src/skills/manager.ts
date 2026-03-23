// @ts-nocheck
/**
 * Skills System - Load and execute OpenClaw/AgentSkills
 * Seamless integration with the OpenClaw ecosystem
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

export interface SkillManifest {
  name: string;
  description: string;
  version?: string;
  author?: string;
  metadata?: {
    openclaw?: {
      emoji?: string;
      requires?: {
        bins?: string[];
        skills?: string[];
      };
    };
  };
}

export interface Skill {
  manifest: SkillManifest;
  path: string;
  skillMd: string;
  scripts: Map<string, string>;
  references: Map<string, string>;
  assets: Map<string, string>;
}

export class SkillManager extends EventEmitter {
  private skills: Map<string, Skill> = new Map();
  private skillsDir: string;

  constructor(skillsDir?: string) {
    super();
    this.skillsDir = skillsDir || join(process.cwd(), 'skills');
  }

  // Load all skills from directory
  async loadSkills(): Promise<void> {
    if (!existsSync(this.skillsDir)) return;

    for (const entry of readdirSync(this.skillsDir)) {
      const skillPath = join(this.skillsDir, entry);
      if (statSync(skillPath).isDirectory()) {
        await this.loadSkill(skillPath);
      }
    }

    this.emit('loaded', { count: this.skills.size });
  }

  // Load a single skill
  async loadSkill(skillPath: string): Promise<Skill | null> {
    const skillMdPath = join(skillPath, 'SKILL.md');
    if (!existsSync(skillMdPath)) return null;

    const skillMd = readFileSync(skillMdPath, 'utf-8');
    const manifest = this.parseManifest(skillMd);
    
    const skill: Skill = {
      manifest,
      path: skillPath,
      skillMd,
      scripts: new Map(),
      references: new Map(),
      assets: new Map(),
    };

    // Load bundled resources
    const scriptsDir = join(skillPath, 'scripts');
    if (existsSync(scriptsDir)) {
      for (const file of readdirSync(scriptsDir)) {
        skill.scripts.set(file, join(scriptsDir, file));
      }
    }

    const refsDir = join(skillPath, 'references');
    if (existsSync(refsDir)) {
      for (const file of readdirSync(refsDir)) {
        skill.references.set(file, join(refsDir, file));
      }
    }

    const assetsDir = join(skillPath, 'assets');
    if (existsSync(assetsDir)) {
      for (const file of readdirSync(assetsDir)) {
        skill.assets.set(file, join(assetsDir, file));
      }
    }

    this.skills.set(manifest.name, skill);
    this.emit('skillLoaded', { name: manifest.name, path: skillPath });
    return skill;
  }

  private parseManifest(skillMd: string): SkillManifest {
    // Simple YAML frontmatter parsing
    const match = skillMd.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      const lines = match[1].split('\n');
      const manifest: any = {};
      
      for (const line of lines) {
        const [key, ...rest] = line.split(':');
        if (key && rest.length > 0) {
          manifest[key.trim()] = rest.join(':').trim();
        }
      }
      
      return {
        name: manifest.name || 'unknown',
        description: manifest.description || '',
        version: manifest.version,
        author: manifest.author,
      };
    }

    // Fallback
    const nameMatch = skillMd.match(/name:\s*(.+)/);
    const descMatch = skillMd.match(/description:\s*(.+)/);
    
    return {
      name: nameMatch?.[1]?.trim() || 'unknown',
      description: descMatch?.[1]?.trim() || '',
    };
  }

  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  async executeScript(skillName: string, scriptName: string, args: string[] = []): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    const skill = this.skills.get(skillName);
    if (!skill) throw new Error(`Skill ${skillName} not found`);

    const scriptPath = skill.scripts.get(scriptName);
    if (!scriptPath) throw new Error(`Script ${scriptName} not found`);

    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const proc = spawn('sh', ['-c', `"${scriptPath}" ${args.join(' ')}`], {
        cwd: skill.path,
        env: { ...process.env, SKILL_PATH: skill.path },
      });

      let stdout = '', stderr = '';
      proc.stdout?.on('data', (d) => stdout += d);
      proc.stderr?.on('data', (d) => stderr += d);
      proc.on('close', (code) => resolve({ stdout, stderr, exitCode: code || 0 }));
      proc.on('error', reject);
    });
  }

  readReference(skillName: string, refName: string): string | null {
    const skill = this.skills.get(skillName);
    if (!skill) return null;
    const path = skill.references.get(refName);
    return path ? readFileSync(path, 'utf-8') : null;
  }

  searchSkills(query: string): Skill[] {
    const q = query.toLowerCase();
    return this.listSkills().filter(s =>
      s.manifest.name.toLowerCase().includes(q) ||
      s.manifest.description.toLowerCase().includes(q)
    );
  }
}

export default SkillManager;
