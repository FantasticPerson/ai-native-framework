// 框架适配接口。core 的 executor 是框架无关的 DOM 编排，
// 只有两件事因框架而异，抽成 adapter 由各框架包（@ai-native/react 等）实现：
//   1. navigate —— 路由跳转（react-router / vue-router 各不同）
//   2. setFieldValue —— 给受控组件填值（React 需原生 setter + 派发事件，Vue 不同）
// 其余（DOM 定位、点击、时序、光标演出）全部留在 core，所有浏览器框架共用。

export interface FrameworkAdapter {
  /** 跳转到指定路由 */
  navigate(route: string): void;
  /** 给表单元素填入值，需触发目标框架的响应式更新 */
  setFieldValue(el: Element, value: string): void;
}
