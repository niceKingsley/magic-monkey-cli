import { spawn } from 'node:child_process';
import prompts from 'prompts';
import pc from 'picocolors';
import { logger } from '../utils/logger.js';
import { findWorkspaceRoot, getProjects } from '../utils/project.js';

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

async function selectDevProject(projectName, projects) {
  if (projectName) {
    if (!projects.includes(projectName)) {
      logger.error(`未找到项目 "${projectName}"，可选项: ${projects.join(', ')}`);
      process.exit(1);
    }
    return projectName;
  }

  const response = await prompts(
    {
      type: 'autocomplete',
      name: 'project',
      message: '请选择要启动调试的项目 (支持输入搜索):',
      choices: projects.map((p) => ({ title: p, value: p })),
      suggest: (input, choices) =>
        Promise.resolve(choices.filter((c) => c.title.toLowerCase().includes(input.toLowerCase()))),
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

export async function devCommand(projectName) {
  const workspaceRoot = findWorkspaceRoot();
  const projects = getProjects(workspaceRoot);

  if (projects.length === 0) {
    logger.warn('packages 目录下暂无子项目，请先运行 magic create 创建');
    return;
  }

  const targetProject = await selectDevProject(projectName, projects);
  if (!targetProject) process.exit(0);

  console.log(`\n> 正在启动开发服务器: ${pc.bold(pc.cyan(targetProject))}\n`);

  const child = spawn(`${pnpmCmd} --filter ${targetProject} dev`, {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) logger.error(`项目异常退出，错误码: ${code}`);
  });

  process.on('SIGINT', () => {
    child.kill();
    process.exit();
  });
}
