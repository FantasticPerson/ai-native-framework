import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildSystemPrompt,
  parsePlan,
  execute,
  domPresenter,
  type Manifest,
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
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function useAIAgent(options: UseAIAgentOptions) {
  const { manifest, provider, presenter = domPresenter, stepDelay = 550 } = options;
  const navigate = useNavigate();
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [narration, setNarration] = useState('');
  const [error, setError] = useState('');

  const routeOf = useCallback((name: string) => manifest.modules[name]?.route, [manifest]);

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
    [manifest, provider, presenter, stepDelay, navigate, routeOf],
  );

  return { status, narration, error, run };
}
