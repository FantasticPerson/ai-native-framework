import { describe, expect, it } from 'vitest';
import { aggregate } from './aggregate';

describe('aggregate', () => {
  it('多文件多模块归位', () => {
    const files = [
      {
        path: 'leave/LeaveModule.tsx',
        code: `const A = () => <div data-ai-module="leave" data-ai-label="请假管理" data-ai-route="/leave"><button data-ai-action="leave.create" data-ai-label="新增" /></div>;`,
      },
      {
        path: 'employees/EmployeesModule.tsx',
        code: `const B = () => <div data-ai-module="employees" data-ai-label="员工管理" data-ai-route="/employees"><input data-ai-field="employees.name" data-ai-label="姓名" data-ai-type="text" /></div>;`,
      },
    ];
    const m = aggregate(files);
    expect(Object.keys(m.modules).sort()).toEqual(['employees', 'leave']);
    expect(m.modules.leave.actions).toContainEqual({ id: 'leave.create', label: '新增' });
    expect(m.modules.employees.fields).toContainEqual({ id: 'employees.name', label: '姓名', type: 'text' });
  });

  it('同模块跨文件合并', () => {
    const files = [
      {
        path: 'leave/LeaveModule.tsx',
        code: `const A = () => <div data-ai-module="leave" data-ai-label="请假管理" data-ai-route="/leave" />;`,
      },
      {
        path: 'leave/LeaveForm.tsx',
        code: `const B = () => <input data-ai-field="leave.days" data-ai-label="天数" data-ai-type="number" />;`,
      },
    ];
    const m = aggregate(files);
    expect(m.modules.leave.fields).toContainEqual({ id: 'leave.days', label: '天数', type: 'number' });
  });

  it('按 id 前缀归属模块', () => {
    const files = [
      {
        path: 'a.tsx',
        code: `const A = () => <div data-ai-module="leave" data-ai-label="请假" data-ai-route="/leave" />;`,
      },
      {
        path: 'b.tsx',
        code: `const B = () => <button data-ai-action="leave.submit" data-ai-label="提交" />;`,
      },
    ];
    const m = aggregate(files);
    expect(m.modules.leave.actions).toContainEqual({ id: 'leave.submit', label: '提交' });
  });

  it('重复 id 去重', () => {
    const files = [
      {
        path: 'a.tsx',
        code: `const A = () => <div data-ai-module="leave" data-ai-label="请假" data-ai-route="/leave"><button data-ai-action="leave.create" data-ai-label="新增" /></div>;`,
      },
      {
        path: 'b.tsx',
        code: `const B = () => <button data-ai-action="leave.create" data-ai-label="再次新增" />;`,
      },
    ];
    const m = aggregate(files);
    expect(m.modules.leave.actions.filter((a) => a.id === 'leave.create')).toHaveLength(1);
  });

  describe('moduleSeeds（preset 自动推断）', () => {
    it('种子建模块，actions/fields 按 id 前缀挂到种子模块上', () => {
      const files = [
        { path: 'a.tsx', code: `const A = () => <button data-ai-action="leave.submit" data-ai-label="提交" />;` },
      ];
      const m = aggregate(files, {
        moduleSeeds: [{ name: 'leave', label: '请假管理', route: '/leave' }],
      });
      expect(m.modules.leave).toMatchObject({ label: '请假管理', route: '/leave' });
      expect(m.modules.leave.actions).toContainEqual({ id: 'leave.submit', label: '提交' });
    });

    it('种子缺 label 时回退到 name', () => {
      const m = aggregate([], { moduleSeeds: [{ name: 'leave', route: '/leave' }] });
      expect(m.modules.leave.label).toBe('leave');
    });

    it('data-ai-module 手标覆盖同名种子的 label/route', () => {
      const files = [
        {
          path: 'a.tsx',
          code: `const A = () => <div data-ai-module="leave" data-ai-label="请假管理（精标）" data-ai-route="/leave-v2" />;`,
        },
      ];
      const m = aggregate(files, {
        moduleSeeds: [{ name: 'leave', label: '路由推断名', route: '/leave' }],
      });
      expect(m.modules.leave.label).toBe('请假管理（精标）');
      expect(m.modules.leave.route).toBe('/leave-v2');
    });
  });
});
