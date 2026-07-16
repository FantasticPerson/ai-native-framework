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

  describe('从同文件常量解析 options（动态表单）', () => {
    it('options 引用字符串数组常量', () => {
      const code = `const TYPES = ['事假','病假'];
        function F(){ return <Form.Item name="type" label="类型"><Select options={TYPES} /></Form.Item>; }`;
      expect(scanFormItems(code)).toContainEqual({
        name: 'type',
        label: '类型',
        type: 'select',
        options: ['事假', '病假'],
      });
    });

    it('options 引用对象数组常量，取 value', () => {
      const code = `const OPTS = [{value:'a',label:'A'},{value:'b',label:'B'}];
        function F(){ return <Form.Item name="k" label="K"><Select options={OPTS} /></Form.Item>; }`;
      expect(scanFormItems(code)).toContainEqual({
        name: 'k',
        label: 'K',
        type: 'select',
        options: ['a', 'b'],
      });
    });

    it('options 用常量 .map(v => ({value:v}))', () => {
      const code = `const TYPES = ['事假','病假','年假'];
        function F(){ return <Form.Item name="type" label="类型"><Select options={TYPES.map(v=>({value:v,label:v}))} /></Form.Item>; }`;
      expect(scanFormItems(code)).toContainEqual({
        name: 'type',
        label: '类型',
        type: 'select',
        options: ['事假', '病假', '年假'],
      });
    });

    it('options 用内联数组 .map(...)（回归，不破坏）', () => {
      const code = `<Form.Item name="cat" label="类别"><Select options={['差旅','餐饮'].map(v=>({value:v,label:v}))} /></Form.Item>;`;
      expect(scanFormItems(code)).toContainEqual({
        name: 'cat',
        label: '类别',
        type: 'select',
        options: ['差旅', '餐饮'],
      });
    });

    it('引用未定义的标识符：options 缺省，type 仍 select', () => {
      const code = `<Form.Item name="x" label="X"><Select options={UNKNOWN} /></Form.Item>;`;
      const result = scanFormItems(code);
      expect(result).toContainEqual({ name: 'x', label: 'X', type: 'select' });
    });
  });
});
