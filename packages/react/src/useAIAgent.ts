import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildSystemPrompt,
  parsePlan,
  execute,
  domPresenter,
  type Manifest,
  type ManifestAction,
  type LLMProvider,
  type Presenter,
} from '@ai-native/core';
import { reactSetFieldValue } from './adapter';

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
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function useAIAgent(options: UseAIAgentOptions) {
  const { manifest, provider, presenter = domPresenter, stepDelay = 550, onConfirm } = options;
  const navigate = useNavigate();
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [narration, setNarration] = useState('');
  const [error, setError] = useState('');

  const routeOf = useCallback((name: string) => manifest.modules[name]?.route, [manifest]);
  const actionOf = useCallback(
    (id: string) => {
      for (const mod of Object.values(manifest.modules)) {
        const found = mod.actions.find((a) => a.id === id);
        if (found) return found;
      }
      return undefined;
    },
    [manifest],
  );
  const confirm = useCallback(
    (action: ManifestAction) =>
      onConfirm ? onConfirm(action) : window.confirm(`AI 即将执行「${action.label}」，是否继续？`),
    [onConfirm],
  );

  const run = useCallback(
    async (userText: string) => {
      setError('');
      setNarration('');
      setStatus('thinking');

      let text: string;
      try {
        text = await provider(buildSystemPrompt(manifest, today()), [
          { role: 'user', content: userText },
        ]);
      } catch (e) {
        setStatus('error');
        setError((e as Error).message);
        return;
      }

      const { plan, error: parseError } = parsePlan(text, manifest);
      if (!plan) {
        setStatus('error');
        setError(parseError ?? '无法解析模型输出');
        return;
      }

      setNarration(plan.narration);
      if (plan.steps.length === 0) {
        setStatus('done');
        return;
      }

      setStatus('executing');
      const result = await execute(plan, {
        adapter: { navigate, setFieldValue: reactSetFieldValue },
        routeOf,
        actionOf,
        confirm,
        presenter: presenter ?? undefined,
        onNarrate: setNarration,
        stepDelay,
      });

      if (!result.ok) {
        setStatus('error');
        setError(result.reason ?? '执行中断');
      } else {
        setStatus('done');
      }
    },
    [manifest, provider, presenter, stepDelay, navigate, routeOf, actionOf, confirm],
  );

  return { status, narration, error, run };
}
