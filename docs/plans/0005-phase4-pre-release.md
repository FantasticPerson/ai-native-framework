# 计划：阶段 4 发布前准备（文档站 + 治理 + 发布元数据）

## 范围与红线

- **命名转正**：`@ai-native/*` 转为正式 scope。事实依据——npm 上 `@ai-native` 整个 scope 完全可用（core/scanner/react/vue/preset-* 全部 404，scope 搜索无匹配），语义精准，已贯穿 6 包 + 2 demo + 全部文档。另起新名要批量返工却无收益，故转正是事实支持的最优解，**零代码改动**。
- **本轮只做发布前准备**：文档站、LICENSE、CONTRIBUTING、CI、语义化版本配置、包 publish 元数据。
- **红线**：真正的 `npm publish` / 正式 release **不在本轮**，全部就绪后单独停下确认再执行。

## 需主人拍板的待填项（审方案时给）

1. **开源协议**：默认 MIT（开源库惯例）。若要 Apache-2.0 / 其他，请指定。
2. **署名**：LICENSE 版权行与 package.json `author`。默认用 `FantasticPerson`（git 远端所有者）。
3. **首个版本号**：建议 `0.1.0`（有真实功能但 API 未稳定，走 0.x 语义化）。

## 改动清单

### A. 命名转正（代码零改，仅补元数据）
`@ai-native/*` 已是各包 name 与包间引用，无需改。只在 RFC 附录 A 第 5 条记「命名已定为 @ai-native，理由：scope 可用 + 语义精准 + 零返工」。

### B. 包 publish 元数据（6 包 package.json 各补齐）
每个包补：`license`、`author`、`repository`（同一 git URL + `directory` 指向各包）、`homepage`、`keywords`、`publishConfig: { access: "public" }`（scoped 包默认 private，必须显式 public）、`sideEffects: false`（利于 tree-shaking；preset-antd/runtime 有 DOM 副作用需单独核对）。版本 `0.0.0 → 0.1.0`。`files` 字段已有 `dist`，核对齐全。

### C. 治理文件（根目录）
- `LICENSE`：按选定协议 + 署名。
- `CONTRIBUTING.md`：开发环境（pnpm + Node>=18）、构建/测试命令、包边界原则（core 不认框架）、提交规范（中文 + 前缀）、PR 流程、语义化版本与 CHANGELOG 约定。
- `CHANGELOG.md`：初始条目（Unreleased / 0.1.0），记阶段 1-3 已达成的能力。
- 根 `README.md`：项目一句话主张、核心洞察（能力清单）、接入光谱三层、包一览表、快速开始、与 demo 关系、指向文档站与 RFC。

### D. CI（.github/workflows/ci.yml）
- 触发：push / PR 到 main。
- 步骤：checkout → pnpm install → `pnpm -r build` → `pnpm -r test`。
- Node 版本矩阵：18 + 20（engines 要求 >=18）。
- 不含 publish job（发布是红线，本轮不做自动发布）。

### E. VitePress 文档站（examples 外新建 `docs-site/`，纳入 workspace）
- 依赖：`vitepress`（devDep），独立 package.json。
- 结构：
  - 首页（Hero + 一句话主张 + 三个差异化卖点）
  - 指南：为什么做（提炼 RFC §1-2）、快速开始、接入光谱三层、安全模型、执行反馈闭环。
  - 各包 API 参考：core / scanner / react / vue / preset-*，每包「做什么、怎么用、依赖什么」。
  - **可交互 playground**：VitePress 支持在 Markdown 里嵌 Vue 组件。做一个「输入指令 → 展示 LLM 产出的操作计划 JSON → 高亮对应 manifest 能力」的静态演示（用预置 manifest + mock provider，不接真 LLM，避免 key 与红线）。这是 RFC 要求的 playground 的诚实最小实现。
- 文档站构建纳入 CI（`vitepress build` 通过即可，本轮不部署）。

## 落地顺序
1. 包元数据 + 命名转正记录（B + A）
2. 治理文件（C）
3. CI（D）
4. VitePress 文档站 + playground（E）
5. 全量验证：`pnpm -r build && pnpm -r test` 通过、`vitepress build` 通过、CI 配置本地 act 或肉眼核对
6. 更新 ROADMAP + RFC 附录 A

## 非目标
- 不执行 npm publish / 不打 release tag（红线，单独确认）。
- 不做文档站部署（Cloudflare Pages / GitHub Pages 都涉及外部操作，届时单独确认）。
- 不接真实 LLM 到 playground（避免 key 进前端）。
