# ROADMAP

AI-Native 前端框架的真实进度源。完整战略见 `docs/rfcs/0001-ai-native-frontend-framework.md`。

## 当前阶段

阶段 0（RFC）——已完成。

## 已完成（已验证）

- **RFC 0001**：定位、差异化对比（vs 浏览器 Agent / MCP / ARIA）、三层接入光谱、架构分层、目标/非目标、五阶段里程碑。已评审定稿。
- **项目地基**：`git init`、`.gitignore`、`CLAUDE.md`（框架特有规范）、`ROADMAP.md`。

## 进行中

- 无。等待启动阶段 1。

## 待办（阶段 1：React 库自用）

从 `../ai-native-demo` 抽取可 npm 安装的 React 库：

- [ ] 定 monorepo 工具（pnpm workspace / turborepo，阶段 1 初评估）
- [ ] `@ai-native/core`：抽取 `parsePlan` 白名单校验 + executor + 虚拟光标（需剥离 react-router 依赖）
- [ ] `@ai-native/scanner`：抽取并泛化 AST 扫描 + manifest 生成
- [ ] `@ai-native/react`：AIBar 组件 + useAIAgent hook + router 桥接
- [ ] `@ai-native/preset-react-router`：第一个 preset，扫路由得模块清单
- [ ] 用 `ai-native-demo` 作为首个使用者，验证手动标注链路端到端跑通
- [ ] 安全模型基本设计：危险操作（删除/提交）二次确认机制

## 后续阶段（详见 RFC §7）

- 阶段 2：内核去框架化 + 自动推断（preset-antd、LLM provider 可插拔、执行反馈闭环）
- 阶段 3：Vue adapter 反证解耦
- 阶段 4：文档站 + 治理 + 公开发布（**发布是红线，届时确认**）

## 开放问题（RFC 附录 A）

preset 维护成本、执行反馈闭环设计、动态表单扫描、安全模型、正式命名——各自在对应阶段前解决。

## 阻塞

- 无。
