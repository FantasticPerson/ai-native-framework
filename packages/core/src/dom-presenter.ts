// 基于 DOM 的默认 Presenter：一个浮在页面最上层的虚拟光标 + 元素高亮。
// 命令式控制，不依赖任何框架渲染。使用者需自行引入配套样式（.ai-cursor / .ai-highlight）。
import type { Presenter } from './presenter';

let cursorEl: HTMLDivElement | null = null;

function ensureCursor(): HTMLDivElement {
  if (cursorEl) return cursorEl;
  const el = document.createElement('div');
  el.className = 'ai-cursor';
  el.style.left = `${window.innerWidth / 2}px`;
  el.style.top = `${window.innerHeight / 2}px`;
  document.body.appendChild(el);
  cursorEl = el;
  return el;
}

function moveTo(x: number, y: number): Promise<void> {
  const el = ensureCursor();
  return new Promise((resolve) => {
    const onEnd = () => {
      el.removeEventListener('transitionend', onEnd);
      resolve();
    };
    el.addEventListener('transitionend', onEnd);
    requestAnimationFrame(() => {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    });
    // 兜底：transition 未触发时超时 resolve
    setTimeout(onEnd, 800);
  });
}

/** core 内置的 DOM 演出实现，供浏览器环境直接使用 */
export const domPresenter: Presenter = {
  begin() {
    ensureCursor().style.opacity = '1';
  },
  end() {
    if (cursorEl) cursorEl.style.opacity = '0';
  },
  moveTo(el: Element) {
    const rect = el.getBoundingClientRect();
    return moveTo(rect.left + rect.width / 2, rect.top + rect.height / 2);
  },
  highlight(el: Element) {
    el.classList.add('ai-highlight');
    return () => el.classList.remove('ai-highlight');
  },
};
