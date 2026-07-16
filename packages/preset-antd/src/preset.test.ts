import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { antdPreset } from './preset';

function tmpFile(code: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'preset-antd-'));
  const file = join(dir, 'LeaveForm.tsx');
  writeFileSync(file, code, 'utf-8');
  return file;
}

const FORM = `
  <Form>
    <Form.Item name="type" label="请假类型"><Select options={['事假','病假']} /></Form.Item>
    <Form.Item name="days" label="请假天数"><InputNumber /></Form.Item>
    <Form.Item name="date" label="请假日期"><DatePicker /></Form.Item>
  </Form>;
`;

describe('antdPreset', () => {
  it('字段种子带 module 前缀，type/options 从子控件推断', () => {
    const file = tmpFile(FORM);
    const c = antdPreset({ forms: [{ module: 'leave', file }] }).collect();
    expect(c.fields).toContainEqual({ id: 'leave.type', label: '请假类型', type: 'select', options: ['事假', '病假'] });
    expect(c.fields).toContainEqual({ id: 'leave.days', label: '请假天数', type: 'number' });
    expect(c.fields).toContainEqual({ id: 'leave.date', label: '请假日期', type: 'date' });
  });

  it('多表单合并', () => {
    const f1 = tmpFile(`<Form.Item name="a" label="A"><Input /></Form.Item>;`);
    const f2 = tmpFile(`<Form.Item name="b" label="B"><Input /></Form.Item>;`);
    const c = antdPreset({
      forms: [
        { module: 'm1', file: f1 },
        { module: 'm2', file: f2 },
      ],
    }).collect();
    expect(c.fields).toContainEqual({ id: 'm1.a', label: 'A', type: 'text' });
    expect(c.fields).toContainEqual({ id: 'm2.b', label: 'B', type: 'text' });
  });

  it('文件不存在时跳过该表单，不抛异常', () => {
    const c = antdPreset({ forms: [{ module: 'x', file: '/no/such.tsx' }] }).collect();
    expect(c.fields).toEqual([]);
  });

  it('name 为 antd', () => {
    expect(antdPreset({ forms: [] }).name).toBe('antd');
  });
});
