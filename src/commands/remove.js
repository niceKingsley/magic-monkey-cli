import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import pc from 'picocolors';
import { logger } from '../utils/logger.js';
import { findWorkspaceRoot, getProjects } from '../utils/project.js';

async function resolveTargetProject(projectName, projects) {
  if (projectName) {
    if (!projects.includes(projectName)) {
      logger.error(`未找到项目 "${projectName}"`);
      return null;
    }
    return projectName;
  }

  const response = await prompts(
    {
      type: 'select',
      name: 'project',
      message: '请选择要删除的项目:',
      choices: projects.map((p) => ({ title: p, value: p })),
    },
    {
      onCancel: () => {
        logger.info('操作已取消');
        process.exit(0);
      },
    }
  );

  return response.project || null;
}

async function confirmRemoval(targetProject) {
  const confirmRes = await prompts(
    {
      type: 'confirm',
      name: 'confirm',
      message: `${pc.red('危险操作!')} 确定要永久删除项目 [${pc.bold(targetProject)}] 吗？`,
      initial: false,
    },
    {
      onCancel: () => {
        logger.info('操作已取消');
        process.exit(0);
      },
    }
  );

  return Boolean(confirmRes.confirm);
}

function removeProjectFiles(workspaceRoot, targetProject) {
  const targetDir = path.join(workspaceRoot, 'packages', targetProject);
  const distFile = path.join(workspaceRoot, 'dist', `${targetProject}.user.js`);
  const distMeta = path.join(workspaceRoot, 'dist', `${targetProject}.meta.js`);
  const distDir = path.join(workspaceRoot, 'dist', targetProject);

  try {
    fs.rmSync(targetDir, { recursive: true, force: true });
    if (fs.existsSync(distFile)) fs.rmSync(distFile, { force: true });
    if (fs.existsSync(distMeta)) fs.rmSync(distMeta, { force: true });
    if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
    logger.success(`项目 [${targetProject}] 已成功删除！`);
  } catch (err) {
    logger.error(`删除失败: ${err.message}`);
  }
}

export async function removeCommand(projectName, options = {}) {
  const workspaceRoot = findWorkspaceRoot();
  const projects = getProjects(workspaceRoot);

  if (projects.length === 0) {
    logger.warn('packages 目录下暂无可删除的项目');
    return;
  }

  const targetProject = await resolveTargetProject(projectName, projects);
  if (!targetProject) return;

  if (!options.yes) {
    const isConfirmed = await confirmRemoval(targetProject);
    if (!isConfirmed) {
      logger.info('操作已取消');
      return;
    }
  }

  removeProjectFiles(workspaceRoot, targetProject);
}
