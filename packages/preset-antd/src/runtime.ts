// @ai-native/preset-antd/runtime —— 浏览器运行时字段适配器。
// 与构建时扫描（./index）分离：这里是 DOM 脏活，依赖 antd 内部结构与 class。
//
// 背景：antd 的 Form.Item 会按 name 自动生成 id（leave.type 的控件是 #type），
// 且不吃 data-ai-field（手标 data-ai-field 会污染静态扫描）。所以定位改走 id，
// 填值按控件类型分派——原生 input 直接设值，Select/DatePicker 需模拟交互。
//
// 边界（诚实声明）：Select/DatePicker 依赖 antd 内部 class（.ant-select-item-option 等），
// antd 大版本升级可能失效。代价收敛在本文件，随 antd 版本维护。

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 字段 id 去模块前缀：leave.type → type（antd 自动 id 不带模块名） */
function fieldName(fieldId: string): string {
  const dot = fieldId.indexOf('.');
  return dot === -1 ? fieldId : fieldId.slice(dot + 1);
}

/** 轮询等待条件成立，超时返回最后一次结果 */
async function poll<T>(fn: () => T | null, timeout: number): Promise<T | null> {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    const v = fn();
    if (v) return v;
    await delay(30);
  }
  return fn();
}

/** 触发原生受控输入：绕过框架用原型 setter 设值，再派发 input/change */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

/** antd Select：点开下拉，选中 title 匹配的选项 */
async function fillSelect(select: Element, value: string, timeout: number): Promise<void> {
  const trigger = select.querySelector('.ant-select-selector') ?? select;
  trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  trigger.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  (trigger as HTMLElement).click?.();

  // 下拉挂在 body 上，选项文本在 .ant-select-item-option[title]
  const option = await poll(
    () =>
      document.querySelector(
        `.ant-select-item-option[title="${value}"]`,
      ) ?? findOptionByText(value),
    timeout,
  );
  if (!option) throw new Error(`Select 找不到选项「${value}」`);
  (option as HTMLElement).click();
}

/** 按可见文本兜底找选项（title 未必总带 value） */
function findOptionByText(value: string): Element | null {
  const opts = document.querySelectorAll('.ant-select-item-option');
  for (const o of opts) {
    if (o.textContent?.trim() === value) return o;
  }
  return null;
}

/** antd DatePicker：输入框设值 + 回车确认（best-effort，格式需与 picker 一致） */
async function fillPicker(input: HTMLInputElement, value: string): Promise<void> {
  input.focus();
  setNativeValue(input, value);
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await delay(30);
  input.blur();
}

/** 判断元素属于哪类 antd 控件 */
function classifyControl(el: Element): 'select' | 'picker' | 'native' {
  if (el.closest('.ant-select')) return 'select';
  if (el.closest('.ant-picker')) return 'picker';
  return 'native';
}

export interface AntdFieldAdapter {
  locateField(fieldId: string, timeout: number): Promise<Element | null>;
  setFieldValue(el: Element, value: string): Promise<void>;
}

/**
 * 创建 antd 运行时字段适配器，透传给 @ai-native/react 的 useAIAgent({ fieldAdapter })。
 * - locateField：先试 data-ai-field（手标优先），再按 antd 自动 id（#name）定位
 * - setFieldValue：原生 input 直接设值；Select/DatePicker 模拟交互
 */
export function createAntdFieldAdapter(): AntdFieldAdapter {
  return {
    async locateField(fieldId, timeout) {
      const name = fieldName(fieldId);
      return poll(
        () =>
          document.querySelector(`[data-ai-field="${fieldId}"]`) ??
          document.getElementById(name),
        timeout,
      );
    },
    async setFieldValue(el, value) {
      switch (classifyControl(el)) {
        case 'select':
          await fillSelect(el.closest('.ant-select')!, value, 1500);
          return;
        case 'picker':
          await fillPicker(el as HTMLInputElement, value);
          return;
        default:
          setNativeValue(el as HTMLInputElement, value);
      }
    },
  };
}
