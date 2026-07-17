# @ai-operable/core

框架无关的运行时。**不认识任何前端框架**，只认识「能力清单 + adapter 接口」。

## 能力清单类型

```ts
import type { Manifest, ManifestModule, ManifestAction, ManifestField, Step, AIPlan } from '@ai-operable/core';
```

- `Manifest`：`{ generatedAt, modules: Record<string, ManifestModule> }`
- `ManifestModule`：`{ label, route, actions, fields }`
- `ManifestAction`：`{ id, label, confirm? }`
- `ManifestField`：`{ id, label, type: 'text'|'number'|'date'|'select', options? }`
- `Step`：`{ type:'navigate', module }` | `{ type:'click', target }` | `{ type:'fill', target, value }` | `{ type:'wait', ms }`
- `AIPlan`：`{ narration, steps }`

## parsePlan

```ts
import { parsePlan } from '@ai-operable/core';
const plan = parsePlan(rawLLMOutput, manifest); // 白名单校验，拒绝清单外模块/操作
```

校验 LLM 输出：只接受 manifest 白名单内的模块、操作、字段，拒绝编造的目标。

## execute / runAgent

```ts
import { execute, runAgent } from '@ai-operable/core';
```

- `execute(plan, options): Promise<ExecuteResult>`——执行一份计划（虚拟光标演出、可中断、危险操作二次确认）。`ExecuteResult` 含 `ok`、`stoppedAt`、`reason`、`kind`（`StopKind`：`locate-failed`/`unknown-module`/`user-cancelled`）。
- `runAgent(userText, options): Promise<AgentRunResult>`——执行反馈闭环：失败结构化回流 LLM 重规划、自动重试。见[执行反馈闭环](/guide/feedback-loop)。

`ExecuteOptions` 关键字段：`adapter`（`FrameworkAdapter`）、`routeOf`、`actionOf`、`confirm`、`locateField`、`presenter`、`onNarrate`、`stepDelay`。

## FrameworkAdapter

框架相关的两件事，由各 adapter 包实现：

```ts
interface FrameworkAdapter {
  navigate(route: string): void;
  setFieldValue(el: Element, value: string): void | Promise<void>;
}
```

## Presenter

可见演出接口，`domPresenter` 是内置 DOM 实现（虚拟光标 + 高亮）。传 `null` 关闭演出，支持 headless（为 MCP 铺路）。

## Provider

```ts
import { createHttpProvider, createOpenAICompatibleProvider } from '@ai-operable/core';
```

- `createHttpProvider({ endpoint })`——浏览器用，转发到服务端代理，key 不进前端。
- `createOpenAICompatibleProvider({ endpoint, apiKey, model })`——直连 OpenAI 兼容端点（DeepSeek/OpenAI/Moonshot/通义），**仅限可安全持有 key 的环境**（Node/CLI/MCP）。

## prompt

`buildSystemPrompt(manifest, today)` 构建系统提示；`buildRetryFeedback` 构建失败重规划反馈。
