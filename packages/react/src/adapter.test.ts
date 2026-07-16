import { describe, expect, it, vi } from 'vitest';
import { reactSetFieldValue } from './adapter';

describe('reactSetFieldValue', () => {
  it('设值并派发 input/change 事件（骗过 React 受控组件）', () => {
    const input = document.createElement('input');
    const onInput = vi.fn();
    const onChange = vi.fn();
    input.addEventListener('input', onInput);
    input.addEventListener('change', onChange);
    document.body.appendChild(input);

    reactSetFieldValue(input, 'hello');

    expect(input.value).toBe('hello');
    expect(onInput).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('对 select 同样有效', () => {
    const select = document.createElement('select');
    const opt = document.createElement('option');
    opt.value = 'a';
    select.appendChild(opt);
    document.body.appendChild(select);

    reactSetFieldValue(select, 'a');
    expect(select.value).toBe('a');
  });
});
