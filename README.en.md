# AI-Native Frontend Framework

> [简体中文](README.md) | English

> Give your own frontend app high-accuracy, visible and controllable AI operations.

The user says one sentence to the app ("file a personal leave for tomorrow", "filter expenses by travel"), and the AI completes the corresponding multi-step operation — switching pages, filling forms, clicking, submitting — all of it **visible**: the virtual cursor moves, values are typed character by character, targets are highlighted. Users understand it, trust it, and can interrupt at any time.

The one-line distinction from competitors: **others let the AI "look at the screen and guess how to operate any website", we let the AI "read the structure and operate your own app precisely".**

## The core insight

The semantics of a modern frontend app already exist; they are just scattered around and never collected — pages live in the routes, fields live in `<Form.Item>`, operations live on buttons with labels. The core action of this framework is: **use static AST analysis at build time to extract a "capability manifest" from the structure already in the code**, letting the LLM orchestrate precisely within a compile-time whitelist. Annotation is an optional enhancement, not a prerequisite for integration.

## Access spectrum: low floor + high ceiling

Not either-or, combine as needed:

1. **Auto-inference (zero changes)** — presets scan routes for modules and `<Form.Item>` for fields.
2. **Config gap-filling** — `ai.config` fills where auto-inference can't reach.
3. **Manual annotation** — `data-ai-*` attributes for the highest accuracy.

> An honest boundary: auto-inference accuracy < manual annotation — that's physics. We don't claim "fully automatic and most accurate".

## Packages at a glance

| Package | What it does | Depends on |
|---|---|---|
| `@ai-operable/core` | Framework-agnostic runtime: manifest types, LLM-output parsing & whitelist validation, executor, execution feedback loop, providers | no frontend framework |
| `@ai-operable/scanner` | Build-time AST scanning (JSX + Vue SFC) + Vite plugin, generates the manifest | core |
| `@ai-operable/react` | React adapter: controlled-component filling, `useAIAgent` hook, `AIBar` | core |
| `@ai-operable/vue` | Vue adapter: native filling, `useAIAgent` composable, `AIBar` | core |
| `@ai-operable/preset-react-router` | Auto-inference layer 1: scans routes for the module list | scanner |
| `@ai-operable/preset-antd` | Auto-inference layer 2: scans antd forms for the field list + runtime field adaptation | scanner |

The `core` knows no frontend framework, only "capability manifest + adapter interface". The React and Vue adapters coexist and run the same core — the counter-proof that the core is truly decoupled.

## Quick start

This repo is a pnpm monorepo.

```bash
pnpm install          # install dependencies
pnpm -r build         # build all packages in dependency order
pnpm -r test          # run all unit tests

# run the examples (bring your own LLM key, via a server proxy — the key never enters the frontend)
pnpm --filter ai-native-demo dev   # full React + antd example
pnpm --filter vue-demo dev         # minimal Vue example (counter-proof of a framework-agnostic core)
```

## Docs & design

- Design & positioning: [`docs/rfcs/0001-ai-native-frontend-framework.md`](docs/rfcs/0001-ai-native-frontend-framework.md)
- Progress: [`ROADMAP.md`](ROADMAP.md)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Docs site: `pnpm --filter docs-site dev` (VitePress)

## Status

Phases 0-3 are complete (RFC → React library → core de-frameworking → Vue counter-proof decoupling). Currently in phase 4 (docs site + governance + release prep). **Not yet published to npm**; the API is at 0.x and may change.

## License

[MIT](LICENSE) © FantasticPerson
