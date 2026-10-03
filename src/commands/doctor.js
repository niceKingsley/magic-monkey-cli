import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import { logger } from '../utils/logger.js';
import { findWorkspaceRoot, hasWorkspaceRoot, getProjects } from '../utils/project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.resolve(__dirname, '../templates');

function findEslintConfig(workspaceRoot) {
  const candidates = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs'];
  for (const name of candidates) {
    const fullPath = path.join(workspaceRoot, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

function extractCatalogsBlock(yamlContent) {
  const lines = yamlContent.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith('catalogs:'));
  if (start === -1) return '';

  const block = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() && !/^\s/.test(line)) break;
    block.push(line);
  }
  return block.join('\n').trim();
}

function ensureEsbuildPermissions(content, fix, issues, fixes) {
  let updated = content;
  let modified = false;

  if (!updated.includes('onlyBuiltDependencies')) {
    issues.push('未配置 onlyBuiltDependencies (esbuild 自动构建授权)');
    if (fix) {
      updated = updated.trimEnd() + '\n\nonlyBuiltDependencies:\n  - esbuild\n';
      modified = true;
      fixes.push('已补充 onlyBuiltDependencies (esbuild)');
    }
  }

  if (!updated.includes('allowBuilds')) {
    issues.push('未配置 allowBuilds (esbuild 授权)');
    if (fix) {
      updated = updated.trimEnd() + '\n\nallowBuilds:\n  esbuild: true\n';
      modified = true;
      fixes.push('已补充 allowBuilds (esbuild)');
    }
  }

  return { content: updated, modified };
}

function syncVueCatalogs(content, fix, issues, fixes) {
  const templateWs = path.join(templatesDir, 'monorepo', 'pnpm-workspace.yaml');
  if (!fs.existsSync(templateWs)) return { content, modified: false };

  const catalogBlock = extractCatalogsBlock(fs.readFileSync(templateWs, 'utf-8'));
  if (!catalogBlock) return { content, modified: false };

  issues.push('检测到 Vue 子项目，但根目录未配置 catalogs.vue');
  if (!fix) return { content, modified: false };

  fixes.push('已同步模板 catalogs.vue 配置');
  return {
    content: content.trimEnd() + '\n\n' + catalogBlock + '\n',
    modified: true,
  };
}

function checkWorkspaceYaml(workspaceRoot, hasVueProjects, fix) {
  const wsPath = path.join(workspaceRoot, 'pnpm-workspace.yaml');
  if (!fs.existsSync(wsPath)) {
    return { status: 'error', message: '未找到 pnpm-workspace.yaml 文件' };
  }

  let content = fs.readFileSync(wsPath, 'utf-8');
  let modified = false;
  const issues = [];
  const fixes = [];

  const esbuildRes = ensureEsbuildPermissions(content, fix, issues, fixes);
  content = esbuildRes.content;
  modified = modified || esbuildRes.modified;

  const needsCatalogs = hasVueProjects && !content.includes('catalogs:') && !content.includes('catalog:');
  if (needsCatalogs) {
    const catalogRes = syncVueCatalogs(content, fix, issues, fixes);
    content = catalogRes.content;
    modified = modified || catalogRes.modified;
  }

  if (modified) {
    fs.writeFileSync(wsPath, content, 'utf-8');
  }

  if (fixes.length > 0) return { status: 'fixed', message: `pnpm-workspace.yaml: ${fixes.join('、')}` };
  if (issues.length > 0) return { status: 'warn', message: `pnpm-workspace.yaml: ${issues.join('、')}` };
  return { status: 'ok', message: 'pnpm-workspace.yaml 配置正常' };
}

function fixMonkeyGlobals(content) {
  let updated = content;
  if (!updated.includes("from 'magic-monkey-cli'")) {
    updated = "import { monkeyGlobals } from 'magic-monkey-cli';\n" + updated;
  }
  if (updated.includes('globals: {')) {
    updated = updated.replace('globals: {', 'globals: {\n        ...monkeyGlobals,');
  }
  return updated;
}

function fixVueEslintRules(content) {
  let updated = "import pluginVue from 'eslint-plugin-vue';\n" + content;
  const vueRule = "...pluginVue.configs['flat/recommended'],";

  if (updated.includes('js.configs.recommended,')) {
    updated = updated.replace('js.configs.recommended,', `js.configs.recommended,\n  ${vueRule}`);
  } else if (updated.includes('export default [')) {
    updated = updated.replace('export default [', `export default [\n  ${vueRule}`);
  }

  if (updated.includes('rules:') && !updated.includes('vue/multi-word-component-names')) {
    updated = updated.replace('rules: {', "rules: {\n      'vue/multi-word-component-names': 'off',");
  }

  return updated;
}

function ensureRootVueDep(workspaceRoot) {
  const rootPkgPath = path.join(workspaceRoot, 'package.json');
  if (!fs.existsSync(rootPkgPath)) return;

  try {
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
    if (!rootPkg.devDependencies?.['eslint-plugin-vue']) {
      rootPkg.devDependencies = {
        ...(rootPkg.devDependencies || {}),
        'eslint-plugin-vue': '^10.11.1',
      };
      fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf-8');
    }
  } catch {
    // ignore
  }
}

export function checkEslintConfig(workspaceRoot, hasVueProjects, fix) {
  const eslintPath = findEslintConfig(workspaceRoot);
  if (!eslintPath) {
    return { status: 'info', message: '未集成 ESLint 配置文件 (可选)' };
  }

  let content = fs.readFileSync(eslintPath, 'utf-8');
  let modified = false;
  const fixes = [];
  const issues = [];

  const missingGlobals = !content.includes('monkeyGlobals');
  if (missingGlobals) {
    issues.push('未引入脚手架标准 monkeyGlobals 全局变量配置');
    if (fix) {
      content = fixMonkeyGlobals(content);
      modified = true;
      fixes.push('已引入 monkeyGlobals 标准油猴全局变量');
    }
  }

  const missingVue = hasVueProjects && !content.includes('eslint-plugin-vue');
  if (missingVue) {
    issues.push('存在 Vue 子项目，但 ESLint 未集成 eslint-plugin-vue');
    if (fix) {
      content = fixVueEslintRules(content);
      ensureRootVueDep(workspaceRoot);
      modified = true;
      fixes.push('已补充 Vue 语法规范校验与插件');
    }
  }

  if (modified) {
    fs.writeFileSync(eslintPath, content, 'utf-8');
  }

  const filename = path.basename(eslintPath);
  if (fixes.length > 0) return { status: 'fixed', message: `${filename}: ${fixes.join('；')}` };
  if (issues.length > 0) return { status: 'warn', message: `${filename}: ${issues.join('；')}` };
  return { status: 'ok', message: `${filename} 规范与全局变量配置完备` };
}

function checkSubprojects(workspaceRoot, projects, fix) {
  const packagesDir = path.join(workspaceRoot, 'packages');
  const details = [];

  for (const name of projects) {
    const pkgPath = path.join(packagesDir, name, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    try {
      let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      let modified = false;
      const redundant = [];

      // 检查子包是否冗余引入了根目录 CLI 或 Vite
      if (pkg.devDependencies?.['magic-monkey-cli'] || pkg.dependencies?.['magic-monkey-cli']) {
        redundant.push('magic-monkey-cli');
        if (fix) {
          delete pkg.devDependencies?.['magic-monkey-cli'];
          delete pkg.dependencies?.['magic-monkey-cli'];
          modified = true;
        }
      }
      if (pkg.devDependencies?.vite || pkg.dependencies?.vite) {
        redundant.push('vite');
        if (fix) {
          delete pkg.devDependencies?.vite;
          delete pkg.dependencies?.vite;
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
      }

      const isVue = Boolean(
        pkg.dependencies?.vue ||
          pkg.devDependencies?.vue ||
          pkg.dependencies?.['@vitejs/plugin-vue'] ||
          pkg.devDependencies?.['@vitejs/plugin-vue'],
      );

      details.push({
        name,
        framework: isVue ? 'Vue' : 'Vanilla',
        redundant,
        cleaned: modified,
      });
    } catch {
      // ignore
    }
  }

  return details;
}

function checkSharedModules(workspaceRoot) {
  const sharedDir = path.join(workspaceRoot, 'shared');
  if (!fs.existsSync(sharedDir)) {
    return { status: 'warn', message: '未找到 shared/ 跨包共享目录' };
  }

  const hasComponents = fs.existsSync(path.join(sharedDir, 'components'));
  const hasUtils = fs.existsSync(path.join(sharedDir, 'utils'));

  if (hasComponents && hasUtils) {
    return { status: 'ok', message: '@shared/components 与 @shared/utils 共享包状态正常' };
  }
  return { status: 'info', message: 'shared/ 目录已就绪' };
}

export function doctorCommand(options = {}) {
  const shouldFix = options.fix !== false;

  console.log(pc.bold(pc.cyan('\n🩺 正在对当前 Monorepo 项目进行健康体检...\n')));

  if (!hasWorkspaceRoot()) {
    logger.error('当前目录或父级目录未检测到 pnpm-workspace.yaml 工作区根目录！');
    process.exit(1);
  }

  const workspaceRoot = findWorkspaceRoot();
  const projects = getProjects(workspaceRoot);

  // 检测是否存在 Vue 项目
  const packagesDir = path.join(workspaceRoot, 'packages');
  const hasVueProjects = projects.some((name) => {
    const pkgPath = path.join(packagesDir, name, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const text = fs.readFileSync(pkgPath, 'utf-8');
      return text.includes('vue');
    }
    return false;
  });

  // 1. 检查 workspace.yaml
  const wsResult = checkWorkspaceYaml(workspaceRoot, hasVueProjects, shouldFix);
  printResult(wsResult);

  // 2. 检查 ESLint
  const eslintResult = checkEslintConfig(workspaceRoot, hasVueProjects, shouldFix);
  printResult(eslintResult);

  // 3. 检查 Shared 模块
  const sharedResult = checkSharedModules(workspaceRoot);
  printResult(sharedResult);

  // 4. 检查子项目结构与冗余依赖
  const subprojectDetails = checkSubprojects(workspaceRoot, projects, shouldFix);
  if (subprojectDetails.length > 0) {
    console.log(
      `  ${pc.green('✔')} 子项目列表: 检测到 ${pc.bold(projects.length)} 个脚本 (${subprojectDetails
        .map((p) => `${p.name} [${p.framework}]`)
        .join(', ')})`,
    );

    subprojectDetails.forEach((p) => {
      if (p.redundant.length > 0) {
        if (p.cleaned) {
          console.log(
            `    ${pc.cyan('↳')} ${pc.dim(p.name)}: 已自动清理冗余根依赖 [${p.redundant.join(', ')}]，统一复用大仓`,
          );
        } else {
          console.log(
            `    ${pc.yellow('↳')} ${pc.dim(p.name)}: 声明了冗余根依赖 [${p.redundant.join(', ')}]，建议清理`,
          );
        }
      }
    });
  } else {
    console.log(`  ${pc.yellow('ℹ')} 子项目列表: 当前暂无子项目，可运行 ${pc.cyan('magic create')} 创建`);
  }

  console.log(pc.bold(pc.green('\n🎉 体检完成！项目配置处于健康状态。\n')));
}

function printResult(result) {
  if (result.status === 'ok') {
    console.log(`  ${pc.green('✔')} ${result.message}`);
  } else if (result.status === 'fixed') {
    console.log(`  ${pc.green('✔')} ${pc.green(result.message)}`);
  } else if (result.status === 'warn') {
    console.log(`  ${pc.yellow('⚠')} ${result.message}`);
  } else if (result.status === 'info') {
    console.log(`  ${pc.dim('ℹ')} ${result.message}`);
  } else if (result.status === 'error') {
    console.log(`  ${pc.red('✖')} ${result.message}`);
  }
}
