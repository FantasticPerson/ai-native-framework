# 变更日志

本项目遵循[语义化版本](https://semver.org/lang/zh-CN/)。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

- 暂无。

## [0.1.0] - 2026-07-17

首个具备完整能力链路的版本（阶段 1-3 成果），已发布至 npm（scope `@ai-operable`，public access）；文档站上线 Cloudflare Pages。

### 新增

- **`@ai-operable/core`**：框架无关运行时。能力清单类型（Manifest/Step/AIPlan）、`parsePlan` 白名单校验、执行器（虚拟光标演出、可中断、危险操作二次确认）、执行反馈闭环 `runAgent`（失败结构化回流 LLM 重规划、自动重试）、`LLMProvider` 抽象（`createHttpProvider` 服务端代理 + `createOpenAICompatibleProvider` 直连）、prompt 构建。零前端框架依赖。
- **`@ai-operable/scanner`**：构建时 AST 扫描。`scanSource`（JSX/TSX）+ `scanVueSource`（Vue SFC，`@vue/compiler-sfc`）+ `aggregate` 聚合 + 参数化 Vite 插件。同一扫描器同时支持 React 与 Vue。
- **`@ai-operable/react`**：React 适配器。受控组件填值（原生 setter）、`useAIAgent` hook、通用 `AIBar` 组件。
- **`@ai-operable/vue`**：Vue 适配器。原生填值、`useAIAgent` composable、`AIBar` 组件。与 React 适配器并存跑通同一套 core，反证内核框架无关。
- **`@ai-operable/preset-react-router`**：自动推断第一层。静态解析 `<Route>` 推断模块清单。
- **`@ai-operable/preset-antd`**：自动推断第二层。扫 antd `<Form.Item>` 推断字段清单（含动态 options），`/runtime` 子包提供 antd 非原生控件的运行时定位与填值。

### 安全

- 危险操作（删除/审批/驳回等）作为能力清单固有属性在编译期声明，执行前经 `confirm` 回调二次确认。
- LLM key 不进前端 bundle：浏览器走 `createHttpProvider` + 服务端代理；直连 provider 仅限可安全持有 key 的环境（Node/CLI/MCP）。

[Unreleased]: https://github.com/FantasticPerson/ai-native-framework/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/FantasticPerson/ai-native-framework/releases/tag/v0.1.0
