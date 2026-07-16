import { describe, expect, it, beforeEach, vi } from 'vitest';
import { execute } from './executor';
import type { FrameworkAdapter } from './adapter';
import type { AIPlan } from './types';

// 测试用 adapter：记录 navigate 调用并真正切换 URL（贴近 react-router），setFieldValue 直接写 el.value
function mockAdapter(): FrameworkAdapter & { navigated: string[] } {
  const navigated: string[] = [];
  return {
    navigated,
    navigate(route) {
      navigated.push(route);
      history.pushState({}, '', route);
    },
    setFieldValue(el, value) {
      (el as HTMLInputElement).value = value;
    },
  };
}

// routeOf：从模块名查路由
const routeOf = (m: string) => (m === 'leave' ? '/leave' : undefined);

const delayMs = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  document.body.innerHTML = '';
  history.pushState({}, '', '/');
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

  it('navigate：无 data-ai-module 容器时，靠路由到达判定就绪（零改动接入）', async () => {
    const adapter = mockAdapter();
    // 页面上没有任何 data-ai-module 容器（模块清单来自扫路由，组件根节点是朴素 div）
    const plan: AIPlan = { narration: '', steps: [{ type: 'navigate', module: 'leave' }] };

    const result = await execute(plan, { adapter, routeOf, stepDelay: 0, navigateTimeout: 200 });

    expect(result.ok).toBe(true);
    expect(location.pathname).toBe('/leave');
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

  describe('字段定位与填值外置（适配非原生控件，如 antd）', () => {
    it('locateField：传入时覆盖默认的 data-ai-field 定位', async () => {
      const adapter = mockAdapter();
      // 页面上没有 data-ai-field，只有 antd 风格的 id
      const input = document.createElement('input');
      input.id = 'days';
      document.body.appendChild(input);

      const locateField = vi.fn(async (fieldId: string) =>
        fieldId === 'leave.days' ? document.querySelector('#days') : null,
      );
      const plan: AIPlan = { narration: '', steps: [{ type: 'fill', target: 'leave.days', value: '3' }] };
      const result = await execute(plan, { adapter, routeOf, stepDelay: 0, locateField });

      expect(locateField).toHaveBeenCalledWith('leave.days', expect.any(Number));
      expect(input.value).toBe('3');
      expect(result.ok).toBe(true);
    });

    it('setFieldValue 返回 Promise：executor 会 await 完成', async () => {
      const order: string[] = [];
      const input = document.createElement('input');
      input.setAttribute('data-ai-field', 'leave.type');
      document.body.appendChild(input);

      const adapter: FrameworkAdapter = {
        navigate() {},
        async setFieldValue(el, value) {
          await delayMs(20);
          (el as HTMLInputElement).value = value;
          order.push('filled');
        },
      };
      const plan: AIPlan = { narration: '', steps: [{ type: 'fill', target: 'leave.type', value: '事假' }] };
      const result = await execute(plan, { adapter, routeOf, stepDelay: 0 });

      expect(order).toEqual(['filled']);
      expect(input.value).toBe('事假');
      expect(result.ok).toBe(true);
    });

    it('readonly 控件（如 antd Select combobox）：一次性设值，不逐字打字', async () => {
      const calls: string[] = [];
      const input = document.createElement('input');
      input.setAttribute('data-ai-field', 'leave.type');
      input.setAttribute('readonly', '');
      input.setAttribute('role', 'combobox');
      document.body.appendChild(input);

      const adapter: FrameworkAdapter = {
        navigate() {},
        setFieldValue(_el, value) {
          calls.push(value);
        },
      };
      const plan: AIPlan = { narration: '', steps: [{ type: 'fill', target: 'leave.type', value: '事假' }] };
      // 带 presenter → 若是可逐字文本框会逐字调用；readonly 应一次性
      await execute(plan, {
        adapter,
        routeOf,
        stepDelay: 0,
        presenter: { begin() {}, end() {}, async moveTo() {}, highlight: () => () => {} },
      });

      expect(calls).toEqual(['事假']);
    });
  });

  describe('危险操作确认闸门', () => {
    function setupDangerBtn() {
      const btn = document.createElement('button');
      btn.setAttribute('data-ai-action', 'employees.delete');
      const onClick = vi.fn();
      btn.addEventListener('click', onClick);
      document.body.appendChild(btn);
      return onClick;
    }
    const actionOf = (id: string) =>
      id === 'employees.delete' ? { id, label: '删除员工', confirm: true } : { id, label: id };
    const plan: AIPlan = { narration: '', steps: [{ type: 'click', target: 'employees.delete' }] };

    it('confirm 返回 false：不点击，优雅中断', async () => {
      const adapter = mockAdapter();
      const onClick = setupDangerBtn();
      const confirm = vi.fn().mockResolvedValue(false);

      const result = await execute(plan, { adapter, routeOf, stepDelay: 0, actionOf, confirm });

      expect(confirm).toHaveBeenCalledOnce();
      expect(onClick).not.toHaveBeenCalled();
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/取消/);
    });

    it('confirm 返回 true：正常点击', async () => {
      const adapter = mockAdapter();
      const onClick = setupDangerBtn();
      const confirm = vi.fn().mockResolvedValue(true);

      const result = await execute(plan, { adapter, routeOf, stepDelay: 0, actionOf, confirm });

      expect(confirm).toHaveBeenCalledOnce();
      expect(onClick).toHaveBeenCalledOnce();
      expect(result.ok).toBe(true);
    });

    it('action.confirm 未设：不触发 confirm 回调', async () => {
      const adapter = mockAdapter();
      const btn = document.createElement('button');
      btn.setAttribute('data-ai-action', 'leave.submit');
      document.body.appendChild(btn);
      const confirm = vi.fn().mockResolvedValue(false);

      const safePlan: AIPlan = { narration: '', steps: [{ type: 'click', target: 'leave.submit' }] };
      const result = await execute(safePlan, { adapter, routeOf, stepDelay: 0, actionOf, confirm });

      expect(confirm).not.toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });

    it('需确认但未提供 confirm 回调：放行（策略缺省即放行，闸门是可选的）', async () => {
      const adapter = mockAdapter();
      const onClick = setupDangerBtn();

      const result = await execute(plan, { adapter, routeOf, stepDelay: 0, actionOf });

      expect(onClick).toHaveBeenCalledOnce();
      expect(result.ok).toBe(true);
    });
  });
});
