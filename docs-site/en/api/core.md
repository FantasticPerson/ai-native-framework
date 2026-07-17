# @ai-operable/core

The framework-agnostic runtime. **It knows no frontend framework**, only "capability manifest + adapter interface".

## Capability manifest types

```ts
import type { Manifest, ManifestModule, ManifestAction, ManifestField, Step, AIPlan } from '@ai-operable/core';
```

- `Manifest`: `{ generatedAt, modules: Record<string, ManifestModule> }`
- `ManifestModule`: `{ label, route, actions, fields }`
- `ManifestAction`: `{ id, label, confirm? }`
- `ManifestField`: `{ id, label, type: 'text'|'number'|'date'|'select', options? }`
- `Step`: `{ type:'navigate', module }` | `{ type:'click', target }` | `{ type:'fill', target, value }` | `{ type:'wait', ms }`
- `AIPlan`: `{ narration, steps }`

## parsePlan

```ts
import { parsePlan } from '@ai-operable/core';
const plan = parsePlan(rawLLMOutput, manifest); // whitelist validation, rejects out-of-manifest modules/operations
```

Validates the LLM output: only accepts modules, operations and fields within the manifest whitelist, rejecting invented targets.

## execute / runAgent

```ts
import { execute, runAgent } from '@ai-operable/core';
```

- `execute(plan, options): Promise<ExecuteResult>` — runs one plan (virtual-cursor演出, interruptible, confirmation for dangerous operations). `ExecuteResult` has `ok`, `stoppedAt`, `reason`, `kind` (`StopKind`: `locate-failed`/`unknown-module`/`user-cancelled`).
- `runAgent(userText, options): Promise<AgentRunResult>` — the execution feedback loop: structured feedback on failure, re-planning by the LLM, automatic retry. See [Execution Feedback Loop](/en/guide/feedback-loop).

Key `ExecuteOptions` fields: `adapter` (`FrameworkAdapter`), `routeOf`, `actionOf`, `confirm`, `locateField`, `presenter`, `onNarrate`, `stepDelay`.

## FrameworkAdapter

The two framework-specific things, implemented by each adapter package:

```ts
interface FrameworkAdapter {
  navigate(route: string): void;
  setFieldValue(el: Element, value: string): void | Promise<void>;
}
```

## Presenter

The visible-playback interface. `domPresenter` is the built-in DOM implementation (virtual cursor + highlight). Pass `null` to disable playback for headless use (paving the way for MCP).

## Provider

```ts
import { createHttpProvider, createOpenAICompatibleProvider } from '@ai-operable/core';
```

- `createHttpProvider({ endpoint })` — for the browser, forwards to a server proxy; the key never enters the frontend.
- `createOpenAICompatibleProvider({ endpoint, apiKey, model })` — connects directly to an OpenAI-compatible endpoint (DeepSeek/OpenAI/Moonshot/Qwen), **only for environments that can safely hold the key** (Node/CLI/MCP).

## prompt

`buildSystemPrompt(manifest, today)` builds the system prompt; `buildRetryFeedback` builds the re-planning feedback on failure.
