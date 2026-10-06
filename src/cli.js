import fs from 'node:fs';
import { Command } from 'commander';
import { printBanner } from './utils/banner.js';
import { initCommand } from './commands/init.js';
import { createCommand } from './commands/create.js';
import { devCommand } from './commands/dev.js';
import { buildCommand } from './commands/build.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { doctorCommand } from './commands/doctor.js';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const program = new Command();

program
  .name('magic')
  .description('Magic CLI - 油猴脚本 Monorepo 开发与构建脚手架')
  .version(pkg.version, '-v, --version', '查看当前 CLI 版本');

program
  .command('init [projectName]')
  .alias('new')
  .description('初始化全新的油猴脚本 Monorepo 大仓工程')
  .option('-f, --framework <framework>', '预置示例技术栈: vue | vanilla | none')
  .option('-d, --description <description>', '大仓项目描述')
  .option('--eslint', '集成 ESLint 代码规范校验')
  .option('--no-eslint', '跳过 ESLint 配置')
  .action(initCommand);

program
  .command('generate [projectName]')
  .aliases(['gen', 'create'])
  .description('创建新的油猴脚本子项目 (Vue / Vanilla)')
  .option('-f, --framework <framework>', '技术栈: vue | vanilla')
  .option('-d, --description <description>', '项目描述')
  .action(createCommand);

program
  .command('dev [projectName]')
  .description('启动子项目本地开发与热重载服务器')
  .action(devCommand);

program
  .command('build [projectName]')
  .description('打包构建子项目生产产物')
  .option('-a, --all', '全量并发打包所有子项目')
  .action(buildCommand);

program
  .command('remove [projectName]')
  .alias('rm')
  .description('安全删除指定子项目及产物')
  .option('-y, --yes', '跳过确认提示直接强制删除')
  .action(removeCommand);

program
  .command('list')
  .alias('ls')
  .description('列出当前所有子项目状态与技术栈')
  .action(listCommand);

program
  .command('doctor')
  .description('体检并自动修复当前 Monorepo 项目配置（ESLint、依赖、Workspace 等）')
  .option('--no-fix', '仅执行健康检查，不自动修改文件')
  .action(doctorCommand);

if (process.argv.length <= 2) {
  printBanner();
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);
