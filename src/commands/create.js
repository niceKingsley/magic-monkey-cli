import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import pc from 'picocolors';
import { logger } from '../utils/logger.js';
import { findWorkspaceRoot, getGitUser, hasWorkspaceRoot } from '../utils/project.js';
import { initCommand } from './init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, '../templates');
const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'));

function buildQuestions(projectName, options) {
  const questions = [];

  if (!projectName) {
    questions.push({
      type: 'text',
      name: 'name',
      message: '请输入子项目名称:',
      validate: (val) => (val && val.trim() ? true : '名称不能为空'),
    });
  }

  if (!options.description) {
    questions.push({
      type: 'text',
      name: 'description',
      message: '请输入项目描述:',
      initial: '',
    });
  }

  if (!options.framework) {
    questions.push({
      type: 'select',
      name: 'framework',
      message: '请选择技术栈:',
      choices: [
        { title: pc.green('Vue 3 (推荐)'), value: 'vue' },
        { title: pc.yellow('Vanilla JS'), value: 'vanilla' },
      ],
      initial: 0,
    });
  }

  return questions;
}

async function resolveProjectMeta(projectName, options) {
  const questions = buildQuestions(projectName, options);
  const answers =
    questions.length > 0
      ? await prompts(questions, {
        onCancel: () => {
          logger.info('操作已取消');
          process.exit(0);
        },
      })
      : {};

  if (!projectName && !answers.name) {
    logger.info('操作已取消');
    process.exit(0);
  }

  const name = (projectName || answers.name)?.trim();
  const description = options.description || answers.description || '';
  const framework = options.framework || answers.framework || 'vue';

  return { name, description, framework };
}

function renderTemplate(srcDir, destDir, variables) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const fileName = entry.name === '_gitignore' ? '.gitignore' : entry.name;
    const destPath = path.join(destDir, fileName);

    if (entry.isDirectory()) {
      renderTemplate(srcPath, destPath, variables);
    } else {
      let content = fs.readFileSync(srcPath, 'utf-8');
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        content = content.replace(regex, value);
      }
      fs.writeFileSync(destPath, content, 'utf-8');
    }
  }
}

function validateProjectConfig(projectDir, name, templateSrc, framework) {
  if (fs.existsSync(projectDir)) {
    logger.error(`项目 ${pc.bold(name)} 已存在于 packages 目录下！`);
    return false;
  }
  if (!fs.existsSync(templateSrc)) {
    logger.error(`找不到技术栈模板: ${framework}`);
    return false;
  }
  return true;
}

function ensureWorkspaceConfig(workspaceRoot) {
  const wsPath = path.join(workspaceRoot, 'pnpm-workspace.yaml');
  if (fs.existsSync(wsPath)) {
    let content = fs.readFileSync(wsPath, 'utf-8');
    let modified = false;

    if (!content.includes('onlyBuiltDependencies')) {
      content = content.trimEnd() + '\n\nonlyBuiltDependencies:\n  - esbuild\n';
      modified = true;
    }
    if (!content.includes('allowBuilds')) {
      content = content.trimEnd() + '\n\nallowBuilds:\n  esbuild: true\n';
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(wsPath, content, 'utf-8');
    }
  }
}

function installDependencies(workspaceRoot, name) {
  ensureWorkspaceConfig(workspaceRoot);
  console.log('\n📦 正在自动安装并链接 workspace 依赖...');
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  try {
    execSync(`${pnpmCmd} install`, { cwd: workspaceRoot, stdio: 'inherit' });
  } catch {
    try {
      execSync(`${pnpmCmd} approve-builds --all`, { cwd: workspaceRoot, stdio: 'inherit' });
      execSync(`${pnpmCmd} install`, { cwd: workspaceRoot, stdio: 'inherit' });
    } catch {
      logger.warn('依赖自动安装遇到问题，请手动执行 pnpm install');
      return;
    }
  }

  console.log(`\n🎉 子项目 ${pc.bold(pc.green(name))} 已经就绪！`);
  console.log(`\n👉 启动开发调试: ${pc.cyan(`magic dev ${name}`)}\n`);
}


export async function createCommand(projectName, options = {}) {
  if (!hasWorkspaceRoot()) {
    logger.warn('当前目录或父级目录未检测到 pnpm-workspace.yaml 工作区。');
    const answer = await prompts(
      {
        type: 'confirm',
        name: 'initMonorepo',
        message: '是否要初始化一个全新的油猴 Monorepo 大仓？',
        initial: true,
      },
      {
        onCancel: () => {
          logger.info('操作已取消');
          process.exit(0);
        },
      }
    );
    if (answer.initMonorepo) {
      await initCommand(projectName, options);
      return;
    }
  }

  const meta = await resolveProjectMeta(projectName, options);
  if (!meta.name) return;

  const workspaceRoot = findWorkspaceRoot();
  const projectDir = path.join(workspaceRoot, 'packages', meta.name);
  const templateSrc = path.join(templatesDir, meta.framework);

  if (!validateProjectConfig(projectDir, meta.name, templateSrc, meta.framework)) {
    process.exit(1);
  }

  const spinner = ora(`正在从 ${pc.cyan(meta.framework)} 模板生成项目结构...`).start();

  try {
    renderTemplate(templateSrc, projectDir, {
      NAME: meta.name,
      DESCRIPTION: meta.description,
      AUTHOR: getGitUser(),
      CLI_VERSION: pkg.version,
    });
    spinner.succeed(`项目模板 ${pc.bold(pc.green(meta.name))} 生成成功！`);
  } catch (err) {
    spinner.fail(`生成失败: ${err.message}`);
    process.exit(1);
  }

  installDependencies(workspaceRoot, meta.name);
}
