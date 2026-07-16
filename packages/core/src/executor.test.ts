import { describe, expect, it, beforeEach, vi } from 'vitest';
import { execute } from './executor';
import type { FrameworkAdapter } from './adapter';
import type { AIPlan } from './types';

// 测试用 adapter：记录 navigate 调用，setFieldValue 直接写 el.value
function mockAdapter(): FrameworkAdapter & { navigated: string[] } {
  const navigated: string[] = [];
  return {
    navigated,
    navigate(route) {
      navigated.push(route);
    },
    setFieldValue(el, value) {
      (el as HTMLInputElement).value = value;
    },
  };
}

// routeOf：从模块名查路由
const routeOf = (m: string) => (m === 'leave' ? '/leave' : undefined);

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('execute', () => {
  it('navigate：调用 adapter.navigate 并等待模块出现', async () => {
    const adapter = mockAdapter();
    // navigate 后模块容器需出现，这里预先放好模拟「已就绪」
    document.body.innerHTML = '<div data-ai-module="leave"></div>';
    const plan: AIPlan = { narration: '', steps: [{ type: 'navigate', module: 'leave' }] };

    const result = await execute(plan, { adapter, routeOf, stepDelay: 0 });

    expect(result.ok).toBe(true);
    expect(adapter.navigated).toEqual(['/leave']);
  });

  it('click：定位 data-ai-action 并触发点击', async () => {
    const adapter = mockAdapter();
    const btn = document.createElement('button');
    btn.setAttribute('data-ai-action', 'leave.submit');
    const onClick = vi.fn();
    btn.addEventListener('click', onClick);
    document.body.appendChild(btn);

    const plan: AIPlan = { narration: '', steps: [{ type: 'click', target: 'leave.submit' }] };
    const result = await execute(plan, { adapter, routeOf, stepDelay: 0 });

    expect(result.ok).toBe(true);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('fill：定位 data-ai-field 并通过 adapter 填值', async () => {
    const adapter = mockAdapter();
    const input = document.createElement('input');
    input.setAttribute('data-ai-field', 'leave.days');
    document.body.appendChild(input);

    const plan: AIPlan = { narration: '', steps: [{ type: 'fill', target: 'leave.days', value: '3' }] };
    const result = await execute(plan, { adapter, routeOf, stepDelay: 0 });

    expect(result.ok).toBe(true);
    expect(input.value).toBe('3');
  });

  it('找不到元素：优雅中断，返回 stoppedAt 与 reason', async () => {
    const adapter = mockAdapter();
    const plan: AIPlan = { narration: '', steps: [{ type: 'click', target: 'ghost.action' }] };

    const result = await execute(plan, { adapter, routeOf, stepDelay: 0, locateTimeout: 50 });

    expect(result.ok).toBe(false);
    expect(result.stoppedAt).toBe(0);
    expect(result.reason).toMatch(/找不到元素/);
  });

  it('未知模块路由：navigate 中断', async () => {
    const adapter = mockAdapter();
    const plan: AIPlan = { narration: '', steps: [{ type: 'navigate', module: 'ghost' }] };

    const result = await execute(plan, { adapter, routeOf, stepDelay: 0 });

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/未知模块/);
  });

  it('presenter 可选：不传也能 headless 执行', async () => {
    const adapter = mockAdapter();
    const input = document.createElement('input');
    input.setAttribute('data-ai-field', 'leave.days');
    document.body.appendChild(input);

    const plan: AIPlan = { narration: '', steps: [{ type: 'fill', target: 'leave.days', value: 'x' }] };
    // 不传 presenter
    const result = await execute(plan, { adapter, routeOf, stepDelay: 0 });
    expect(result.ok).toBe(true);
  });

  it('presenter：注入时在 click 前后被调用', async () => {
    const adapter = mockAdapter();
    const btn = document.createElement('button');
    btn.setAttribute('data-ai-action', 'leave.submit');
    document.body.appendChild(btn);

    const begin = vi.fn();
    const end = vi.fn();
    const moveTo = vi.fn().mockResolvedValue(undefined);
    const clearHl = vi.fn();
    const highlight = vi.fn().mockReturnValue(clearHl);

    const plan: AIPlan = { narration: '', steps: [{ type: 'click', target: 'leave.submit' }] };
    await execute(plan, {
      adapter,
      routeOf,
      stepDelay: 0,
      presenter: { begin, end, moveTo, highlight },
    });

    expect(begin).toHaveBeenCalledOnce();
    expect(moveTo).toHaveBeenCalledWith(btn);
    expect(highlight).toHaveBeenCalledWith(btn);
    expect(clearHl).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledOnce();
  });
});
