import { defineConfig as viteDefineConfig } from 'vite';
import monkeyPlugin, { cdn, util } from 'vite-plugin-monkey';
import path from 'node:path';
import fs from 'node:fs';
import { findWorkspaceRoot } from './utils/project.js';

export { cdn, util };

function resolveConfig(config = {}) {
  const projectDir = process.cwd();
  const workspaceRoot = findWorkspaceRoot(projectDir);
  const outDir = path.resolve(workspaceRoot, 'dist');

  const {
    plugins: userPlugins = [],
    resolve: userResolve = {},
    server: userServer = {},
    build: userBuild = {},
    ...rest
  } = config;

  return {
    server: {
      port: 5177,
      host: '127.0.0.1',
      hmr: {
        host: '127.0.0.1',
      },
      ...userServer,
    },
    resolve: {
      ...userResolve,
      alias: {
        '@': path.resolve(projectDir, 'src'),
        '@shared/components': path.resolve(workspaceRoot, 'shared/components'),
        '@shared/utils': path.resolve(workspaceRoot, 'shared/utils'),
        '@shared': path.resolve(workspaceRoot, 'shared'),
        ...(userResolve.alias || {}),
      },
    },
    build: {
      outDir,
      emptyOutDir: false,
      ...userBuild,
    },
    plugins: [...userPlugins],
    ...rest,
  };
}

export function defineConfig(config) {
  if (typeof config === 'function') {
    return viteDefineConfig((env) => resolveConfig(config(env)));
  }
  return viteDefineConfig(resolveConfig(config));
}

export function monkey(config = {}) {
  const projectDir = process.cwd();
  const pkgPath = path.join(projectDir, 'package.json');
  let pkg = {};
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    } catch (err) {
      void err;
    }
  }

  const monkeyFunc =
    typeof monkeyPlugin === 'function' ? monkeyPlugin : monkeyPlugin.default || monkeyPlugin;

  const defaultUserscript = {
    name: pkg.name || path.basename(projectDir),
    version: pkg.version || '0.0.1',
    description: pkg.description || '',
    author: pkg.author || '',
    'run-at': 'document-start',
    match: ['*://*/*'],
  };

  const mergedUserscript = {
    ...defaultUserscript,
    ...(config.userscript || {}),
  };

  const defaultEntry = 'main.js';

  return monkeyFunc({
    entry: config.entry || defaultEntry,
    server: { mountGmApi: true, open: false },
    ...config,
    userscript: mergedUserscript,
  });
}
