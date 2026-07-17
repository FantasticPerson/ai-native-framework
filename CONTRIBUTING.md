# 贡献指南

感谢参与 AI-Native 前端框架。本文档说明开发环境、工作流与约定。

## 开发环境

- Node.js >= 18
- pnpm（版本见根 `package.json` 的 `packageManager`）

```bash
pnpm install      # 安装全部 workspace 依赖
pnpm -r build     # 按依赖序构建全部包
pnpm -r test      # 运行全部单测
```

单包操作：

```bash
pnpm --filter @ai-native/core test
pnpm --filter @ai-native/scanner build
```

> **注意**：workspace 包之间引用的是 **dist 构建产物**（非 src）。改了某个包的 src 后，依赖它的包/示例要先 `pnpm --filter <pkg> build` 再构建，否则用的是旧 dist。`pnpm -r build` 会按依赖序全建，无此问题。

## 架构原则（改代码前必读）

1. **包边界清晰**：每个包不看内部实现也能说清「做什么、怎么用、依赖什么」。
2. **`core` 不认识任何前端框架**——只认识「能力清单 + adapter 接口」。框架相关的填值/导航逻辑放各 adapter 包（`react` / `vue`）。这是硬约束：给 core 加 React/Vue 依赖的 PR 不会被接受。
3. **接入光谱**：自动推断（零改动）→ 配置补漏 → 手动精标。低地板 + 高天花板，不牺牲任一端。
4. **诚实的边界**：自动推断准确率 < 手动标注是物理规律，文档与代码注释都要如实说明边界，不夸大。

## 测试先行

框架代码质量门槛高于应用。实现功能或修 bug 前先写测试（TDD）。PR 需通过 `pnpm -r test` 与 `pnpm -r build`。

## 提交规范

- 提交信息用中文描述，前缀：`init:` / `feat:` / `fix:` / `refactor:` / `docs:` / `chore:`。
- 描述要具体，说清改了什么、为什么改、影响哪里；禁止「修复 bug」「优化代码」这类泛词。
- 不加 `Co-Authored-By`。

## 版本与变更

- 遵循[语义化版本](https://semver.org/lang/zh-CN/)。当前处于 0.x，API 可能变动。
- 公共 API 变更、破坏性改动记入 `CHANGELOG.md`。
- 面向社区的重大决策进 `docs/rfcs/` 或在 RFC 附录记录理由。

## PR 流程

1. 从 `main` 切分支开发。
2. 确保 `pnpm -r build && pnpm -r test` 通过。
3. 提 PR 说明动机与改动范围；破坏性变更在描述里标明。
4. CI（build + test，Node 18/20）通过后合并。
