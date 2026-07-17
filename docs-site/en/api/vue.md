# @ai-operable/vue

The Vue adapter. Depends on `core`, peer-depends on `vue` / `vue-router`. The API shape is symmetric to the [React adapter](/en/api/react), and internally it calls **the same** `runAgent` in the core — this is the counter-proof that the core is framework-agnostic.

## useAIAgent

```ts
import { useAIAgent } from '@ai-operable/vue';

const agent = useAIAgent({
  manifest,
  provider,
  presenter,      // optional, default domPresenter; null disables
  stepDelay,      // optional, default 550
  onConfirm,      // optional, default window.confirm
  fieldAdapter,   // optional
  maxAttempts,    // optional, default 3
});
// returns: { status, narration, error, attempt, run } (fields are Vue refs)
```

The only difference from the React version is framework idiom: it uses `ref` for state, `vue-router`'s `push` for navigation, and `vueSetFieldValue` for filling. The return fields are refs — use them directly in templates, and read `.value` in scripts.

## AIBar

```vue
<script setup lang="ts">
import { AIBar, useAIAgent } from '@ai-operable/vue';
const agent = useAIAgent({ manifest, provider });
const examples = ['file a personal leave for tomorrow'];
</script>

<template>
  <AIBar :agent="agent" :examples="examples" placeholder="Say something…" />
</template>
```

`AIBar` is implemented with a render function (`defineComponent` + `h`), pure TS, without pulling in the SFC compilation chain.

## vueSetFieldValue

```ts
import { vueSetFieldValue } from '@ai-operable/vue';
```

Fills a native form control — writes `el.value` directly and dispatches `input`/`change`. Vue's `v-model` compiles to `:value + @input` on native elements, listening to native events, so it **needs none of React's prototype-chain setter hack**. This real difference is exactly the evidence that adapters must be split by framework while the core should know none of them.
