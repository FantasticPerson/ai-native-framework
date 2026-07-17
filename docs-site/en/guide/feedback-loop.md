# Execution Feedback Loop

Upgrade from "guess right in one shot" to "self-correct on failure".

## The problem

The LLM's first operation plan can be wrong: inventing modules outside the manifest, failing to locate target elements, producing invalid field values. Aborting on the first failure is a poor experience.

## The mechanism

After an execution failure, `runAgent` in `@ai-operable/core` feeds **structured feedback** back to the LLM to re-plan and retry automatically:

```ts
import { runAgent } from '@ai-operable/core';

const result = await runAgent(userText, {
  manifest,
  provider,
  today: '2026-07-17',
  maxAttempts: 3, // default 3; pass 1 to disable the retry loop
  adapter,
  onAttempt: (n) => console.log(`attempt ${n}`),
});
```

## Key design decisions

- **Semantic failure reasons**: `ExecuteResult.kind` labels the failure type directly (`locate-failed` / `unknown-module` / `user-cancelled`) — more reliable than regex-parsing after the fact.
- **User cancellation is not retried**: `user-cancelled` is a clear intent (the user rejected the confirmation of a dangerous operation) and is not retried.
- **Lean feedback**: `buildRetryFeedback` only feeds back "original instruction + last plan + failed step + already-succeeded steps", not the full manifest again (it's already in the system prompt).
- **Loop guard**: `maxAttempts` defaults to 3; parse failures also count and are fed back.

## Why it lives in the core

The loop is pure orchestration with zero framework dependency, so putting it in the core makes it reusable in headless / MCP scenarios and unit-testable. The `useAIAgent` in react / vue is just a thin wrapper that surfaces the `attempt` state to the UI to show "attempt N".
