import type { AIPlan, ManifestAction, Step } from './types';
import type { FrameworkAdapter } from './adapter';
import type { Presenter } from './presenter';

export interface ExecuteOptions {
  /** 框架适配器：路由跳转与受控组件填值 */
  adapter: FrameworkAdapter;
  /** 根据模块名取路由 */
  routeOf: (moduleName: string) => string | undefined;
  /** 根据 action id 取操作元信息（用于判断是否需确认）。不传则视为无危险操作。 */
  actionOf?: (actionId: string) => ManifestAction | undefined;
  /**
   * 危险操作（action.confirm 为真）执行前的确认闸门。返回 false 则优雅中断。
   * 不传则不拦截（策略缺省即放行——闸门是可选机制，core 只定义"要不要问"）。
   */
  confirm?: (action: ManifestAction) => boolean | Promise<boolean>;
  /**
   * 覆盖 fill 步骤的字段定位。默认按 [data-ai-field="<id>"] 查找。
   * antd 等非原生控件用不上 data-ai-field（会污染扫描），改由 preset 运行时按 antd 自动 id 定位。
   */
  locateField?: (fieldId: string, timeout: number) => Promise<Element | null>;
  /** 可见演出（光标、高亮）。不传则 headless 执行 */
  presenter?: Presenter;
  /** 每步旁白回调 */
  onNarrate?: (text: string) => void;
  /** 步骤间隔（ms），默认 500 */
  stepDelay?: number;
  /** 定位元素的超时（ms），默认 1500 */
  locateTimeout?: number;
  /** 导航后等待模块出现的超时（ms），默认 3000 */
  navigateTimeout?: number;
}

export interface ExecuteResult {
  ok: boolean;
  stoppedAt?: number;
  reason?: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 轮询等待选择器出现，超时返回 null */
async function waitFor(selector: string, timeout: number): Promise<Element | null> {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await delay(30);
  }
  return document.querySelector(selector);
}

/**
 * 轮询等待导航就绪：模块容器 [data-ai-module] 出现，或路由已切到目标 route。
 * 两个信号任一满足即就绪——手标模式认容器，零改动（扫路由）模式认路由，都覆盖。
 */
async function waitForNavigated(module: string, route: string, timeout: number): Promise<boolean> {
  const ready = () =>
    Boolean(document.querySelector(`[data-ai-module="${module}"]`)) || location.pathname === route;
  const start = performance.now();
  while (performance.now() - start < timeout) {
    if (ready()) return true;
    await delay(30);
  }
  return ready();
}

/** 能否逐字输入：可编辑的 input/textarea 才行；readonly/combobox（如 antd Select）一次性设值 */
function canTypeChar(el: Element): boolean {
  const tag = (el as HTMLElement).tagName;
  if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
  if ((el as HTMLInputElement).readOnly) return false;
  if (el.getAttribute('role') === 'combobox') return false;
  return true;
}

/** 逐字打字填入；有 presenter 且控件可逐字输入时带动画，否则一次到位 */
async function typeInto(
  el: Element,
  value: string,
  adapter: FrameworkAdapter,
  animate: boolean,
) {
  if (!animate || !canTypeChar(el)) {
    await adapter.setFieldValue(el, value);
    return;
  }
  for (let i = 1; i <= value.length; i++) {
    await adapter.setFieldValue(el, value.slice(0, i));
    await delay(45);
  }
  if (value.length === 0) await adapter.setFieldValue(el, '');
}

async function runStep(
  step: Step,
  opts: ExecuteOptions,
): Promise<{ ok: boolean; reason?: string }> {
  const stepDelay = opts.stepDelay ?? 500;
  const { adapter, presenter } = opts;

  if (step.type === 'wait') {
    await delay(step.ms ?? 300);
    return { ok: true };
  }

  if (step.type === 'navigate') {
    const route = opts.routeOf(step.module);
    if (!route) return { ok: false, reason: `未知模块 ${step.module}` };
    opts.onNarrate?.(`正在前往「${step.module}」`);
    adapter.navigate(route);
    const appeared = await waitForNavigated(step.module, route, opts.navigateTimeout ?? 3000);
    if (!appeared) return { ok: false, reason: `导航到 ${step.module} 后页面未就绪` };
    if (stepDelay) await delay(stepDelay);
    return { ok: true };
  }

  // click / fill 需要先定位元素
  const locateTimeout = opts.locateTimeout ?? 1500;
  let el: Element | null;
  if (step.type === 'fill' && opts.locateField) {
    el = await opts.locateField(step.target, locateTimeout);
  } else {
    const selector =
      step.type === 'click'
        ? `[data-ai-action="${step.target}"]`
        : `[data-ai-field="${step.target}"]`;
    el = await waitFor(selector, locateTimeout);
  }
  if (!el) return { ok: false, reason: `找不到元素 ${step.target}` };

  await presenter?.moveTo(el);
  const clearHl = presenter?.highlight(el);

  if (step.type === 'click') {
    const action = opts.actionOf?.(step.target);
    if (action?.confirm && opts.confirm) {
      const approved = await opts.confirm(action);
      if (!approved) {
        clearHl?.();
        return { ok: false, reason: `用户取消了操作「${action.label}」` };
      }
    }
    opts.onNarrate?.(`点击「${step.target}」`);
    (el as HTMLElement).click();
  } else {
    opts.onNarrate?.(`填写「${step.target}」为 ${step.value}`);
    await typeInto(el, step.value, adapter, Boolean(presenter));
  }

  if (stepDelay) await delay(stepDelay);
  clearHl?.();
  return { ok: true };
}

/** 逐步执行操作序列，任一步失败则优雅停止 */
export async function execute(plan: AIPlan, opts: ExecuteOptions): Promise<ExecuteResult> {
  opts.presenter?.begin();
  try {
    for (let i = 0; i < plan.steps.length; i++) {
      const { ok, reason } = await runStep(plan.steps[i], opts);
      if (!ok) {
        opts.onNarrate?.(`已暂停：${reason}`);
        return { ok: false, stoppedAt: i, reason };
      }
    }
    return { ok: true };
  } finally {
    opts.presenter?.end();
  }
}
