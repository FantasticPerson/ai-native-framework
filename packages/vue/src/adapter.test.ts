import { describe, it, expect } from 'vitest';
import { vueSetFieldValue } from './adapter';

describe('vueSetFieldValue', () => {
  it('设置原生 input 的值并派发 input 事件（v-model 监听 input）', () => {
    const el = document.createElement('input');
    let modelValue = '';
    // 模拟 v-model：监听 input 事件读取 el.value
    el.addEventListener('input', () => {
      modelValue = (el as HTMLInputElement).value;
    });
    vueSetFieldValue(el, '张三');
    expect((el as HTMLInputElement).value).toBe('张三');
    expect(modelValue).toBe('张三');
  });

  it('也派发 change 事件（部分控件用 .lazy 监听 change）', () => {
    const el = document.createElement('input');
    let changed = false;
    el.addEventListener('change', () => {
      changed = true;
    });
    vueSetFieldValue(el, '5');
    expect(changed).toBe(true);
  });
});
