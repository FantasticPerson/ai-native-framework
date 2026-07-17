# @ai-native/scanner

Build-time AST scanning. Extracts the capability manifest from the existing code structure. Depends on `core` (types only), not on any frontend framework.

## Vite plugin (recommended)

```ts
import { aiScannerPlugin } from '@ai-native/scanner/vite';

aiScannerPlugin({
  modulesDir: 'src/modules',        // scan root, default 'src/modules'
  output: 'src/ai-manifest.json',   // output path, default 'src/ai-manifest.json'
  extensions: ['.tsx'],             // scan extensions, default ['.tsx']; Vue uses ['.vue']
  presets: [/* reactRouterPreset(...), antdPreset(...) */],
});
```

Scans and generates the manifest at build (`buildStart`) and at dev startup; re-scans on `modulesDir` changes during dev watch.

## Low-level API

```ts
import { scanSource, scanVueSource, aggregate } from '@ai-native/scanner';
```

- `scanSource(code): ScanResult` — scans a single JSX/TSX source, extracting `data-ai-*` annotations.
- `scanVueSource(code): ScanResult` — scans a single Vue SFC `<template>` (via `@vue/compiler-sfc`), producing a result isomorphic to `scanSource`.
- `aggregate(files, options): Manifest` — aggregates multi-file scan results into a capability manifest, dispatching the scanner by the `.vue` extension automatically; merges preset seeds (manual annotation overrides same-id seeds).

`ScanResult`: `{ actions, fields, warnings, module? }`.

## Preset interface

Each stack's preset implements this interface and is collected by the plugin:

```ts
interface Preset {
  collect(): PresetContribution;
}
interface PresetContribution {
  modules?: ModuleDef[];
  fields?: ManifestField[];
  actions?: ManifestAction[];
}
```

Seeds have the lowest priority; `data-ai-*` manual annotations override same-id seeds.
