import type { AIPlan, Manifest, Step } from './types';

interface ManifestIndex {
  actionIds: Set<string>;
  fieldIds: Set<string>;
  moduleNames: Set<string>;
}

function indexManifest(m: Manifest): ManifestIndex {
  const actionIds = new Set<string>();
  const fieldIds = new Set<string>();
  const moduleNames = new Set<string>(Object.keys(m.modules));
  for (const mod of Object.values(m.modules)) {
    mod.actions.forEach((a) => actionIds.add(a.id));
    mod.fields.forEach((f) => fieldIds.add(f.id));
  }
  return { actionIds, fieldIds, moduleNames };
}

/**
 * 解析并校验 LLM 返回的原始文本为 AIPlan。
 * 校验：合法 JSON、steps 数组、每个 step 的 type/target/module 都在 manifest 白名单内。
 * 越界即拒——这是「高准确率」护城河的运行时保障。失败返回 { error }，不抛异常。
 */
export function parsePlan(raw: string, manifest: Manifest): { plan?: AIPlan; error?: string } {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return { error: '模型输出不是合法 JSON' };
  }

  const o = obj as { narration?: unknown; steps?: unknown };
  if (!Array.isArray(o.steps)) {
    return { error: '缺少 steps 数组' };
  }

  const idx = indexManifest(manifest);
  const steps: Step[] = [];

  for (let i = 0; i < o.steps.length; i++) {
    const s = o.steps[i] as Record<string, unknown>;
    const type = s.type;
    if (type === 'navigate') {
      if (typeof s.module !== 'string' || !idx.moduleNames.has(s.module)) {
        return { error: `第 ${i + 1} 步 navigate 的模块「${String(s.module)}」不存在` };
      }
      steps.push({ type: 'navigate', module: s.module });
    } else if (type === 'click') {
      if (typeof s.target !== 'string' || !idx.actionIds.has(s.target)) {
        return { error: `第 ${i + 1} 步 click 的操作「${String(s.target)}」不存在` };
      }
      steps.push({ type: 'click', target: s.target });
    } else if (type === 'fill') {
      if (typeof s.target !== 'string' || !idx.fieldIds.has(s.target)) {
        return { error: `第 ${i + 1} 步 fill 的字段「${String(s.target)}」不存在` };
      }
      if (typeof s.value !== 'string') {
        return { error: `第 ${i + 1} 步 fill 缺少 value` };
      }
      steps.push({ type: 'fill', target: s.target, value: s.value });
    } else if (type === 'wait') {
      steps.push({ type: 'wait', ms: typeof s.ms === 'number' ? s.ms : undefined });
    } else {
      return { error: `第 ${i + 1} 步存在未知 type「${String(type)}」` };
    }
  }

  return { plan: { narration: typeof o.narration === 'string' ? o.narration : '', steps } };
}
