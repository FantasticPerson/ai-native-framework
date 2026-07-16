# ROADMAP

AI-Native 前端框架的真实进度源。完整战略见 `docs/rfcs/0001-ai-native-frontend-framework.md`。

## 当前阶段

阶段 0（RFC）——已完成。

## 已完成（已验证）

- **RFC 0001**：定位、差异化对比（vs 浏览器 Agent / MCP / ARIA）、三层接入光谱、架构分层、目标/非目标、五阶段里程碑。已评审定稿。
- **项目地基**：`git init`、`.gitignore`、`CLAUDE.md`（框架特有规范）、`ROADMAP.md`。
- **选型**：monorepo 用 pnpm workspace，包构建用 tsup（均已在 core 包验证）。
- **workspace 骨架**：根 `pnpm-workspace.yaml` + `tsconfig.base.json` + `package.json`，`pnpm install` 通过。
- **`@ai-native/core`（首个包）**：抽取 `parsePlan` 白名单校验 + 公共类型（Manifest/Step/AIPlan），零 DOM/React 依赖。7 项单测通过，tsup 产出 ESM + d.ts。
- **core 执行层**：adapter 接口（方案 A：仅 navigate + setFieldValue）+ 可选 presenter（支持 headless，为 MCP server 铺路）+ executor + 内置 domPresenter。14 项单测通过。
- **core provider + prompt**：LLMProvider 接口 + createHttpProvider（只做 http 默认实现，防未来破坏性变更）+ buildSystemPrompt。16 项单测通过。
- **`@ai-native/react`**：reactSetFieldValue（受控组件填值）+ useAIAgent hook（manifest/provider 注入）+ 通用 AIBar（业务示例改 props）。2 项单测通过，tsup 构建通过。
- **`@ai-native/scanner`**：scanSource + aggregate（纯逻辑，复用 core 类型）+ 参数化 vite 插件（modulesDir/output/extensions）。12 项单测通过，双入口构建通过。
- **端到端反向验证（构建级）**：demo 拷入 `examples/ai-native-demo`，纳入 workspace，改用 `workspace:*` 引用三个框架包。删除全部被替代的旧代码（src/ai/steps·executor·cursor·prompt·useAIAgent、scripts/ai-scanner），改用框架的 useAIAgent + AIBar + createHttpProvider + scanner vite 插件。`tsc -b && vite build` 通过，scanner 插件生成 4 模块 manifest。
- **`@ai-native/preset-react-router`（自动推断第一层）**：`scanRoutes` 静态解析 JSX `<Route path element>` 推断模块（跳过 Navigate/动态参数/通配），`reactRouterPreset({routesFile, labels})` 产出 `ModuleDef[]` 种子。10 项单测通过。scanner 侧开 `Preset` 接口 + `aggregate` 的 `moduleSeeds`（种子建模块、`data-ai-module` 手标优先覆盖），vite 插件加 `presets` 选项。
- **preset 反向验证（零改动接入）**：demo 删除 4 个模块组件根节点的 `data-ai-module/label/route` 手标（根节点变回朴素 `<div>`），改由 `reactRouterPreset` 扫 `App.tsx` 路由 + 一处 `labels` 配置推断模块清单。重新构建后生成的 manifest 与手标基线**内容字节级等价**（仅模块键序改为跟随路由声明顺序）。证明「自动推断 + 配置补漏」两层光谱可替代散落手标。
- **安全模型基本设计（危险操作二次确认）**：危险性作为操作固有属性声明在能力清单（`ManifestAction.confirm`），编译期确定。数据流：`data-ai-confirm` 标注 → scanner 填 `confirm:true` → executor 在 click 前经 `confirm` 回调二次确认，拒绝则优雅中断。机制/策略分离——core 只定义「要不要问」（`actionOf` + `confirm` 回调，缺省即放行，headless 可用），react 默认 `window.confirm` 兜底并暴露 `onConfirm` 让宿主弹自定义 Modal；prompt 标注危险操作让 LLM 知情但闸门在 executor。默认全放行，只拦显式标注的操作（方案 A：诚实、不打扰）。demo 给删除员工/审批/驳回请假三个操作标注验证。core 22 + react 2 + scanner 17 + preset 10 = 51 单测通过。
- **`@ai-native/preset-antd`（自动推断第二层：字段）**：构建时 `scanFormItems` 静态解析 antd `<Form.Item name label>`，从子控件推断字段类型（Input→text / InputNumber→number / DatePicker→date / Select→select）与 Select 选项（内联字面量数组、`<Option>` 子元素、同文件常量引用、`.map()`——见后续「动态表单扫描」条）。`antdPreset({forms})` 产出字段种子。
- **antd 运行时字段适配（封装进 preset-antd/runtime）**：抉择——不自建 UI 框架（会杀死「适配既有应用」定位），而把 antd 非原生控件的「定位 + 填值」脏活封装进独立浏览器子包 `@ai-native/preset-antd/runtime`（与构建时扫描分离，依赖集不同）。core 侧最小外置两个钩子（`ExecuteOptions.locateField` 覆盖默认 `data-ai-field` 定位；`FrameworkAdapter.setFieldValue` 放宽为可返回 Promise 并 await），并让 `typeInto` 对 readonly/combobox 一次性设值、不逐字。`createAntdFieldAdapter()`：定位走 antd 自动 id（`leave.type`→`#type`，data-ai-field 优先），填值按控件分派——原生 input 直接设值（低风险），Select 模拟展开点选 `.ant-select-item-option`（中风险，依赖 antd 内部 class），DatePicker best-effort。react 侧 `useAIAgent({fieldAdapter})` 透传。demo 接入后 leave 模块 4 字段（含带完整 options 的 select）manifest 正确。诚实边界：Select/DatePicker 依赖 antd 内部 class，antd 大版本升级可能失效，代价收敛在 runtime 一个文件随 antd 版本维护。
- **执行反馈闭环（阶段 2 核心，`runAgent`）**：执行失败后把结构化反馈回流 LLM 重规划、自动重试，从「一次性猜对」升级为「失败可自我修正」。设计见 `docs/plans/0002-execution-feedback-loop.md`。闭环放 core（`packages/core/src/agent.ts` 的 `runAgent`）而非 react——纯编排、零框架依赖、headless/MCP 可复用、可单测。关键决策：① `ExecuteResult` 加语义化 `kind`（locate-failed / unknown-module / user-cancelled），executor 直接标注失败原因，比事后 regex 可靠；② 用户取消危险操作（user-cancelled）是明确意志，不重试；③ `buildRetryFeedback` 只回流「原指令 + 上次计划 + 失败步骤 + 已成功步骤」，不重复 manifest（已在 system prompt）；④ 默认 `maxAttempts:3` 防死循环，解析失败也计入并回流；⑤ `onAttempt` 回调让 react 展示「第 N 次尝试」。react 的 useAIAgent 改调 runAgent 变薄，暴露 `attempt` 状态，AIBar 显示重试徽标，对外 API 兼容。core 35 + react 2 + scanner 20 + preset-react-router 10 + preset-antd 23 = **90 单测通过**，全量构建通过。待浏览器运行时验证重试体验。
- **动态表单扫描——解析变量引用的 Select options（阶段 2 收尾）**：实测确认四类「动态」场景（探测见 `docs/plans/0003-dynamic-form-scanning.md`）——条件渲染字段 babel 已扫到、循环生成字段（name 非字面量）是物理边界、唯一值得补的是「options 引用同文件常量」这一最常见写法（之前只认内联字面量数组，引用常量/`.map()` 则 options 丢失）。`scanFormItems` 现先遍历顶层 `const NAME = [...]` 建符号表，`readSelectOptions` 支持 `options={IDENT}`、`options={IDENT.map(...)}`、`options={[...].map(...)}`，`.map` 变换忽略（数组项即 value 源）。抽 `arrayExprToStrings` 纯函数去重复。诚实边界：跨文件 import 的常量、API/state 驱动的 options 不解析。scan-form 10→15 用例。demo 反向验证：LeaveForm 的 options 改回真实开发写法（模块级 `LEAVE_TYPES` 常量 + `.map()`），manifest 的 `leave.type.options` 仍完整——扫描器能跟上真实写法，此前为迁就扫描器把 options 内联的妥协可取消。core 35 + react 2 + scanner 20 + preset-react-router 10 + preset-antd 28 = **95 单测通过**，全量构建通过。
- **LLM provider 多实现（阶段 2 收尾）**：`LLMProvider` 本就是纯函数类型（用户可传任意实现），补一个官方直连参考实现证明抽象可插拔，而非堆砌 SDK 包装。新增 `createOpenAICompatibleProvider`——直连 OpenAI 兼容的 `/chat/completions`（DeepSeek / OpenAI / Moonshot / 通义等同一套协议），system 作首条 message、强制 `response_format=json_object`、`temperature=0`，取 `choices[0].message.content`。安全边界写进代码注释：此实现携带 apiKey，仅用于可安全持有 key 的环境（Node/CLI/MCP），浏览器仍走 `createHttpProvider` + 服务端代理（key 不进 bundle 是红线）。provider 2→5 用例，共 **98 单测通过**，全量构建通过。

## 进行中

- 无。阶段 1 全部达成；**阶段 2 四项成功标准全部达成**（core 去 React ✓、preset-antd 零改动扫字段 ✓、执行反馈闭环 ✓、LLM provider 可插拔 ✓）。下一步进入阶段 3（Vue adapter 反证解耦）或补文档站。

## 待办（阶段 1：React 库自用）

从 `../ai-native-demo` 抽取可 npm 安装的 React 库：

- [x] 定 monorepo 工具 → pnpm workspace + tsup
- [x] `@ai-native/core`：parsePlan + 类型 + executor + presenter + provider + prompt
- [x] `@ai-native/react`：React adapter + useAIAgent hook + AIBar
- [x] `@ai-native/scanner`：scanSource + aggregate + 参数化 vite 插件
- [x] 用 `ai-native-demo` 作为首个使用者，构建级端到端验证通过（examples/ai-native-demo）
- [x] `@ai-native/preset-react-router`：第一个 preset，扫路由得模块清单，demo 零改动反向验证通过（manifest 与手标基线等价）
- [x] 安全模型基本设计：危险操作（删除/审批/驳回）二次确认机制，demo 标注验证通过
- [x] `@ai-native/preset-antd`：扫 antd `<Form.Item>` 推断字段清单 + `/runtime` 运行时字段适配器，demo leave 模块接入真实 antd 验证（构建级）
- [x] **浏览器运行时验证（人工 + DeepSeek key）**：demo `npm run dev` 逐条验收提请假 / 新增员工 / 报销筛选 / 审批 / 切换视图 + 光标演出 + 危险操作弹确认 + antd 控件填值（原生 / Select 点选 / DatePicker）——已通过
- [x] 将 antd 接入从 leave 推广到 employees/expense 三个表单模块，preset-antd 泛化性验证通过：三模块字段清单齐全（含 Select options / InputNumber / DatePicker），antd 表单字段（preset 种子）与 Module 手标字段 `employees.keyword`·`expense.filterCategory` 正确合并互不覆盖

## 技术债

- scanner 的 `<Field>` 约定组件识别是 demo 特定逻辑，暂按原样迁移（代码已注释），后续应移入 preset 层。
- vite 插件 dev watch 只监听 `modulesDir`，改路由文件（如 `src/App.tsx`）不会触发 manifest 重扫，需重启 dev server。构建（`buildStart`）与 dev 启动时都会重新收集 preset，不影响生产产物；后续可让 preset 声明关注的文件路径。
- `reactRouterPreset` 仅支持 JSX 式 `<Routes>/<Route>`，数据式 `createBrowserRouter([...])` 暂不支持（诚实边界，见 RFC §4）。
- demo 构建脚本 `tsc -b && vite build`：tsc 先跑，会读到上一轮的旧 `ai-manifest.json`（vite 插件才重扫生成）。当 manifest 结构变动时可能读到过期内容；目前靠 vite 阶段重新生成兜底，后续可让 tsc 不依赖 manifest 或调整脚本顺序。
- workspace 包引用的是 **dist 构建产物**（非 src）。改了某个 preset/scanner 的 src 后，必须先 `pnpm --filter <pkg> build` 再构建 demo，否则 vite 插件用的是旧 dist（调试动态表单扫描时踩过：src 已支持常量 options 但 demo manifest 仍缺，根因是 preset-antd dist 未重建）。`pnpm -r build` 会按依赖序全建，无此问题。
- `src/components/Field.tsx`：三个表单 antd 化后已无人引用，刻意保留作为「接入光谱最底层——手动精标 data-ai-field 写法」的对照样例（非死代码，展示用）。

## 后续阶段（详见 RFC §7）

- 阶段 3：Vue adapter 反证解耦（验证 core 真的框架无关）
- 阶段 4：文档站 + 治理 + 公开发布（**发布是红线，届时确认**）

## 开放问题（RFC 附录 A）

preset 维护成本、执行反馈闭环设计、动态表单扫描、安全模型、正式命名——各自在对应阶段前解决。

## 阻塞

- 无。
