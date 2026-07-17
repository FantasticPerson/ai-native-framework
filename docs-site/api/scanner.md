# @ai-operable/scanner

构建时 AST 扫描。从代码已有结构提取能力清单。依赖 `core`（仅类型），不依赖前端框架。

## Vite 插件（推荐）

```ts
import { aiScannerPlugin } from '@ai-operable/scanner/vite';

aiScannerPlugin({
  modulesDir: 'src/modules',        // 扫描根目录，默认 'src/modules'
  output: 'src/ai-manifest.json',   // 输出路径，默认 'src/ai-manifest.json'
  extensions: ['.tsx'],             // 扫描后缀，默认 ['.tsx']；Vue 用 ['.vue']
  presets: [/* reactRouterPreset(...), antdPreset(...) */],
});
```

构建时（`buildStart`）与 dev 启动时扫描生成 manifest；dev watch `modulesDir` 变更时重扫。

## 底层 API

```ts
import { scanSource, scanVueSource, aggregate } from '@ai-operable/scanner';
```

- `scanSource(code): ScanResult`——扫单个 JSX/TSX 源码，提取 `data-ai-*` 标注。
- `scanVueSource(code): ScanResult`——扫单个 Vue SFC 的 `<template>`（用 `@vue/compiler-sfc`），产出与 `scanSource` 同构的结果。
- `aggregate(files, options): Manifest`——聚合多文件扫描结果为能力清单，按 `.vue` 后缀自动分派扫描器；合并 preset 种子（手标覆盖同 id 种子）。

`ScanResult`：`{ actions, fields, warnings, module? }`。

## Preset 接口

各栈的 preset 实现此接口，被插件收集：

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

种子优先级最低，`data-ai-*` 手标覆盖同 id 种子。
