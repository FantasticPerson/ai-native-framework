import type { Manifest } from './types';

/** 把能力清单压缩成给模型看的文本 */
function renderManifest(m: Manifest): string {
  const lines: string[] = [];
  for (const [name, mod] of Object.entries(m.modules)) {
    lines.push(`## 模块 ${name}（${mod.label}，路由 ${mod.route}）`);
    if (mod.actions.length) {
      lines.push('操作:');
      for (const a of mod.actions) lines.push(`  - ${a.id}：${a.label}`);
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
7. 只做用户要求的操作，不要多做。`;
}
