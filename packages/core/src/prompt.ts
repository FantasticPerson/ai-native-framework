import type { Manifest, AIPlan, Step } from './types';

/** 把能力清单压缩成给模型看的文本 */
function renderManifest(m: Manifest): string {
  const lines: string[] = [];
  for (const [name, mod] of Object.entries(m.modules)) {
    lines.push(`## 模块 ${name}（${mod.label}，路由 ${mod.route}）`);
    if (mod.actions.length) {
      lines.push('操作:');
      for (const a of mod.actions) lines.push(`  - ${a.id}：${a.label}${a.confirm ? '（危险操作，需用户确认）' : ''}`);
    }
    if (mod.fields.length) {
      lines.push('字段:');
      for (const f of mod.fields) {
        const opt = f.options ? `，可选值[${f.options.join('/')}]` : '';
        lines.push(`  - ${f.id}：${f.label}（${f.type}${opt}）`);
      }
    }
  }
  return lines.join('\n');
}

/**
 * 组装 system prompt：注入能力清单、输出 schema、约束。
 * today 由调用方传入，避免模型算错「明天」等相对日期。
 */
export function buildSystemPrompt(manifest: Manifest, today: string): string {
  return `你是一个管理系统的 AI 操作助手。用户用自然语言下达指令，你要把它翻译成一串对页面元素的操作步骤，让系统自动执行。

今天的日期是 ${today}。遇到「明天」「下周」等相对日期，请换算成 YYYY-MM-DD 格式。

# 你能操作的能力清单
${renderManifest(manifest)}

# 输出格式
只输出一个 JSON 对象，不要任何多余文字，结构如下：
{
  "narration": "对用户的简短自然语言回应，说明你正在做什么",
  "steps": [
    { "type": "navigate", "module": "模块名" },
    { "type": "click", "target": "操作id" },
    { "type": "fill", "target": "字段id", "value": "要填入的值" },
    { "type": "wait", "ms": 300 }
  ]
}

# 规则
1. target 必须是清单里存在的 操作id 或 字段id，module 必须是清单里的模块名，禁止编造。
2. 操作前先 navigate 到目标模块，再执行该模块内的 click/fill。
3. 新增类操作的顺序通常是：navigate → 点击新增(打开表单) → 逐个 fill 字段 → 点击提交。
4. select 类型字段的 value 必须是其可选值之一。
5. 数字字段的 value 也用字符串表示，如 "1"。
6. 如果用户的指令无法用清单里的能力完成，返回空 steps 数组，并在 narration 中说明原因。
7. 只做用户要求的操作，不要多做。
8. 标注「危险操作」的步骤，系统会在执行前请用户二次确认；你仍可正常编排，无需回避。`;
}

/** 把一个 step 渲染成人类可读的一行，供反馈文本引用 */
function describeStep(step: Step): string {
  switch (step.type) {
    case 'navigate':
      return `navigate → 模块 ${step.module}`;
    case 'click':
      return `click → ${step.target}`;
    case 'fill':
      return `fill → ${step.target} = "${step.value}"`;
    case 'wait':
      return `wait ${step.ms ?? 300}ms`;
  }
}

/** 执行反馈所需的最小失败信息（ExecuteResult 的子集，避免 prompt 依赖 executor） */
export interface RetryContext {
  ok: boolean;
  stoppedAt?: number;
  reason?: string;
  kind?: string;
}

/**
 * 构造回流给 LLM 的执行反馈文本，用于失败后重规划。
 * 不重复 manifest（已在 system prompt 里），只给「原指令 + 上次计划 + 失败点 + 已成功步骤」。
 */
export function buildRetryFeedback(userText: string, lastPlan: AIPlan, result: RetryContext): string {
  const lines: string[] = [];
  lines.push(`我按你上一次的计划执行，但没有完成。请修正后重新输出完整的 JSON 计划。`);
  lines.push('');
  lines.push(`用户的原始指令：${userText}`);
  lines.push('');

  if (typeof result.stoppedAt === 'number' && lastPlan.steps.length > 0) {
    const done = lastPlan.steps.slice(0, result.stoppedAt);
    if (done.length) {
      lines.push('已成功完成的步骤（无需重复执行）：');
      done.forEach((s, i) => lines.push(`  ${i + 1}. ${describeStep(s)}`));
    }
    const failed = lastPlan.steps[result.stoppedAt];
    if (failed) {
      lines.push('');
      lines.push(`失败在第 ${result.stoppedAt + 1} 步：${describeStep(failed)}`);
    }
  }

  lines.push('');
  lines.push(`失败原因：${result.reason ?? '未知'}`);
  lines.push('');
  lines.push('请重新输出一个完整的计划（从头开始的 steps，系统会重新执行）。如果这个目标本身无法用能力清单完成，返回空 steps 并在 narration 说明。');
  return lines.join('\n');
}
