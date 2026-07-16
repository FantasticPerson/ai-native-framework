import { describe, expect, it } from 'vitest';
import { scanFormItems } from './scan-form';

describe('scanFormItems', () => {
  it('Input → text', () => {
    const code = `<Form.Item name="reason" label="事由"><Input /></Form.Item>;`;
    expect(scanFormItems(code)).toContainEqual({ name: 'reason', label: '事由', type: 'text' });
  });

  it('InputNumber → number', () => {
    const code = `<Form.Item name="days" label="天数"><InputNumber /></Form.Item>;`;
    expect(scanFormItems(code)).toContainEqual({ name: 'days', label: '天数', type: 'number' });
  });

  it('DatePicker → date', () => {
    const code = `<Form.Item name="date" label="日期"><DatePicker /></Form.Item>;`;
    expect(scanFormItems(code)).toContainEqual({ name: 'date', label: '日期', type: 'date' });
  });

  it('Select + options prop → select + options', () => {
    const code = `<Form.Item name="type" label="类型"><Select options={[{value:'事假',label:'事假'},{value:'病假',label:'病假'}]} /></Form.Item>;`;
    expect(scanFormItems(code)).toContainEqual({
      name: 'type',
      label: '类型',
      type: 'select',
      options: ['事假', '病假'],
    });
  });

  it('Select + <Option> 子元素 → select + options', () => {
    const code = `<Form.Item name="dept" label="部门"><Select><Option value="技术">技术</Option><Option value="产品">产品</Option></Select></Form.Item>;`;
    expect(scanFormItems(code)).toContainEqual({
      name: 'dept',
      label: '部门',
      type: 'select',
      options: ['技术', '产品'],
    });
  });

  it('Select + 字符串数组 options → select + options', () => {
    const code = `<Form.Item name="cat" label="类别"><Select options={['差旅','餐饮']} /></Form.Item>;`;
    expect(scanFormItems(code)).toContainEqual({
      name: 'cat',
      label: '类别',
      type: 'select',
      options: ['差旅', '餐饮'],
    });
  });

  it('无 name 的 Form.Item 跳过', () => {
    const code = `<Form.Item label="仅展示"><span>x</span></Form.Item>;`;
    expect(scanFormItems(code)).toEqual([]);
  });

  it('label 缺省回退到 name', () => {
    const code = `<Form.Item name="note"><Input /></Form.Item>;`;
    expect(scanFormItems(code)).toContainEqual({ name: 'note', label: 'note', type: 'text' });
  });

  it('无法识别子组件时默认为 text', () => {
    const code = `<Form.Item name="x" label="X"><CustomWidget /></Form.Item>;`;
    expect(scanFormItems(code)).toContainEqual({ name: 'x', label: 'X', type: 'text' });
  });

  it('解析失败返回空数组', () => {
    expect(scanFormItems('= = =')).toEqual([]);
  });
});
