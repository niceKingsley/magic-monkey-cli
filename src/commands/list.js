import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { logger } from '../utils/logger.js';
import { findWorkspaceRoot, getProjects } from '../utils/project.js';

function getProjectInfo(packagesDir, name) {
  const pkgPath = path.join(packagesDir, name, 'package.json');
  let desc = '';
  let version = '0.0.1';
  let framework = 'Vanilla';

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      desc = pkg.description || '';
      version = pkg.version || '0.0.1';
      if (pkg.dependencies?.vue || pkg.devDependencies?.vue) framework = 'Vue';
    } catch (err) {
      void err;
    }
  }

  return { version, desc, framework };
}

function getBadge(framework) {
  if (framework === 'Vue') return pc.green('[Vue]');
  return pc.yellow('[Vanilla]');
}

export function listCommand() {
  const workspaceRoot = findWorkspaceRoot();
  const packagesDir = path.join(workspaceRoot, 'packages');
  const projects = getProjects(workspaceRoot);

  if (projects.length === 0) {
    logger.warn('当前仓库没有任何子项目，可运行 magic gen 创建！');
    return;
  }

  console.log(pc.bold(pc.cyan('\n📦 当前 Monorepo 包含的子项目列表:\n')));

  projects.forEach((name, idx) => {
    const { version, desc, framework } = getProjectInfo(packagesDir, name);
    const badge = getBadge(framework);

    console.log(
      `  ${pc.dim(idx + 1 + '.')} ${pc.bold(name.padEnd(24))} ${badge.padEnd(16)} ${pc.dim('v' + version.padEnd(8))} ${pc.dim(desc)}`,
    );
  });

  console.log('');
}
