// 能力清单（manifest）与操作序列（step）的公共类型。
// 这是 core 与外界的核心契约：scanner 产出符合 Manifest 的清单，
// LLM 产出符合 AIPlan 的序列，adapter 消费 Step 执行。

export interface ManifestAction {
  id: string;
  label: string;
}

export interface ManifestField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
}

export interface ManifestModule {
  label: string;
  route: string;
  actions: ManifestAction[];
  fields: ManifestField[];
}

export interface Manifest {
  generatedAt: string;
  modules: Record<string, ManifestModule>;
}

/** LLM 可编排的操作类型。故意保持最小闭集，越界的一律被 parsePlan 拒绝。 */
export type Step =
  | { type: 'navigate'; module: string }
  | { type: 'click'; target: string }
  | { type: 'fill'; target: string; value: string }
  | { type: 'wait'; ms?: number };

export interface AIPlan {
  narration: string;
  steps: Step[];
}
