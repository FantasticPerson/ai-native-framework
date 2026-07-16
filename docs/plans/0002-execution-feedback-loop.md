# 计划：执行反馈闭环（阶段 2）

## 背景与目标

当前一步失败（定位不到元素 / 用户取消 / 校验越界）执行就中断，`setError` 停住，用户只能重新组织语言从头再来。RFC 开放问题 #2 要求：**执行失败后把结果结构化回流给 LLM 重规划**，让 AI 从「一次性猜对」升级为「失败可自我修正」。

目标：在失败后，把「原指令 + 已执行到第几步 + 失败原因」回流 LLM，让它产出修正计划，自动重试，最多 N 轮；防死循环；全程可见可中断（对齐「可见可控」定位）。

## 非目标（诚实边界）

- 不做多轮对话式追问（"你是指哪个员工？"）——那是另一个功能，本闭环只处理「执行失败→重规划」。
- 不做跨会话记忆。
- 不改 parsePlan 白名单校验语义——越界仍然拒，只是拒的结果现在会回流。

## 设计决策

### 决策 1：闭环放 core，不放 react

重规划循环是纯编排（provider 调用 + parsePlan + execute + 判断是否重试），零框架依赖。放 core 的好处：
- headless / 未来 MCP server 直接复用（RFC 明确要求 core 支持 headless）。
- 可单测（不需要 React 渲染环境）。
- react 的 useAIAgent 变薄，只做状态映射。

新增 `packages/core/src/agent.ts`，导出 `runAgent()`。executor 的 `execute` 不变（单次执行），`runAgent` 在其上加重规划循环。

### 决策 2：失败结果结构化，而非塞字符串

execute 已返回 `{ ok, stoppedAt, reason }`。回流时构造一条结构化的「执行反馈」消息给 LLM，包含：
- 原始用户指令
- 上一次的完整 plan（narration + steps）
- 失败在第几步（stoppedAt）、失败步骤内容、失败原因（reason）
- 已成功执行的步骤（让 LLM 知道哪些已生效，避免重复填写）

以 ChatMessage 追加到对话历史，让 LLM 在完整上下文里重规划。

### 决策 3：用户取消（confirm=false）不重试

危险操作被用户拒绝是「用户的明确意志」，不是「AI 猜错」。重试会变成骚扰。execute 的 reason 里已能区分（`用户取消了操作「…」`）。方案：给 ExecuteResult 加一个语义化的 `stoppedReason` 判别，而非字符串匹配。

改 `ExecuteResult` 增加 `kind?: 'locate-failed' | 'user-cancelled' | 'unknown-module'`（executor 已知道自己因何失败，直接标注，比事后 regex 可靠）。`runAgent` 只对「AI 可通过重规划修正」的 kind 重试（locate-failed / unknown-module / 解析失败），user-cancelled 直接终止返回。

### 决策 4：重试上限 + 收敛判断

- 默认 `maxAttempts: 3`（1 次初始 + 2 次重试）。可配。
- 每轮把反馈追加进 messages，LLM 看得到自己前几次的失败，避免原地打转。
- 若某轮解析失败（模型输出非法 JSON / 越界），也算一次失败反馈回流，同样计入 attempts。
- 达到上限仍失败 → 返回最终失败结果，narration 说明「尝试 N 次仍未完成：<最后原因>」。

### 决策 5：可见性——每轮通知

`runAgent` 接受 `onAttempt?(attempt, plan)` 与沿用 execute 的 `onNarrate`。react 侧把「第 2 次尝试…」映射到 AIBar 的状态区，让用户看到 AI 在重试而非卡死。

## 改动清单

### core（TDD，先写测试）

1. **types.ts**：`ExecuteResult` 加 `kind?: StopKind`；导出 `StopKind` 类型。
2. **executor.ts**：三处失败返回补 `kind`：
   - 定位失败 → `kind: 'locate-failed'`
   - 用户取消 → `kind: 'user-cancelled'`
   - 未知模块 → `kind: 'unknown-module'`
3. **agent.ts（新增）**：`runAgent(userText, opts): Promise<AgentRunResult>`
   - opts：`manifest, provider, today, execute 所需的全部 ExecuteOptions, maxAttempts?, onAttempt?`
   - 循环：build prompt（首轮）/ 追加反馈（后续）→ provider → parsePlan → execute → 判断 kind → 重试或终止
   - 返回 `{ ok, attempts, finalPlan, reason?, kind? }`
   - 纯逻辑 + DOM（execute 需要 DOM），测试用 mock provider + jsdom
4. **prompt.ts（新增导出）**：`buildRetryFeedback(userText, lastPlan, result): string` —— 构造回流给 LLM 的反馈文本。独立函数便于单测。
5. **index.ts**：导出 `runAgent`、相关类型。

### react

6. **useAIAgent.ts**：`run` 内部改调 `runAgent`（替换现在的手写 provider→parsePlan→execute 三段），新增 `attempt` 状态暴露；`UseAIAgentOptions` 加 `maxAttempts?`。保持对外 API 兼容（status/narration/error/run 不变，多一个可选 attempt）。

### demo

7. 无需改代码（闭环默认开启，maxAttempts 默认 3）。可选：AIBar 状态区显示第几次尝试——若 react 暴露了 attempt 就顺带展示。

## 测试计划

core/agent.test.ts（jsdom + mock provider）：
- 首轮成功：provider 返回合法 plan，execute 成功 → attempts=1, ok=true，provider 只调一次。
- 首轮定位失败、次轮成功：第一次 plan 指向不存在的元素（execute 返回 locate-failed），第二次修正 → attempts=2, ok=true，provider 调两次，第二次 messages 含反馈。
- 用户取消不重试：execute 返回 user-cancelled → attempts=1, ok=false, provider 只调一次（不回流）。
- 解析失败回流：provider 首次返回非法 JSON → 计一次失败并回流，次轮成功。
- 达上限失败：连续失败到 maxAttempts → ok=false，reason 含尝试次数。

prompt.test.ts：buildRetryFeedback 包含用户指令、失败步骤、失败原因、已成功步骤。

executor.test.ts：现有失败用例补断言 `kind` 正确。

## 验证方式

- `pnpm -r test` 全绿（新增 agent/prompt 用例 + executor kind 断言）。
- `pnpm -r build` 全量构建通过。
- 浏览器运行时验证（人工）：故意造一个 LLM 易错场景（如指令含清单里没有的字段），观察 AI 是否重试并在 AIBar 显示尝试轮次、最终优雅告知。

## 风险

- **重试放大 token 消耗**：每轮带完整历史。用 maxAttempts=3 兜底；反馈文本保持精简（不重复整个 manifest，manifest 已在 system prompt 里）。
- **模型可能反复犯同一错**：反馈里显式列出「上次因 X 失败」，且历史累积让模型看到多次失败，靠上限终止。
- **execute 需要 DOM，agent 测试依赖 jsdom**：core 已有 jsdom 配置，沿用。
