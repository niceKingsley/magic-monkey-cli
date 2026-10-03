import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import pc from 'picocolors';
import { logger } from '../utils/logger.js';
import { getGitUser } from '../utils/project.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, '../templates');
const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'));

export function renderTemplate(srcDir, destDir, variables) {
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

async function resolveInitMeta(projectName, options) {
  const questions = [];

  if (!projectName) {
    questions.push({
      type: 'text',
      name: 'name',
      message: '请输入 Monorepo 大仓项目名称:',
      initial: 'magic-monkey-workspace',
      validate: (val) => (val && val.trim() ? true : '项目名称不能为空'),
    });
  }

  if (!options.description) {
    questions.push({
      type: 'text',
      name: 'description',
      message: '请输入大仓项目描述:',
      initial: '油猴脚本 Monorepo 大仓',
    });
  }

  if (!options.framework) {
    questions.push({
      type: 'select',
      name: 'sampleFramework',
      message: '是否预置第一个示例油猴脚本？',
      choices: [
        { title: pc.green('Vue 3 脚本 (推荐)'), value: 'vue' },
        { title: pc.yellow('Vanilla 原生 JS 脚本'), value: 'vanilla' },
        { title: pc.gray('暂不创建 (仅初始化大仓骨架)'), value: 'none' },
      ],
      initial: 0,
    });
  }

  if (options.eslint === undefined) {
    questions.push({
      type: 'confirm',
      name: 'eslint',
      message: '是否集成 ESLint 代码规范校验？',
      initial: false,
    });
  }

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
  const description = options.description || answers.description;
  const sampleFramework = options.framework || answers.sampleFramework || 'none';
  const eslint = options.eslint !== undefined ? Boolean(options.eslint) : Boolean(answers.eslint);

  let sampleName = 'demo-script';
  if (sampleFramework !== 'none') {
    const sampleAnswer = await prompts(
      {
        type: 'text',
        name: 'sampleName',
        message: '请输入示例脚本名称:',
        initial: `demo-${sampleFramework}-script`,
        validate: (val) => (val && val.trim() ? true : '脚本名称不能为空'),
      },
      {
        onCancel: () => {
          logger.info('操作已取消');
          process.exit(0);
        },
      }
    );
    sampleName = sampleAnswer.sampleName?.trim() || `demo-${sampleFramework}-script`;
  }

  return { name, description, sampleFramework, sampleName, eslint };
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

function installDependencies(projectDir) {
  ensureWorkspaceConfig(projectDir);
  console.log('\n📦 正在自动执行 pnpm install 安装并建立 Workspace 依赖软链...');
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  try {
    execSync(`${pnpmCmd} install`, { cwd: projectDir, stdio: 'inherit' });
    return true;
  } catch {
    try {
      execSync(`${pnpmCmd} approve-builds --all`, { cwd: projectDir, stdio: 'inherit' });
      execSync(`${pnpmCmd} install`, { cwd: projectDir, stdio: 'inherit' });
      return true;
    } catch {
      logger.warn('依赖自动安装遇到问题，可能需要检查网络或手动执行 pnpm install');
      return false;
    }
  }
}

const PRETTIER_CONFIG_CONTENT = `{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
`;

const GM_GLOBALS_CONFIG = `        unsafeWindow: 'readonly',
        monkeyWindow: 'readonly',
        GM: 'readonly',
        GM_info: 'readonly',
        GM_addStyle: 'readonly',
        GM_addElement: 'readonly',
        GM_getValue: 'readonly',
        GM_setValue: 'readonly',
        GM_deleteValue: 'readonly',
        GM_listValues: 'readonly',
        GM_addValueChangeListener: 'readonly',
        GM_removeValueChangeListener: 'readonly',
        GM_getResourceText: 'readonly',
        GM_getResourceURL: 'readonly',
        GM_registerMenuCommand: 'readonly',
        GM_unregisterMenuCommand: 'readonly',
        GM_openInTab: 'readonly',
        GM_xmlhttpRequest: 'readonly',
        GM_download: 'readonly',
        GM_getTab: 'readonly',
        GM_saveTab: 'readonly',
        GM_getTabs: 'readonly',
        GM_notification: 'readonly',
        GM_setClipboard: 'readonly',
        GM_cookie: 'readonly',
        GM_webRequest: 'readonly',
        GM_log: 'readonly',`;

export function getEslintConfig(isVue = false) {
  if (isVue) {
    return `import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
${GM_GLOBALS_CONFIG}
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.min.js'],
  },
];
`;
  }

  return `import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
${GM_GLOBALS_CONFIG}
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.min.js'],
  },
];
`;
}

export async function initCommand(projectName, options = {}) {
  const meta = await resolveInitMeta(projectName, options);
  if (!meta.name) return;

  const targetDir = path.resolve(process.cwd(), meta.name);

  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      const confirm = await prompts(
        {
          type: 'confirm',
          name: 'overwrite',
          message: `目标目录 ${pc.bold(meta.name)} 非空，是否继续？`,
          initial: false,
        },
        {
          onCancel: () => {
            logger.info('操作已取消');
            process.exit(0);
          },
        }
      );
      if (!confirm.overwrite) {
        logger.info('操作已取消');
        return;
      }
    }
  }

  const spinner = ora(`正在生成 Monorepo 大仓脚手架: ${pc.cyan(meta.name)}...`).start();

  try {
    const monorepoTpl = path.join(templatesDir, 'monorepo');
    renderTemplate(monorepoTpl, targetDir, {
      NAME: meta.name,
      DESCRIPTION: meta.description,
      CLI_VERSION: pkg.version,
    });
    fs.mkdirSync(path.join(targetDir, 'packages'), { recursive: true });

    if (meta.sampleFramework && meta.sampleFramework !== 'none') {
      const sampleTpl = path.join(templatesDir, meta.sampleFramework);
      const sampleDest = path.join(targetDir, 'packages', meta.sampleName);
      renderTemplate(sampleTpl, sampleDest, {
        NAME: meta.sampleName,
        DESCRIPTION: `${meta.name} 示例油猴脚本 (${meta.sampleFramework})`,
        AUTHOR: getGitUser(),
        CLI_VERSION: pkg.version,
      });
    }

    if (meta.eslint) {
      const isVue = meta.sampleFramework === 'vue';
      fs.writeFileSync(path.join(targetDir, 'eslint.config.js'), getEslintConfig(isVue), 'utf-8');
      fs.writeFileSync(path.join(targetDir, '.prettierrc'), PRETTIER_CONFIG_CONTENT, 'utf-8');
      const rootPkgPath = path.join(targetDir, 'package.json');
      if (fs.existsSync(rootPkgPath)) {
        const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
        rootPkg.scripts = {
          ...rootPkg.scripts,
          lint: 'eslint .',
          'lint:fix': 'eslint . --fix',
          format: 'prettier --write .',
        };
        rootPkg.devDependencies = {
          ...rootPkg.devDependencies,
          eslint: '^10.11.0',
          '@eslint/js': '^10.0.1',
          'eslint-config-prettier': '^10.1.8',
          prettier: '^3.5.2',
          globals: '^15.15.0',
          ...(isVue ? { 'eslint-plugin-vue': '^10.11.1' } : {}),
        };
        fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf-8');
      }
    }

    spinner.succeed(`🎉 Monorepo 大仓 ${pc.bold(pc.green(meta.name))} 初始化成功！`);
  } catch (err) {
    spinner.fail(`初始化失败: ${err.message}`);
    process.exit(1);
  }

  installDependencies(targetDir);

  console.log(`
${pc.bold(pc.green('========================================='))}
  ${pc.bold('🚀 油猴 Monorepo 大仓创建完成！')}
${pc.bold(pc.green('========================================='))}

👉 快速上手:
  ${pc.cyan(`cd ${meta.name}`)}
  ${pc.cyan(`magic dev`)}      ${pc.gray('# 启动脚本本地开发与 HMR')}
  ${pc.cyan(`magic create`)}   ${pc.gray('# 在 packages/ 下创建更多油猴脚本')}
  ${pc.cyan(`magic build -a`)}  ${pc.gray('# 全量编译所有脚本产物至 dist/')}${meta.eslint ? `\n  ${pc.cyan(`pnpm lint`)}     ${pc.gray('# 执行 ESLint 语法与规范检查')}` : ''}
`);
}
