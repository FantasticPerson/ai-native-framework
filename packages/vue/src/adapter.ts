// Vue 原生表单填值：Vue 的 v-model 在原生元素上编译成 `:value` 绑定 + `@input` 监听，
// 直接写 el.value 再派发 input 事件即可被 v-model 感知——不需要 React 那套原型链原生
// setter hack（React 的受控组件会拦截 value 赋值，Vue 不会）。这个真实差异正是 adapter
// 必须按框架分包、而 core 不该认识任何一个框架的证据。
export function vueSetFieldValue(el: Element, value: string): void {
  (el as HTMLInputElement).value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
