import pc from 'picocolors';

export const logger = {
  info: (msg) => console.log(pc.cyan('ℹ ') + msg),
  success: (msg) => console.log(pc.green('✔ ') + pc.bold(msg)),
  warn: (msg) => console.log(pc.yellow('⚠ ') + msg),
  error: (msg) => console.log(pc.red('✖ ') + pc.bold(msg)),
  title: (msg) => console.log('\n' + pc.bold(pc.magenta(msg)) + '\n'),
};
