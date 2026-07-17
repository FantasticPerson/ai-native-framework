# 快速开始

本仓库是 pnpm monorepo。

## 安装与构建

```bash
pnpm install          # 安装依赖
pnpm -r build         # 按依赖序构建全部包
pnpm -r test          # 运行全部单测
```

> **注意**：workspace 包之间引用的是 dist 构建产物（非 src）。改了某个包的 src 后要先 `pnpm --filter <pkg> build` 再构建依赖它的包；`pnpm -r build` 会按依赖序全建。

## 在 React 应用里接入

1. **配置 scanner 的 Vite 插件**，构建时生成能力清单：

```ts
// vite.config.ts
import { aiScannerPlugin } from '@ai-native/scanner/vite';
import { reactRouterPreset } from '@ai-native/preset-react-router';
import { antdPreset } from '@ai-native/preset-antd';

export default defineConfig({
  plugins: [
    aiScannerPlugin({
      presets: [
        reactRouterPreset({ routesFile: 'src/App.tsx', labels: { '/leave': '请假管理' } }),
        antdPreset({ forms: [{ module: 'leave', file: 'src/modules/leave/LeaveForm.tsx' }] }),
      ],
    }),
  ],
});
```

2. **在应用里组合 `useAIAgent` + `AIBar`**：

```tsx
import { AIBar, useAIAgent } from '@ai-native/react';
import { createHttpProvider, type Manifest } from '@ai-native/core';
import manifestJson from './ai-manifest.json';

export function AI() {
  const provider = createHttpProvider({ endpoint: '/api/chat' });
  const agent = useAIAgent({ manifest: manifestJson as Manifest, provider });
  return <AIBar agent={agent} examples={['帮我提个明天的事假']} />;
}
```

3. **服务端加一个 `/api/chat` 代理**转发到 LLM，key 从环境变量读，不进前端 bundle。

## 跑示例

```bash
pnpm --filter ai-native-demo dev   # React + antd 全功能示例（需自备 LLM key）
pnpm --filter vue-demo dev         # Vue 最小示例（反证 core 框架无关）
```

Vue 接入方式对称，把 `@ai-native/react` 换成 `@ai-native/vue` 即可，详见 [Vue API](/api/vue)。
