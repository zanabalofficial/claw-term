/**
 * Git Integration - Native git operations, PR review, diff analysis
 * Deep integration with version control
 */
export interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    modified: string[];
    staged: string[];
    untracked: string[];
    conflicted: string[];
}
export interface GitCommit {
    hash: string;
    shortHash: string;
    author: string;
    email: string;
    date: Date;
    message: string;
    files: string[];
}
export interface GitDiff {
    file: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    additions: number;
    deletions: number;
    patch: string;
}
export interface PullRequest {
    number: number;
    title: string;
    author: string;
    branch: string;
    base: string;
    description: string;
    commits: GitCommit[];
    files: GitDiff[];
    comments: PRComment[];
}
export interface PRComment {
    id: number;
    author: string;
    body: string;
    file?: string;
    line?: number;
}
export declare class GitIntegration {
    private repoPath;
    constructor(repoPath?: string);
    isGitRepo(): Promise<boolean>;
    getStatus(): Promise<GitStatus>;
    getLog(maxCount?: number): Promise<GitCommit[]>;
    getDiff(options?: {
        staged?: boolean;
        target?: string;
        source?: string;
    }): Promise<GitDiff[]>;
    stage(files: string[]): Promise<void>;
    unstage(files: string[]): Promise<void>;
    commit(message: string, options?: {
        amend?: boolean;
        noEdit?: boolean;
    }): Promise<void>;
    createBranch(name: string, base?: string): Promise<void>;
    switchBranch(name: string): Promise<void>;
    push(options?: {
        remote?: string;
        branch?: string;
        force?: boolean;
        setUpstream?: boolean;
    }): Promise<void>;
    pull(options?: {
        rebase?: boolean;
        remote?: string;
        branch?: string;
    }): Promise<void>;
    blame(filePath: string): Promise<Array<{
        line: number;
        commit: string;
        author: string;
        date: string;
        content: string;
    }>>;
    interactiveStaging(): Promise<void>;
    generateCommitMessage(): Promise<string>;
    getPullRequest(number: number): Promise<PullRequest | null>;
    getStashes(): Promise<Array<{
        index: number;
        message: string;
        hash: string;
    }>>;
    stash(message?: string): Promise<void>;
    applyStash(index?: number): Promise<void>;
    dropStash(index: number): Promise<void>;
}
export default GitIntegration;
