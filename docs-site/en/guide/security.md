# Security Model

## Confirmation for dangerous operations

Danger is an **intrinsic property** of an operation, declared into the capability manifest at compile time rather than judged ad hoc at runtime.

Data flow:

1. **Annotate**: `data-ai-confirm` marks dangerous operations (delete, approve, reject, etc.).
2. **Scan**: the scanner fills `ManifestAction.confirm: true`.
3. **Execute**: before a click the executor asks for confirmation via the `confirm` callback; on rejection it aborts gracefully (marked `kind: 'user-cancelled'`, no retry).

```tsx
<button data-ai-action="employees.delete" data-ai-label="Delete employee" data-ai-confirm>Delete</button>
```

## Separating mechanism from policy

- **The core only defines "whether to ask"**: `actionOf` + a `confirm` callback; by default it passes through (usable headless).
- **react / vue provide a default policy**: `window.confirm` as a fallback; the host can pass `onConfirm` to show a custom Modal.
- **The prompt keeps the LLM informed**: marking dangerous operations lets the LLM know, but the real gate is in the executor — it doesn't rely on the LLM's self-restraint.

Default is pass-through, only intercepting explicitly-annotated operations — honest and non-intrusive.

## The key never enters the frontend

The LLM's API key is a red line, never in the frontend bundle:

- **Browser**: use `createHttpProvider` + a server proxy; the key lives in a server-side environment variable.
- **Direct provider** (`createOpenAICompatibleProvider`): carries the apiKey and is **only for environments that can safely hold the key** (Node / CLI / MCP), never in the browser.

## The boundary

The operations the AI can execute are strictly limited to the whitelist in the compile-time capability manifest. Any module/operation the LLM invents outside the list is rejected by `parsePlan` and never executed.
