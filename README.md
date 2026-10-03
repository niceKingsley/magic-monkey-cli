# magic-monkey-cli

油猴脚本 (Userscript) Monorepo 多包开发与构建脚手架。

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
magic create my-new-script
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
| `magic create [name]` | - | 创建新的油猴脚本子项目 | `magic create my-script -f vue` |
| `magic dev [name]` | - | 启动子项目本地开发服务器与 HMR | `magic dev my-script` |
| `magic build [name]` | - | 打包构建子项目（`-a` 或 `--all` 全量打包） | `magic build my-script` |
| `magic list` | `magic ls` | 列出所有子项目状态与技术栈 | `magic list` |
| `magic remove [name]` | `magic rm` | 安全删除指定子项目 | `magic remove my-script` |

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
          isCustomElement: (tag) => tag.startsWith('magic-'),
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

## 导出工具与进阶

CLI 导出了以下核心模块，供 `vite.config.js` 灵活调用：

- **`defineConfig(config)`**：配置定义函数，内置 Monorepo 路径别名（`@`、`@shared/components`、`@shared/utils`）与产物输出路径。
- **`monkey(options)`**：油猴脚本插件配置函数，底层基于 [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)，支持其所有构建与油猴元数据配置。
- **`cdn`**：CDN 辅助工具，支持 `cdn.jsdelivr`、`cdn.unpkg`、`cdn.cdnjs` 等。
- **`util`**：进阶实用工具：
  - `util.unimportPreset`：配合 `unplugin-auto-import` 实现 `GM_*` 全局 API 自动按需导入。
  - `util.dataUrl(mime, content)`：将静态资源快速转换为 Data URL。

> 更多油猴元数据（Userscript Header）与高级配置项，可直接参考 [vite-plugin-monkey 官方文档](https://github.com/lisonge/vite-plugin-monkey)。

## 致谢

本项目受启发于并基于以下优秀的开源项目：

- [vue](https://github.com/vuejs/core)
- [vite](https://github.com/vitejs/vite)
- [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)

