/**
 * Git Integration - Native git operations, PR review, diff analysis
 * Deep integration with version control
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

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

export class GitIntegration {
  private repoPath: string;

  constructor(repoPath: string = process.cwd()) {
    this.repoPath = repoPath;
  }

  // Check if directory is a git repo
  async isGitRepo(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.repoPath });
      return true;
    } catch {
      return false;
    }
  }

  // Get current status
  async getStatus(): Promise<GitStatus> {
    // Get branch
    const { stdout: branchOutput } = await execAsync(
      'git branch --show-current',
      { cwd: this.repoPath }
    );
    const branch = branchOutput.trim();

    // Get ahead/behind
    let ahead = 0;
    let behind = 0;
    try {
      const { stdout: abOutput } = await execAsync(
        'git rev-list --left-right --count HEAD...@{upstream}',
        { cwd: this.repoPath }
      );
      const [b, a] = abOutput.trim().split('\t').map(Number);
      behind = b;
      ahead = a;
    } catch {
      // No upstream
    }

    // Parse status
    const { stdout: statusOutput } = await execAsync(
      'git status --porcelain -uall',
      { cwd: this.repoPath }
    );

    const modified: string[] = [];
    const staged: string[] = [];
    const untracked: string[] = [];
    const conflicted: string[] = [];

    for (const line of statusOutput.split('\n')) {
      if (!line.trim()) continue;
      
      const status = line.slice(0, 2);
      const file = line.slice(3);

      if (status[0] === 'U' || status[1] === 'U' || status === 'AA' || status === 'DD') {
        conflicted.push(file);
      } else if (status[0] !== ' ' && status[0] !== '?') {
        staged.push(file);
      } else if (status[1] === 'M' || status[1] === 'D') {
        modified.push(file);
      } else if (status === '??') {
        untracked.push(file);
      }
    }

    return {
      branch,
      ahead,
      behind,
      modified,
      staged,
      untracked,
      conflicted,
    };
  }

  // Get commit history
  async getLog(maxCount: number = 20): Promise<GitCommit[]> {
    const format = '%H|%h|%an|%ae|%ad|%s';
    const { stdout } = await execAsync(
      `git log -${maxCount} --pretty=format:"${format}" --date=iso`,
      { cwd: this.repoPath }
    );

    const commits: GitCommit[] = [];

    for (const line of stdout.split('\n')) {
      const parts = line.split('|');
      if (parts.length >= 6) {
        commits.push({
          hash: parts[0],
          shortHash: parts[1],
          author: parts[2],
          email: parts[3],
          date: new Date(parts[4]),
          message: parts[5],
          files: [], // Would need separate call
        });
      }
    }

    return commits;
  }

  // Get diff
  async getDiff(options: {
    staged?: boolean;
    target?: string;
    source?: string;
  } = {}): Promise<GitDiff[]> {
    let command = 'git diff';
    
    if (options.staged) {
      command += ' --cached';
    }
    
    if (options.source && options.target) {
      command += ` ${options.source}..${options.target}`;
    } else if (options.target) {
      command += ` ${options.target}`;
    }

    command += ' --stat';

    const { stdout: statOutput } = await execAsync(command, { cwd: this.repoPath });
    
    // Parse stat
    const diffs: GitDiff[] = [];
    
    for (const line of statOutput.split('\n')) {
      const match = line.match(/(.+?)\s*\|\s*(\d+)\s*([\+\-]*)/);
      if (match) {
        const [, file, changes, signs] = match;
        diffs.push({
          file: file.trim(),
          status: signs.includes('=>') ? 'renamed' : 
                  signs.startsWith('D') ? 'deleted' :
                  signs.startsWith('A') ? 'added' : 'modified',
          additions: (signs.match(/\+/g) || []).length,
          deletions: (signs.match(/-/g) || []).length,
          patch: '', // Would need full diff
        });
      }
    }

    return diffs;
  }

  // Stage files
  async stage(files: string[]): Promise<void> {
    const fileList = files.map(f => `"${f}"`).join(' ');
    await execAsync(`git add ${fileList}`, { cwd: this.repoPath });
  }

  // Unstage files
  async unstage(files: string[]): Promise<void> {
    const fileList = files.map(f => `"${f}"`).join(' ');
    await execAsync(`git reset HEAD ${fileList}`, { cwd: this.repoPath });
  }

  // Commit
  async commit(message: string, options: {
    amend?: boolean;
    noEdit?: boolean;
  } = {}): Promise<void> {
    let command = 'git commit';
    
    if (options.amend) {
      command += ' --amend';
      if (options.noEdit) {
        command += ' --no-edit';
      } else {
        command += ` -m "${message}"`;
      }
    } else {
      command += ` -m "${message}"`;
    }

    await execAsync(command, { cwd: this.repoPath });
  }

  // Create branch
  async createBranch(name: string, base?: string): Promise<void> {
    let command = `git checkout -b ${name}`;
    if (base) {
      command += ` ${base}`;
    }
    await execAsync(command, { cwd: this.repoPath });
  }

  // Switch branch
  async switchBranch(name: string): Promise<void> {
    await execAsync(`git checkout ${name}`, { cwd: this.repoPath });
  }

  // Push
  async push(options: {
    remote?: string;
    branch?: string;
    force?: boolean;
    setUpstream?: boolean;
  } = {}): Promise<void> {
    let command = 'git push';
    
    if (options.force) {
      command += ' --force';
    }
    
    if (options.setUpstream) {
      command += ' -u';
    }
    
    if (options.remote) {
      command += ` ${options.remote}`;
      if (options.branch) {
        command += ` ${options.branch}`;
      }
    }

    await execAsync(command, { cwd: this.repoPath });
  }

  // Pull
  async pull(options: {
    rebase?: boolean;
    remote?: string;
    branch?: string;
  } = {}): Promise<void> {
    let command = 'git pull';
    
    if (options.rebase) {
      command += ' --rebase';
    }
    
    if (options.remote) {
      command += ` ${options.remote}`;
      if (options.branch) {
        command += ` ${options.branch}`;
      }
    }

    await execAsync(command, { cwd: this.repoPath });
  }

  // Get file blame
  async blame(filePath: string): Promise<Array<{
    line: number;
    commit: string;
    author: string;
    date: string;
    content: string;
  }>> {
    const { stdout } = await execAsync(
      `git blame --porcelain "${filePath}"`,
      { cwd: this.repoPath }
    );

    const lines: Array<{
      line: number;
      commit: string;
      author: string;
      date: string;
      content: string;
    }> = [];

    const blameLines = stdout.split('\n');
    let currentCommit = '';
    let currentAuthor = '';
    let currentDate = '';
    let lineNumber = 0;

    for (const line of blameLines) {
      if (line.startsWith('author ')) {
        currentAuthor = line.slice(7);
      } else if (line.startsWith('author-time ')) {
        const timestamp = parseInt(line.slice(12));
        currentDate = new Date(timestamp * 1000).toISOString();
      } else if (line.startsWith('\t')) {
        // Content line
        lineNumber++;
        lines.push({
          line: lineNumber,
          commit: currentCommit,
          author: currentAuthor,
          date: currentDate,
          content: line.slice(1),
        });
      } else if (/^[0-9a-f]{40}/.test(line)) {
        currentCommit = line.slice(0, 40);
      }
    }

    return lines;
  }

  // Interactive staging
  async interactiveStaging(): Promise<void> {
    const status = await this.getStatus();
    
    // This would integrate with the TUI to show files
    // and allow interactive selection
    console.log('Modified files:', status.modified);
    console.log('Use TUI to select files for staging');
  }

  // Smart commit message generation
  async generateCommitMessage(): Promise<string> {
    const status = await this.getStatus();
    const diff = await this.getDiff({ staged: true });
    
    // Simple heuristic for commit message
    const fileCount = diff.length;
    const action = status.staged.length > 0 ? 'Update' : 'Modify';
    
    if (fileCount === 1) {
      return `${action} ${diff[0].file}`;
    } else if (fileCount <= 3) {
      return `${action} ${diff.map(d => d.file).join(', ')}`;
    } else {
      return `${action} ${fileCount} files`;
    }
  }

  // Get PR info (requires GitHub CLI or API)
  async getPullRequest(number: number): Promise<PullRequest | null> {
    try {
      // Try using gh CLI
      const { stdout: prJson } = await execAsync(
        `gh pr view ${number} --json number,title,author,headRefName,baseRefName,body`,
        { cwd: this.repoPath }
      );
      
      const pr = JSON.parse(prJson);
      
      return {
        number: pr.number,
        title: pr.title,
        author: pr.author.login,
        branch: pr.headRefName,
        base: pr.baseRefName,
        description: pr.body,
        commits: [], // Would need separate API call
        files: [],
        comments: [],
      };
    } catch {
      return null;
    }
  }

  // Get stash list
  async getStashes(): Promise<Array<{
    index: number;
    message: string;
    hash: string;
  }>> {
    try {
      const { stdout } = await execAsync(
        'git stash list --format="%H|%gd|%s"',
        { cwd: this.repoPath }
      );

      return stdout.split('\n')
        .filter(Boolean)
        .map((line, index) => {
          const parts = line.split('|');
          return {
            index,
            hash: parts[0],
            message: parts[2] || '',
          };
        });
    } catch {
      return [];
    }
  }

  // Create stash
  async stash(message?: string): Promise<void> {
    let command = 'git stash push';
    if (message) {
      command += ` -m "${message}"`;
    }
    await execAsync(command, { cwd: this.repoPath });
  }

  // Apply stash
  async applyStash(index: number = 0): Promise<void> {
    await execAsync(`git stash apply stash@{${index}}`, { cwd: this.repoPath });
  }

  // Drop stash
  async dropStash(index: number): Promise<void> {
    await execAsync(`git stash drop stash@{${index}}`, { cwd: this.repoPath });
  }
}

export default GitIntegration;
