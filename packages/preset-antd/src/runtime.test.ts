import { describe, expect, it, beforeEach } from 'vitest';
import { createAntdFieldAdapter } from './runtime';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('createAntdFieldAdapter', () => {
  describe('locateField', () => {
    it('按 antd 自动 id 定位（去模块前缀）：leave.days → #days', async () => {
      document.body.innerHTML = '<input id="days" />';
      const adapter = createAntdFieldAdapter();
      const el = await adapter.locateField('leave.days', 200);
      expect(el).toBe(document.getElementById('days'));
    });

    it('data-ai-field 优先于自动 id（手标可覆盖）', async () => {
      document.body.innerHTML =
        '<input id="type" /><input data-ai-field="leave.type" class="marked" />';
      const adapter = createAntdFieldAdapter();
      const el = await adapter.locateField('leave.type', 200);
      expect((el as HTMLElement).className).toBe('marked');
    });

    it('无前缀字段：直接按 id 定位', async () => {
      document.body.innerHTML = '<input id="reason" />';
      const adapter = createAntdFieldAdapter();
      const el = await adapter.locateField('reason', 200);
      expect(el).toBe(document.getElementById('reason'));
    });

    it('找不到：超时返回 null', async () => {
      const adapter = createAntdFieldAdapter();
      const el = await adapter.locateField('leave.ghost', 100);
      expect(el).toBeNull();
    });
  });

  describe('setFieldValue', () => {
    it('原生 input：设值并派发 input/change 事件', async () => {
      const input = document.createElement('input');
      input.className = 'ant-input';
      document.body.appendChild(input);
      let changed = false;
      input.addEventListener('change', () => (changed = true));

      await createAntdFieldAdapter().setFieldValue(input, '团建');
      expect(input.value).toBe('团建');
      expect(changed).toBe(true);
    });

    it('InputNumber 内的原生 input：走 native 分支', async () => {
      document.body.innerHTML =
        '<div class="ant-input-number"><input class="ant-input-number-input" /></div>';
      const input = document.querySelector('.ant-input-number-input') as HTMLInputElement;
      await createAntdFieldAdapter().setFieldValue(input, '2');
      expect(input.value).toBe('2');
    });

    it('Select：点开下拉后点击 title 匹配的选项', async () => {
      // 模拟 antd Select 结构 + body 上的下拉选项
      document.body.innerHTML = `
        <div class="ant-select">
          <div class="ant-select-selector">
            <input role="combobox" readonly id="type" />
          </div>
        </div>
        <div class="ant-select-dropdown">
          <div class="ant-select-item-option" title="事假">事假</div>
          <div class="ant-select-item-option" title="病假">病假</div>
        </div>`;
      const combobox = document.getElementById('type')!;
      let picked = '';
      document
        .querySelectorAll('.ant-select-item-option')
        .forEach((o) =>
          o.addEventListener('click', () => (picked = o.getAttribute('title')!)),
        );

      await createAntdFieldAdapter().setFieldValue(combobox, '事假');
      expect(picked).toBe('事假');
    });

    it('Select：选项不存在则抛错', async () => {
      document.body.innerHTML = `
        <div class="ant-select">
          <div class="ant-select-selector"><input role="combobox" id="type" /></div>
        </div>`;
      const combobox = document.getElementById('type')!;
      await expect(
        createAntdFieldAdapter().setFieldValue(combobox, '不存在'),
      ).rejects.toThrow(/找不到选项/);
    });

    it('DatePicker：input 设值并派发事件', async () => {
      document.body.innerHTML =
        '<div class="ant-picker"><input id="date" /></div>';
      const input = document.getElementById('date') as HTMLInputElement;
      await createAntdFieldAdapter().setFieldValue(input, '2026-07-20');
      expect(input.value).toBe('2026-07-20');
    });
  });
});
