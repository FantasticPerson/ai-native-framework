import { describe, expect, it } from 'vitest';
import { scanSource } from './scanner';

describe('scanSource', () => {
  it('提取 data-ai-action', () => {
    const code = `const A = () => <button data-ai-action="leave.create" data-ai-label="新增">新增</button>;`;
    const r = scanSource(code);
    expect(r.actions).toContainEqual({ id: 'leave.create', label: '新增' });
  });

  it('data-ai-confirm 标注危险操作', () => {
    const code = `const A = () => <button data-ai-action="employees.delete" data-ai-label="删除" data-ai-confirm>删除</button>;`;
    const r = scanSource(code);
    expect(r.actions).toContainEqual({ id: 'employees.delete', label: '删除', confirm: true });
  });

  it('无 data-ai-confirm 的操作不带 confirm 字段', () => {
    const code = `const A = () => <button data-ai-action="leave.create" data-ai-label="新增" />;`;
    const r = scanSource(code);
    expect(r.actions[0]).not.toHaveProperty('confirm');
  });

  it('提取 data-ai-field（number）', () => {
    const code = `const A = () => <input data-ai-field="leave.days" data-ai-label="天数" data-ai-type="number" />;`;
    const r = scanSource(code);
    expect(r.fields).toContainEqual({ id: 'leave.days', label: '天数', type: 'number' });
  });

  it('解析 select 的 options', () => {
    const code = `const A = () => <select data-ai-field="leave.type" data-ai-label="类型" data-ai-type="select" data-ai-options="事假,病假" />;`;
    const r = scanSource(code);
    expect(r.fields).toContainEqual({
      id: 'leave.type',
      label: '类型',
      type: 'select',
      options: ['事假', '病假'],
    });
  });

  it('解析模块根标注', () => {
    const code = `const A = () => <div data-ai-module="leave" data-ai-label="请假管理" data-ai-route="/leave" />;`;
    const r = scanSource(code);
    expect(r.module).toEqual({ name: 'leave', label: '请假管理', route: '/leave' });
  });

  it('非字面量值告警且不产出', () => {
    const code = `const A = ({actionId}) => <button data-ai-action={actionId} data-ai-label="x" />;`;
    const r = scanSource(code);
    expect(r.actions).toHaveLength(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('select 缺 options 时告警', () => {
    const code = `const A = () => <select data-ai-field="leave.type" data-ai-label="类型" data-ai-type="select" />;`;
    const r = scanSource(code);
    expect(r.warnings.some((w) => w.includes('options'))).toBe(true);
  });

  it('识别约定组件 <Field>（text）', () => {
    const code = `const A = () => <Field aiField="leave.days" aiLabel="天数" type="number" value={x} onChange={f} />;`;
    const r = scanSource(code);
    expect(r.fields).toContainEqual({ id: 'leave.days', label: '天数', type: 'number' });
  });

  it('识别 <Field> 的 select + 数组 options', () => {
    const code = `const A = () => <Field aiField="leave.type" aiLabel="类型" type="select" options={['事假','病假']} value={x} onChange={f} />;`;
    const r = scanSource(code);
    expect(r.fields).toContainEqual({ id: 'leave.type', label: '类型', type: 'select', options: ['事假', '病假'] });
  });
});
