# @ai-native/vue

Vue 适配器。依赖 `core`，peer 依赖 `vue` / `vue-router`。API 形状与 [React 适配器](/api/react)对称，内部调 core 的**同一个** `runAgent`——这是内核框架无关的反证。

## useAIAgent

```ts
import { useAIAgent } from '@ai-native/vue';

const agent = useAIAgent({
  manifest,
  provider,
  presenter,      // 可选，默认 domPresenter；null 关闭
  stepDelay,      // 可选，默认 550
  onConfirm,      // 可选，默认 window.confirm
  fieldAdapter,   // 可选
  maxAttempts,    // 可选，默认 3
});
// 返回：{ status, narration, error, attempt, run }（字段是 Vue ref）
```

与 React 版差异只在框架惯用法：用 `ref` 管状态、`vue-router` 的 `push` 做导航、`vueSetFieldValue` 填值。返回值字段是 ref，模板里直接用，脚本里取 `.value`。

## AIBar

```vue
<script setup lang="ts">
import { AIBar, useAIAgent } from '@ai-native/vue';
const agent = useAIAgent({ manifest, provider });
const examples = ['帮我提个明天的事假'];
</script>

<template>
  <AIBar :agent="agent" :examples="examples" placeholder="说一句话…" />
</template>
```

`AIBar` 用渲染函数（`defineComponent` + `h`）实现，纯 TS，不引入 SFC 编译链。

## vueSetFieldValue

```ts
import { vueSetFieldValue } from '@ai-native/vue';
```

给原生表单填值——直接写 `el.value` 再派发 `input`/`change`。Vue 的 `v-model` 在原生元素上编译成 `:value + @input`，监听原生事件，**无需 React 那套原型链 setter hack**。这个真实差异正是 adapter 必须按框架分包、而 core 不该认识任何一个框架的证据。
