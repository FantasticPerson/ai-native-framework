import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from './prompt';
import type { Manifest } from './types';

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
