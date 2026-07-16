import { describe, expect, it, beforeEach, vi } from 'vitest';
import { runAgent } from './agent';
import type { FrameworkAdapter } from './adapter';
import type { Manifest } from './types';
import type { LLMProvider } from './provider';

const manifest: Manifest = {
  generatedAt: 'test',
  modules: {
    leave: {
      label: '请假',
      route: '/leave',
      actions: [{ id: 'leave.submit', label: '提交' }],
      fields: [{ id: 'leave.days', label: '天数', type: 'number' }],
    },
  },
};

const routeOf = (m: string) => (m === 'leave' ? '/leave' : undefined);

function mockAdapter(): FrameworkAdapter {
  return {
    navigate(route) {
      history.pushState({}, '', route);
    },
    setFieldValue(el, value) {
      (el as HTMLInputElement).value = value;
    },
  };
}

/** provider 依次返回给定文本（模拟多轮） */
function scriptedProvider(...responses: string[]): LLMProvider & { calls: number } {
  let i = 0;
  const fn = (async () => responses[Math.min(i++, responses.length - 1)]) as LLMProvider & {
    calls: number;
  };
  Object.defineProperty(fn, 'calls', { get: () => i });
  return fn;
}

const fillDaysPlan = JSON.stringify({
  narration: '填天数',
  steps: [{ type: 'fill', target: 'leave.days', value: '3' }],
});

beforeEach(() => {
  document.body.innerHTML = '';
  history.pushState({}, '', '/');
});

describe('runAgent（执行反馈闭环）', () => {
  it('首轮成功：provider 调一次，attempts=1', async () => {
    const input = document.createElement('input');
    input.setAttribute('data-ai-field', 'leave.days');
    document.body.appendChild(input);
    const provider = scriptedProvider(fillDaysPlan);

    const result = await runAgent('填 3 天', {
      manifest,
      provider,
      today: '2026-07-16',
      adapter: mockAdapter(),
      routeOf,
      stepDelay: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(1);
    expect(provider.calls).toBe(1);
    expect(input.value).toBe('3');
  });

  it('首轮定位失败、次轮成功：provider 调两次，第二次带反馈', async () => {
    // 第一次 plan 指向不存在的字段被 execute 定位失败；第二次修正为 leave.days
    // 注意：leave.ghost 不在 manifest → parsePlan 会先拦。为触发 execute 定位失败，
    // 用合法字段但页面上无对应元素的场景。
    const provider = scriptedProvider(fillDaysPlan, fillDaysPlan);
    const systemSeen: string[] = [];
    const messagesSeen: unknown[][] = [];
    const spyProvider: LLMProvider = async (system, messages) => {
      systemSeen.push(system);
      messagesSeen.push(messages);
      return provider(system, messages);
    };

    // 首轮：页面无 input，定位失败
    const runPromise = runAgent('填 3 天', {
      manifest,
      provider: spyProvider,
      today: '2026-07-16',
      adapter: mockAdapter(),
      routeOf,
      stepDelay: 0,
      locateTimeout: 30,
      onAttempt: (n) => {
        // 第二轮开始前把 input 放进页面，模拟"页面就绪后重试成功"
        if (n === 2) {
          const input = document.createElement('input');
          input.setAttribute('data-ai-field', 'leave.days');
          document.body.appendChild(input);
        }
      },
    });
    const result = await runPromise;

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
    expect(provider.calls).toBe(2);
    // 第二次调用的 messages 应含反馈（不止一条 user 消息）
    expect(messagesSeen[1].length).toBeGreaterThan(1);
  });

  it('用户取消不重试：provider 只调一次', async () => {
    const dangerManifest: Manifest = {
      generatedAt: 'test',
      modules: {
        leave: {
          label: '请假',
          route: '/leave',
          actions: [{ id: 'leave.del', label: '删除', confirm: true }],
          fields: [],
        },
      },
    };
    const btn = document.createElement('button');
    btn.setAttribute('data-ai-action', 'leave.del');
    document.body.appendChild(btn);
    const plan = JSON.stringify({ narration: '删', steps: [{ type: 'click', target: 'leave.del' }] });
    const provider = scriptedProvider(plan);

    const result = await runAgent('删掉', {
      manifest: dangerManifest,
      provider,
      today: '2026-07-16',
      adapter: mockAdapter(),
      routeOf,
      stepDelay: 0,
      actionOf: (id) => (id === 'leave.del' ? { id, label: '删除', confirm: true } : undefined),
      confirm: async () => false,
    });

    expect(result.ok).toBe(false);
    expect(result.kind).toBe('user-cancelled');
    expect(result.attempts).toBe(1);
    expect(provider.calls).toBe(1);
  });

  it('解析失败也回流并计入尝试：首次非法 JSON，次轮成功', async () => {
    const input = document.createElement('input');
    input.setAttribute('data-ai-field', 'leave.days');
    document.body.appendChild(input);
    const provider = scriptedProvider('这不是 JSON', fillDaysPlan);

    const result = await runAgent('填 3 天', {
      manifest,
      provider,
      today: '2026-07-16',
      adapter: mockAdapter(),
      routeOf,
      stepDelay: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
    expect(provider.calls).toBe(2);
  });

  it('达上限仍失败：ok=false，reason 含尝试次数', async () => {
    // 页面始终无 input，每轮都定位失败
    const provider = scriptedProvider(fillDaysPlan, fillDaysPlan, fillDaysPlan, fillDaysPlan);

    const result = await runAgent('填 3 天', {
      manifest,
      provider,
      today: '2026-07-16',
      adapter: mockAdapter(),
      routeOf,
      stepDelay: 0,
      locateTimeout: 20,
      maxAttempts: 3,
    });

    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(3);
    expect(provider.calls).toBe(3);
    expect(result.reason).toMatch(/3/);
  });

  it('空 steps（模型判定无法完成）：不算失败，ok=true 直接返回', async () => {
    const plan = JSON.stringify({ narration: '做不到', steps: [] });
    const provider = scriptedProvider(plan);

    const result = await runAgent('干件清单外的事', {
      manifest,
      provider,
      today: '2026-07-16',
      adapter: mockAdapter(),
      routeOf,
      stepDelay: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(1);
    expect(provider.calls).toBe(1);
    expect(result.finalPlan?.steps).toEqual([]);
  });
});
