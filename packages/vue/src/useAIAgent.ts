import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  runAgent,
  domPresenter,
  type Manifest,
  type ManifestAction,
  type LLMProvider,
  type Presenter,
} from '@ai-native/core';
import { vueSetFieldValue } from './adapter';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'done' | 'error';

export interface UseAIAgentOptions {
  /** 能力清单（由 scanner 生成的 ai-manifest.json） */
  manifest: Manifest;
  /** LLM provider，如 createHttpProvider({ endpoint: '/api/chat' }) */
  provider: LLMProvider;
  /** 可见演出，默认用 core 的 domPresenter；传 null 关闭演出 */
  presenter?: Presenter | null;
  /** 步骤间隔（ms），默认 550 */
  stepDelay?: number;
  /**
   * 危险操作（manifest 里标了 confirm）执行前的确认回调，返回 false 则中断。
   * 默认用 window.confirm 兜底；宿主可传自定义实现弹自己的 Modal。
   */
  onConfirm?: (action: ManifestAction) => boolean | Promise<boolean>;
  /**
   * 字段适配器：覆盖非原生控件的定位与填值（如 UI 组件库）。
   * 不传则用默认 data-ai-field 定位 + Vue 原生填值。
   */
  fieldAdapter?: {
    locateField(fieldId: string, timeout: number): Promise<Element | null>;
    setFieldValue(el: Element, value: string): void | Promise<void>;
  };
  /** 执行失败后自动重规划的最大尝试次数（含首轮），默认 3。传 1 关闭闭环重试。 */
  maxAttempts?: number;
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Vue 版 useAIAgent：与 React 版 API 形状一致，内部调同一个 core 的 runAgent。
 * 差异只在框架惯用法——用 ref 管状态、用 vue-router 的 push 做 navigate。
 * 这份 composable 不改 core 一行，正是「内核框架无关」的反证。
 */
export function useAIAgent(options: UseAIAgentOptions) {
  const {
    manifest,
    provider,
    presenter = domPresenter,
    stepDelay = 550,
    onConfirm,
    fieldAdapter,
    maxAttempts,
  } = options;
  const router = useRouter();
  const status = ref<AgentStatus>('idle');
  const narration = ref('');
  const error = ref('');
  const attempt = ref(0);

  const routeOf = (name: string) => manifest.modules[name]?.route;
  const actionOf = (id: string) => {
    for (const mod of Object.values(manifest.modules)) {
      const found = mod.actions.find((a) => a.id === id);
      if (found) return found;
    }
    return undefined;
  };
  const confirm = (action: ManifestAction) =>
    onConfirm ? onConfirm(action) : window.confirm(`AI 即将执行「${action.label}」，是否继续？`);

  const run = async (userText: string) => {
    error.value = '';
    narration.value = '';
    attempt.value = 0;
    status.value = 'thinking';

    let result;
    try {
      result = await runAgent(userText, {
        manifest,
        provider,
        today: today(),
        maxAttempts,
        adapter: {
          navigate: (route: string) => {
            void router.push(route);
          },
          setFieldValue: fieldAdapter ? fieldAdapter.setFieldValue : vueSetFieldValue,
        },
        routeOf,
        actionOf,
        confirm,
        locateField: fieldAdapter?.locateField,
        presenter: presenter ?? undefined,
        onNarrate: (t) => {
          narration.value = t;
        },
        stepDelay,
        onAttempt: (n) => {
          attempt.value = n;
          status.value = n === 1 ? 'thinking' : 'executing';
          if (n > 1) narration.value = `第 ${n} 次尝试…`;
        },
      });
    } catch (e) {
      status.value = 'error';
      error.value = (e as Error).message;
      return;
    }

    if (result.finalPlan) narration.value = result.finalPlan.narration;
    if (result.ok) {
      status.value = 'done';
    } else {
      status.value = 'error';
      error.value = result.reason ?? '执行中断';
    }
  };

  return { status, narration, error, attempt, run };
}
