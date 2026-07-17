import { describe, it, expect, vi } from 'vitest';
import type { Manifest, LLMProvider } from '@ai-operable/core';
import { useAIAgent } from './useAIAgent';

// mock vue-router 的 useRouter：composable 内部用它做 navigate
const push = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}));

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

describe('useAIAgent (vue)', () => {
  it('run 调用 core runAgent：provider 产出计划后 navigate 被触发，状态收敛为 done', async () => {
    push.mockClear();
    // 模拟切页后目标模块已渲染（executor 用 [data-ai-module] 判断页面就绪）
    document.body.innerHTML = '<div data-ai-module="leave"></div>';
    // provider 返回一个只切页的计划（无 fill/click，避免依赖 DOM 定位）
    const provider: LLMProvider = async () =>
      JSON.stringify({ narration: '正在切到请假', steps: [{ type: 'navigate', module: 'leave' }] });

    const agent = useAIAgent({ manifest, provider, presenter: null });
    expect(agent.status.value).toBe('idle');

    await agent.run('去请假页');

    expect(push).toHaveBeenCalledWith('/leave');
    expect(agent.status.value).toBe('done');
  });

  it('provider 抛错时状态为 error 并记录信息', async () => {
    const provider: LLMProvider = async () => {
      throw new Error('上游 500');
    };
    const agent = useAIAgent({ manifest, provider, presenter: null });
    await agent.run('随便');
    expect(agent.status.value).toBe('error');
    expect(agent.error.value).toContain('500');
  });
});
