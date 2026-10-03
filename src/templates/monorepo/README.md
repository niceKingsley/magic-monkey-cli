# {{NAME}}

> {{DESCRIPTION}}

油猴脚本 (Userscript) Monorepo 多包开发项目。

## 📁 目录结构

```text
├── packages/              # 存放所有油猴脚本子项目 (Vue 3 / Vanilla)
├── shared/                # 跨脚本共享公共库
│   ├── components/        # 公共原子组件 (@shared/components)
│   └── utils/             # 公共工具函数 (@shared/utils)
├── dist/                  # 编译产物统一输出目录
├── pnpm-workspace.yaml    # 工作区配置
└── package.json           # 根包配置
```

## 🚀 常用指令

```bash
# 创建新的油猴脚本子项目 (Vue 3 / Vanilla)
pnpm create

# 启动某个子项目的本地开发调试
pnpm dev

# 打包指定子项目
pnpm build

# 全量并发打包所有子项目
pnpm build:all

# 查看所有子项目清单
pnpm list
```
