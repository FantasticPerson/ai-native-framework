import { describe, expect, it } from 'vitest';
import { parsePlan } from './plan';
import type { Manifest } from './types';

const manifest: Manifest = {
  generatedAt: 'test',
  modules: {
    leave: {
      label: '请假管理',
      route: '/leave',
      actions: [
        { id: 'leave.create', label: '新增' },
        { id: 'leave.submit', label: '提交' },
      ],
      fields: [
        { id: 'leave.type', label: '类型', type: 'select', options: ['事假'] },
        { id: 'leave.days', label: '天数', type: 'number' },
      ],
    },
  },
};

describe('parsePlan', () => {
  it('合法计划通过', () => {
    const raw = JSON.stringify({
      narration: 'ok',
      steps: [
        { type: 'navigate', module: 'leave' },
        { type: 'click', target: 'leave.create' },
        { type: 'fill', target: 'leave.days', value: '1' },
        { type: 'click', target: 'leave.submit' },
      ],
    });
    const { plan, error } = parsePlan(raw, manifest);
    expect(error).toBeUndefined();
    expect(plan?.steps).toHaveLength(4);
  });

  it('未知 action 报错', () => {
    const raw = JSON.stringify({ steps: [{ type: 'click', target: 'leave.unknown' }] });
    expect(parsePlan(raw, manifest).error).toMatch(/不存在/);
  });

  it('未知 module 报错', () => {
    const raw = JSON.stringify({ steps: [{ type: 'navigate', module: 'ghost' }] });
    expect(parsePlan(raw, manifest).error).toMatch(/不存在/);
  });

  it('非法 JSON 报错不抛异常', () => {
    expect(parsePlan('not json', manifest).error).toMatch(/JSON/);
  });

  it('缺 steps 报错', () => {
    expect(parsePlan(JSON.stringify({ narration: 'x' }), manifest).error).toMatch(/steps/);
  });

  it('fill 缺 value 报错', () => {
    const raw = JSON.stringify({ steps: [{ type: 'fill', target: 'leave.days' }] });
    expect(parsePlan(raw, manifest).error).toMatch(/value/);
  });

  it('未知 type 报错', () => {
    const raw = JSON.stringify({ steps: [{ type: 'teleport' }] });
    expect(parsePlan(raw, manifest).error).toMatch(/未知 type/);
  });
});
