# AI-Native Vue Demo

用 Vue 3 + vue-router 搭的最小示例，用途是**反证 `@ai-operable/core` 真的框架无关**：与 React demo 用的是同一个 core（`runAgent` / `executor` / `domPresenter`），只把适配层换成 `@ai-operable/vue`。

## 反证了什么

- **执行链框架无关**：`useAIAgent` composable 用 Vue 的 `ref` 管状态、`vue-router` 的 `push` 做导航，内部调的仍是 core 的同一个 `runAgent`。搭这个 demo 全程**没改 core 一行**。
- **扫描链框架无关**：`@ai-operable/scanner` 直接扫 `.vue` 的 `<template>` 里的 `data-ai-*`（用 `@vue/compiler-sfc`），生成的 `src/ai-manifest.json` 与 React demo 同构。
- **填值差异恰好印证分包必要**：Vue 的 `v-model` 编译成 `:value + @input`，`vueSetFieldValue` 直接写 `el.value` 派发 `input` 即可——不用 React 那套原型链原生 setter hack。两个 adapter 因此不同，而 core 不认识任何一个。

## 快速开始

```bash
# 在 monorepo 根先构建框架包
pnpm -r build

# 配置 LLM key（DeepSeek，OpenAI 兼容）
cp .env.example .env   # 编辑填入 DEEPSEEK_API_KEY

# 起 dev（默认 5099 端口）
pnpm --filter vue-demo dev
```

key 只在 vite 中间件的 `/api/chat` 代理里使用，不进前端 bundle。

## 结构

```
src/
  modules/leave/LeaveView.vue        请假表单（原生 select/input + data-ai-*）
  modules/employees/EmployeeView.vue 员工表单
  ai/AIBar.vue                       组合 @ai-operable/vue 的 useAIAgent + AIBar
  main.ts                            vue-router 装配
server/chat-proxy.ts                 DeepSeek 代理（与 React demo 逐字一致）
```
