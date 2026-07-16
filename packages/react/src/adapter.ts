// React 受控组件填值：直接改 el.value 不会被 React 感知，
// 必须用原型链上的原生 setter 设值，再手动派发 input/change 事件。
// 这是 executor 填表能作用于 React 表单的关键。
export function reactSetFieldValue(el: Element, value: string): void {
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
