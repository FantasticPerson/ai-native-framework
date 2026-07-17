# Quick Start

This repo is a pnpm monorepo.

## Install & build

```bash
pnpm install          # install dependencies
pnpm -r build         # build all packages in dependency order
pnpm -r test          # run all unit tests
```

> **Note**: workspace packages reference the built `dist` output (not `src`). After changing a package's `src`, run `pnpm --filter <pkg> build` before building packages that depend on it; `pnpm -r build` builds everything in dependency order.

## Wire it into a React app

1. **Configure the scanner's Vite plugin** to generate the capability manifest at build time:

```ts
// vite.config.ts
import { aiScannerPlugin } from '@ai-native/scanner/vite';
import { reactRouterPreset } from '@ai-native/preset-react-router';
import { antdPreset } from '@ai-native/preset-antd';

export default defineConfig({
  plugins: [
    aiScannerPlugin({
      presets: [
        reactRouterPreset({ routesFile: 'src/App.tsx', labels: { '/leave': 'Leave' } }),
        antdPreset({ forms: [{ module: 'leave', file: 'src/modules/leave/LeaveForm.tsx' }] }),
      ],
    }),
  ],
});
```

2. **Compose `useAIAgent` + `AIBar`** in your app:

```tsx
import { AIBar, useAIAgent } from '@ai-native/react';
import { createHttpProvider, type Manifest } from '@ai-native/core';
import manifestJson from './ai-manifest.json';

export function AI() {
  const provider = createHttpProvider({ endpoint: '/api/chat' });
  const agent = useAIAgent({ manifest: manifestJson as Manifest, provider });
  return <AIBar agent={agent} examples={['file a personal leave for tomorrow']} />;
}
```

3. **Add a `/api/chat` proxy on the server** that forwards to the LLM. The key is read from an environment variable and never enters the frontend bundle.

## Run the examples

```bash
pnpm --filter ai-native-demo dev   # full React + antd example (bring your own LLM key)
pnpm --filter vue-demo dev         # minimal Vue example (counter-proof of a framework-agnostic core)
```

Vue integration is symmetric — just swap `@ai-native/react` for `@ai-native/vue`. See the [Vue API](/en/api/vue).
