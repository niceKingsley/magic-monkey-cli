# magic-monkey-cli

油猴脚本 Monorepo 多包开发与构建脚手架。

## 特性

- **多包统一管理**：统一管理多个油猴脚本，支持跨项目共享公共组件与工具函数。
- **开箱即用模板**：预置 Vue 3 与原生 JavaScript 模板，内置路径别名与依赖优化。
- **完整 CLI 工作流**：覆盖初始化、创建子项目、本地开发调试、单包/全量打包构建。
- **现代规范支持**：可选集成 ESLint + Prettier，预置油猴专属 GM API 全局变量规范。

## 快速上手

### 1. 初始化大仓

```bash
# 免安装一键初始化
npx magic-monkey-cli init my-workspace

# 或全局安装 CLI 使用
npm install -g magic-monkey-cli
magic init my-workspace
```

### 2. 本地开发

```bash
cd my-workspace
magic dev
```

### 3. 创建更多子项目

```bash
magic gen my-new-script
# 或在大仓内直接通过包管理器运行
pnpm gen my-new-script
```

### 4. 打包构建

```bash
# 打包单个脚本
magic build my-new-script

# 全量打包所有脚本
magic build --all
```

## CLI 命令

| 命令 | 别名 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `magic init [name]` | `magic new` | 初始化全新的 Monorepo 大仓 | `magic init my-workspace` |
| `magic generate [name]` | `magic gen`, `magic create` | 创建新的油猴脚本子项目 | `magic gen my-script -f vue` |
| `magic dev [name]` | - | 启动子项目本地开发服务器与 HMR | `magic dev my-script` |
| `magic build [name]` | - | 打包构建子项目（`-a` 或 `--all` 全量打包） | `magic build my-script` |
| `magic list` | `magic ls` | 列出所有子项目状态与技术栈 | `magic list` |
| `magic remove [name]` | `magic rm` | 安全删除指定子项目 | `magic remove my-script` |
| `magic doctor` | - | 体检并自动修复当前 Monorepo 项目配置（ESLint、依赖、Workspace 等） | `magic doctor` |

> 所有命令均支持直接传参，或不加参数进入交互式选择向导。

## 目录结构

```text
my-workspace/
├── packages/              # 油猴脚本子项目目录
│   ├── demo-vue-script/   # Vue 3 脚本
│   │   ├── src/           # App.vue / App.css / useApp.js
│   │   ├── main.js        # 脚本入口
│   │   └── vite.config.js # 构建配置
│   └── demo-vanilla-script/# 原生 JS 脚本
│       ├── main.js
│       ├── style.css
│       └── vite.config.js
├── shared/                # 跨脚本共享公共库
│   ├── components/        # 公共原子组件 (@shared/components)
│   └── utils/             # 公共工具 (@shared/utils)
├── dist/                  # 产物统一输出目录 (*.user.js)
├── pnpm-workspace.yaml    # 多包工作区配置
└── package.json
```

## 配置示例

子项目 `vite.config.js`：

```javascript
import { defineConfig, monkey, cdn } from 'magic-monkey-cli';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('magic-'), //  magic 自定义成自己组件前缀
        },
      },
    }),
    monkey({
      build: {
        externalGlobals: {
          // 引入 CDN 依赖，极大缩减产物脚本体积
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
        },
      },
      userscript: {
        name: 'my-script',
        match: ['*://*.example.com/*'],
        grant: ['unsafeWindow', 'GM_xmlhttpRequest'],
      },
    }),
  ],
});
```

## 导出模块

CLI 导出以下核心能力，供 `vite.config.js` 或 `eslint.config.mjs` 直接使用：

- **`defineConfig`**：内置 Monorepo 别名与产物路径的 Vite 配置函数。
- **`monkey`**：油猴脚本插件（基于 `vite-plugin-monkey`，默认开启 `mountGmApi`）。
- **`monkeyGlobals`**：油猴标准全局变量字典（用于 ESLint `...monkeyGlobals` 一行解构）。
- **`cdn` / `util`**：常用 CDN 辅助方法与自动导入预设。

## 致谢

本项目受启发于并基于以下优秀的开源项目：

- [vue](https://github.com/vuejs/core)
- [vite](https://github.com/vitejs/vite)
- [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)

