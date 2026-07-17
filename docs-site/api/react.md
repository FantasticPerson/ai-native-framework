# @ai-native/react

React 适配器。依赖 `core`，peer 依赖 `react` / `react-router-dom`。

## useAIAgent

```tsx
import { useAIAgent } from '@ai-native/react';

const agent = useAIAgent({
  manifest,                  // 能力清单
  provider,                  // LLMProvider
  presenter,                 // 可选，默认 domPresenter；null 关闭演出
  stepDelay,                 // 可选，步骤间隔 ms，默认 550
  onConfirm,                 // 可选，危险操作确认回调，默认 window.confirm
  fieldAdapter,              // 可选，非原生控件的定位与填值（如 antd runtime）
  maxAttempts,               // 可选，闭环重试次数，默认 3
});
// 返回：{ status, narration, error, attempt, run }
```

`status`：`'idle' | 'thinking' | 'executing' | 'done' | 'error'`。
`run(userText)`：执行一句自然语言指令。
`attempt`：当前尝试轮次（闭环重试时 >1）。

内部用 `react-router-dom` 的 `useNavigate` 做导航、`reactSetFieldValue` 填值，调 core 的 `runAgent`。

## AIBar

通用 AI 输入条，业务内容由 props 注入：

```tsx
import { AIBar } from '@ai-native/react';

<AIBar
  agent={agent}                       // useAIAgent 返回值
  examples={['帮我提个明天的事假']}   // 可选，快捷示例
  placeholder="说一句话…"             // 可选
/>
```

## reactSetFieldValue

```ts
import { reactSetFieldValue } from '@ai-native/react';
```

给 React 受控组件填值——用原型链原生 setter 设值再派发 `input`/`change` 事件，绕过 React 的受控拦截。这是 React 特有的 hack，Vue 不需要（见 [Vue API](/api/vue)）。
