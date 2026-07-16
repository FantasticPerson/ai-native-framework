import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, buildRetryFeedback } from './prompt';
import type { Manifest, AIPlan } from './types';

const manifest: Manifest = {
  generatedAt: 'test',
  modules: {
    employees: {
      label: '员工管理',
      route: '/employees',
      actions: [
        { id: 'employees.create', label: '新增员工' },
        { id: 'employees.delete', label: '删除员工', confirm: true },
      ],
      fields: [],
    },
  },
};

describe('buildSystemPrompt', () => {
  it('注入日期与能力清单', () => {
    const p = buildSystemPrompt(manifest, '2026-07-16');
    expect(p).toContain('2026-07-16');
    expect(p).toContain('employees.create');
    expect(p).toContain('员工管理');
  });

  it('危险操作被标注，普通操作不标注', () => {
    const p = buildSystemPrompt(manifest, '2026-07-16');
    expect(p).toContain('employees.delete：删除员工（危险操作，需用户确认）');
    expect(p).toContain('employees.create：新增员工\n');
  });
});

describe('buildRetryFeedback', () => {
  const lastPlan: AIPlan = {
    narration: '正在新增员工',
    steps: [
      { type: 'navigate', module: 'employees' },
      { type: 'click', target: 'employees.create' },
      { type: 'fill', target: 'employees.ghost', value: '张三' },
    ],
  };

  it('包含用户原始指令、失败步骤、失败原因', () => {
    const fb = buildRetryFeedback('新增员工张三', lastPlan, {
      ok: false,
      stoppedAt: 2,
      reason: '找不到元素 employees.ghost',
      kind: 'locate-failed',
    });
    expect(fb).toContain('新增员工张三');
    expect(fb).toContain('找不到元素 employees.ghost');
    // 失败步骤（第 3 步）应被点名
    expect(fb).toContain('employees.ghost');
  });

  it('列出已成功的步骤，提示无需重复', () => {
    const fb = buildRetryFeedback('新增员工张三', lastPlan, {
      ok: false,
      stoppedAt: 2,
      reason: '找不到元素 employees.ghost',
      kind: 'locate-failed',
    });
    // 前两步已成功
    expect(fb).toContain('employees.create');
    expect(fb).toMatch(/已(成功|完成)/);
  });

  it('解析失败（无 stoppedAt）：仍给出可用反馈', () => {
    const fb = buildRetryFeedback('随便说点啥', { narration: '', steps: [] }, {
      ok: false,
      reason: '模型输出不是合法 JSON',
    });
    expect(fb).toContain('随便说点啥');
    expect(fb).toContain('模型输出不是合法 JSON');
  });
});
