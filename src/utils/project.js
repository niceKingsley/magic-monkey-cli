import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export function hasWorkspaceRoot(startDir = process.cwd()) {
  let curr = startDir;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'pnpm-workspace.yaml'))) {
      return true;
    }
    curr = path.dirname(curr);
  }
  return false;
}

export function findWorkspaceRoot(startDir = process.cwd()) {
  let curr = startDir;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'pnpm-workspace.yaml'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return startDir;
}

export function getProjects(workspaceRoot) {
  const packagesDir = path.join(workspaceRoot, 'packages');
  if (!fs.existsSync(packagesDir)) return [];

  return fs.readdirSync(packagesDir).filter((file) => {
    const fullPath = path.join(packagesDir, file);
    if (!fs.statSync(fullPath).isDirectory()) return false;
    if (file === 'cli' || file === 'magic-monkey-cli') return false;
    return fs.existsSync(path.join(fullPath, 'package.json'));
  });
}

export function getGitUser() {
  try {
    return execSync('git config user.name', { encoding: 'utf-8' }).trim() || '';
  } catch {
    return '';
  }
}
