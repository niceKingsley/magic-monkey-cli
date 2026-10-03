import { spawn } from 'node:child_process';
import prompts from 'prompts';
import pc from 'picocolors';
import { logger } from '../utils/logger.js';
import { findWorkspaceRoot, getProjects } from '../utils/project.js';

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

async function selectBuildProject(projectName, projects) {
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
      message: '请选择要打包的项目 (支持输入搜索):',
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

function buildSingleProject(targetProject, workspaceRoot) {
  console.log(`\n> 正在打包: ${pc.bold(pc.green(targetProject))}\n`);

  const child = spawn(`${pnpmCmd} --filter ${targetProject} build`, {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => {
    if (code === 0) {
      logger.success(`项目 ${targetProject} 打包完成！产物位于 dist/`);
    } else {
      logger.error(`打包失败，退出码: ${code}`);
    }
  });
}

export async function buildCommand(projectName, options = {}) {
  const workspaceRoot = findWorkspaceRoot();
  const projects = getProjects(workspaceRoot);

  if (options.all) {
    console.log(`\n🚀 正在全量并发打包所有子项目...\n`);
    spawn(`${pnpmCmd} -r --filter "./packages/*" build`, {
      cwd: workspaceRoot,
      stdio: 'inherit',
      shell: true,
    });
    return;
  }

  if (projects.length === 0) {
    logger.warn('packages 目录下暂无子项目！');
    return;
  }

  const targetProject = await selectBuildProject(projectName, projects);
  if (!targetProject) process.exit(0);

  buildSingleProject(targetProject, workspaceRoot);
}
