# ROADMAP

AI-Native 前端框架的真实进度源。完整战略见 `docs/rfcs/0001-ai-native-frontend-framework.md`。

## 当前阶段

阶段 0（RFC）——已完成。

## 已完成（已验证）

- **RFC 0001**：定位、差异化对比（vs 浏览器 Agent / MCP / ARIA）、三层接入光谱、架构分层、目标/非目标、五阶段里程碑。已评审定稿。
- **项目地基**：`git init`、`.gitignore`、`CLAUDE.md`（框架特有规范）、`ROADMAP.md`。
- **选型**：monorepo 用 pnpm workspace，包构建用 tsup（均已在 core 包验证）。
- **workspace 骨架**：根 `pnpm-workspace.yaml` + `tsconfig.base.json` + `package.json`，`pnpm install` 通过。
- **`@ai-native/core`（首个包）**：抽取 `parsePlan` 白名单校验 + 公共类型（Manifest/Step/AIPlan），零 DOM/React 依赖。7 项单测通过，tsup 产出 ESM + d.ts。
- **core 执行层**：adapter 接口（方案 A：仅 navigate + setFieldValue）+ 可选 presenter（支持 headless，为 MCP server 铺路）+ executor + 内置 domPresenter。14 项单测通过。
- **core provider + prompt**：LLMProvider 接口 + createHttpProvider（只做 http 默认实现，防未来破坏性变更）+ buildSystemPrompt。16 项单测通过。
- **`@ai-native/react`**：reactSetFieldValue（受控组件填值）+ useAIAgent hook（manifest/provider 注入）+ 通用 AIBar（业务示例改 props）。2 项单测通过，tsup 构建通过。
- **`@ai-native/scanner`**：scanSource + aggregate（纯逻辑，复用 core 类型）+ 参数化 vite 插件（modulesDir/output/extensions）。12 项单测通过，双入口构建通过。
- **端到端反向验证（构建级）**：demo 拷入 `examples/ai-native-demo`，纳入 workspace，改用 `workspace:*` 引用三个框架包。删除全部被替代的旧代码（src/ai/steps·executor·cursor·prompt·useAIAgent、scripts/ai-scanner），改用框架的 useAIAgent + AIBar + createHttpProvider + scanner vite 插件。`tsc -b && vite build` 通过，scanner 插件生成 4 模块 manifest。

## 进行中

- 无。阶段 1 核心目标（React 库自用）构建级已达成，待浏览器运行时验证。

## 待办（阶段 1：React 库自用）

从 `../ai-native-demo` 抽取可 npm 安装的 React 库：

- [x] 定 monorepo 工具 → pnpm workspace + tsup
- [x] `@ai-native/core`：parsePlan + 类型 + executor + presenter + provider + prompt
- [x] `@ai-native/react`：React adapter + useAIAgent hook + AIBar
- [x] `@ai-native/scanner`：scanSource + aggregate + 参数化 vite 插件
- [x] 用 `ai-native-demo` 作为首个使用者，构建级端到端验证通过（examples/ai-native-demo）
- [ ] **浏览器运行时验证（需人工 + 有效 DeepSeek key）**：`cd examples/ai-native-demo && npm run dev`，逐条验收「提请假 / 新增员工 / 报销筛选 / 审批 / 切换视图」+ 光标演出
- [ ] `@ai-native/preset-react-router`：第一个 preset，扫路由得模块清单（阶段 2 自动推断）
- [ ] 安全模型基本设计：危险操作（删除/提交）二次确认机制

## 技术债

- scanner 的 `<Field>` 约定组件识别是 demo 特定逻辑，暂按原样迁移（代码已注释），后续应移入 preset 层。

## 后续阶段（详见 RFC §7）

- 阶段 2：内核去框架化 + 自动推断（preset-antd、LLM provider 可插拔、执行反馈闭环）
- 阶段 3：Vue adapter 反证解耦
- 阶段 4：文档站 + 治理 + 公开发布（**发布是红线，届时确认**）

## 开放问题（RFC 附录 A）

preset 维护成本、执行反馈闭环设计、动态表单扫描、安全模型、正式命名——各自在对应阶段前解决。

## 阻塞

- 无。
