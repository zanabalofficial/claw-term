/**
 * Skills System - Load and execute OpenClaw/AgentSkills
 * Seamless integration with the OpenClaw ecosystem
 */
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
export declare class SkillManager extends EventEmitter {
    private skills;
    private skillsDir;
    constructor(skillsDir?: string);
    loadSkills(): Promise<void>;
    loadSkill(skillPath: string): Promise<Skill | null>;
    private parseManifest;
    getSkill(name: string): Skill | undefined;
    listSkills(): Skill[];
    executeScript(skillName: string, scriptName: string, args?: string[]): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
    }>;
    readReference(skillName: string, refName: string): string | null;
    searchSkills(query: string): Skill[];
}
export default SkillManager;
