# @ai-native/react

The React adapter. Depends on `core`, peer-depends on `react` / `react-router-dom`.

## useAIAgent

```tsx
import { useAIAgent } from '@ai-native/react';

const agent = useAIAgent({
  manifest,                  // capability manifest
  provider,                  // LLMProvider
  presenter,                 // optional, default domPresenter; null disables playback
  stepDelay,                 // optional, ms between steps, default 550
  onConfirm,                 // optional, dangerous-op confirm callback, default window.confirm
  fieldAdapter,              // optional, locate & fill non-native controls (e.g. antd runtime)
  maxAttempts,               // optional, retry-loop count, default 3
});
// returns: { status, narration, error, attempt, run }
```

`status`: `'idle' | 'thinking' | 'executing' | 'done' | 'error'`.
`run(userText)`: executes one natural-language instruction.
`attempt`: current attempt round (>1 during retry loop).

Internally uses `react-router-dom`'s `useNavigate` for navigation, `reactSetFieldValue` for filling, and calls the core's `runAgent`.

## AIBar

A generic AI input bar; business content is injected via props:

```tsx
import { AIBar } from '@ai-native/react';

<AIBar
  agent={agent}                       // useAIAgent return value
  examples={['file a personal leave for tomorrow']}   // optional, quick examples
  placeholder="Say something…"        // optional
/>
```

## reactSetFieldValue

```ts
import { reactSetFieldValue } from '@ai-native/react';
```

Fills a React controlled component — sets the value via the prototype-chain native setter and dispatches `input`/`change` events, bypassing React's controlled interception. This is a React-specific hack that Vue doesn't need (see [Vue API](/en/api/vue)).
