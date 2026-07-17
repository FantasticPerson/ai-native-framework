# 执行反馈闭环

从「一次性猜对」升级为「失败可自我修正」。

## 问题

LLM 首次产出的操作计划可能出错：编造清单外的模块、目标元素定位失败、字段值不合法。一次性执行失败就中断，体验差。

## 机制

`@ai-operable/core` 的 `runAgent` 在执行失败后，把**结构化反馈**回流给 LLM 重规划、自动重试：

```ts
import { runAgent } from '@ai-operable/core';

const result = await runAgent(userText, {
  manifest,
  provider,
  today: '2026-07-17',
  maxAttempts: 3, // 默认 3，传 1 关闭闭环重试
  adapter,
  onAttempt: (n) => console.log(`第 ${n} 次尝试`),
});
```

## 关键设计

- **语义化失败原因**：`ExecuteResult.kind` 直接标注失败类型（`locate-failed` / `unknown-module` / `user-cancelled`），比事后正则解析可靠。
- **用户取消不重试**：`user-cancelled` 是明确意志（用户拒绝了危险操作二次确认），不重试。
- **精简回流**：`buildRetryFeedback` 只回流「原指令 + 上次计划 + 失败步骤 + 已成功步骤」，不重复 manifest（已在 system prompt）。
- **防死循环**：`maxAttempts` 默认 3，解析失败也计入并回流。

## 为什么放 core

闭环是纯编排、零框架依赖，放 core 可被 headless / MCP 场景复用，也可单测。react / vue 的 `useAIAgent` 只是薄封装，透出 `attempt` 状态给 UI 显示「第 N 次尝试」。
