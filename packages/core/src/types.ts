// 能力清单（manifest）与操作序列（step）的公共类型。
// 这是 core 与外界的核心契约：scanner 产出符合 Manifest 的清单，
// LLM 产出符合 AIPlan 的序列，adapter 消费 Step 执行。

export interface ManifestAction {
  id: string;
  label: string;
  /** 危险操作（删除、提交等）执行前需用户确认。由 data-ai-confirm 标注，默认关闭。 */
  confirm?: boolean;
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

/**
 * 模块定义：preset（生产者，如 preset-react-router 扫路由）与 scanner（消费者，
 * 聚合能力清单）之间的构建期契约。label 可缺省——路由本身不编码人类可读名称，
 * 缺省时由 scanner 回退到 name（诚实的边界，见 RFC §4 三层接入光谱）。
 */
export interface ModuleDef {
  name: string;
  label?: string;
  route: string;
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
