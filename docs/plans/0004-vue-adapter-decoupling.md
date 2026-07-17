# 计划：Vue adapter 反证 core 解耦（阶段 3）

## 背景

RFC §7 阶段 3 的成功标准：用第二个框架跑通**同一套 core**，两个 adapter 并存；失败信号是「内核仍偷偷依赖 React」。此前 core 的「框架无关」只是**自证**（源码零 React import），缺一个第二框架来证伪。

## 反证判据（硬指标）

**全程不改 `packages/core` 一行。** 落地后 `git diff packages/core` 为空即成立；若途中被迫改 core，那正是内核偷偷依赖 React 的证据，反证失败。

## 三处改动（都不碰 core）

### 1. `@ai-operable/scanner` 扫 Vue SFC
- 新增 `scanVueSource(code)`：用 `@vue/compiler-sfc` 的 `parse` 拿 `descriptor.template.ast`，遍历元素节点（type 1）读静态属性（type 6）提取 `data-ai-*`，产出与 `scanSource` 同构的 `ScanResult`。动态绑定（type 7，`:data-ai-x` / `v-bind`）对应 JSX 的非字面量，告警不采集。
- `aggregate` 加 `scanFile(file)` 按后缀分派：`.vue → scanVueSource`，其余 → `scanSource`。分派内聚一处。
- 新依赖 `@vue/compiler-sfc` 进 `dependencies`（vite 插件构建时调用）。与 `@babel/*` 对称——都是构建时源码解析器，不进浏览器 bundle。诚实债：纯 React 用户装 scanner 会连带它，阶段 4 发布前拆 optional peer + 动态 import。

### 2. 新建 `@ai-operable/vue` 包（对称 `@ai-operable/react`）
- `vueSetFieldValue`：直接 `el.value = value` + 派发 `input`/`change`。Vue 的 `v-model` 编译成 `:value + @input`，监听原生事件，无需 React 的原型链原生 setter hack。这个真实差异正是 adapter 必须分包、core 不该认识任何一个框架的证据。
- `useAIAgent` composable：`ref` 管状态、`vue-router` 的 `push` 做 navigate，内部调 **core 的同一个 `runAgent`**。API 形状对齐 React 版。
- `AIBar`：用 `defineComponent` + `h()` 渲染函数写（纯 TS），整包 tsup 单工具链构建，不引入 SFC 编译链。

### 3. 新建 `examples/vue-demo`（可运行）
- vite + `@vitejs/plugin-vue` + vue-router，2 个原生表单 SFC（请假、员工）带 `data-ai-*`。
- vite.config 用 `aiScannerPlugin({ extensions: ['.vue'] })` 扫出 manifest——证明扫描链也框架无关。
- chat-proxy 与 React demo 逐字一致（服务端代理本就框架无关），key 走 `/api/chat` 不进 bundle。

## 验证

- scanVueSource 13 单测 + aggregate 分派 1 单测；vue 包 4 单测（填值、composable 调 runAgent、错误态）。
- vue-demo：`vue-tsc -b && vite build` 通过，manifest 正确生成（2 模块含 select options）——构建级端到端。
- 全量：core 35 + react 2 + vue 4 + scanner 34 + preset-react-router 10 + preset-antd 28 = **113 单测通过**，6 包 + 2 demo 全构建通过。
- **反证成立判据：`git diff packages/core` 为空。**
- 浏览器真跑需 DeepSeek key（红线，不替配），留人工验收，同阶段 2 先例。

## 非目标

- 不追求 Vue demo 功能与 React demo 对等（后者是 antd 全功能，前者是最小反证）。
- 不做 Vue 的 UI 库运行时适配（对应 preset-antd/runtime），非反证所需。
