import type { AIPlan, Manifest } from './types';
import type { ExecuteOptions, ExecuteResult } from './executor';
import type { LLMProvider, ChatMessage } from './provider';
import { execute } from './executor';
import { parsePlan } from './plan';
import { buildSystemPrompt, buildRetryFeedback } from './prompt';

// runAgent 需要的执行参数：ExecuteOptions 去掉 adapter 之外都可选，这里整体复用。
// manifest/provider/today 是闭环额外需要的。
export interface RunAgentOptions extends ExecuteOptions {
  /** 能力清单（构建 system prompt + 校验 plan） */
  manifest: Manifest;
  /** LLM provider */
  provider: LLMProvider;
  /** 今天日期 YYYY-MM-DD，注入 prompt 供相对日期换算 */
  today: string;
  /** 最大尝试次数（含首轮），默认 3。达上限仍失败则终止。 */
  maxAttempts?: number;
  /** 每轮尝试开始时回调（attempt 从 1 计）。用于展示"第 N 次尝试"。 */
  onAttempt?: (attempt: number, plan?: AIPlan) => void;
}

export interface AgentRunResult {
  ok: boolean;
  /** 实际尝试轮数 */
  attempts: number;
  /** 最后一次解析成功的计划（若解析都失败则为 undefined） */
  finalPlan?: AIPlan;
  /** 失败原因 */
  reason?: string;
  /** 失败分类（沿用 executor 的 StopKind，或 'parse-failed'） */
  kind?: ExecuteResult['kind'] | 'parse-failed';
}

/**
 * 执行反馈闭环：规划 → 执行 → 失败则把结果回流 LLM 重规划，最多 maxAttempts 轮。
 * 纯编排、零框架依赖（execute 需要 DOM），headless/MCP 亦可复用。
 *
 * 不重试的情形：用户取消危险操作（user-cancelled，用户明确意志）、执行成功、空计划。
 */
export async function runAgent(userText: string, opts: RunAgentOptions): Promise<AgentRunResult> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const system = buildSystemPrompt(opts.manifest, opts.today);
  const messages: ChatMessage[] = [{ role: 'user', content: userText }];

  let lastPlan: AIPlan | undefined;
  let lastReason = '';
  let lastKind: AgentRunResult['kind'];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    opts.onAttempt?.(attempt, lastPlan);

    const raw = await opts.provider(system, messages);
    const { plan, error } = parsePlan(raw, opts.manifest);

    if (!plan) {
      // 解析失败：把原始输出与错误回流，计入尝试
      lastReason = error ?? '模型输出无法解析';
      lastKind = 'parse-failed';
      messages.push({ role: 'assistant', content: raw });
      messages.push({
        role: 'user',
        content: buildRetryFeedback(userText, { narration: '', steps: [] }, { ok: false, reason: lastReason }),
      });
      continue;
    }

    lastPlan = plan;

    // 空计划：模型判定无法完成或无需操作，不算失败，直接返回
    if (plan.steps.length === 0) {
      return { ok: true, attempts: attempt, finalPlan: plan };
    }

    const result = await execute(plan, opts);
    if (result.ok) {
      return { ok: true, attempts: attempt, finalPlan: plan };
    }

    lastReason = result.reason ?? '执行中断';
    lastKind = result.kind;

    // 用户取消：明确意志，不重试
    if (result.kind === 'user-cancelled') {
      return { ok: false, attempts: attempt, finalPlan: plan, reason: lastReason, kind: result.kind };
    }

    // 可修正失败：回流反馈，进入下一轮
    messages.push({ role: 'assistant', content: raw });
    messages.push({ role: 'user', content: buildRetryFeedback(userText, plan, result) });
  }

  return {
    ok: false,
    attempts: maxAttempts,
    finalPlan: lastPlan,
    reason: `尝试 ${maxAttempts} 次仍未完成：${lastReason}`,
    kind: lastKind,
  };
}
