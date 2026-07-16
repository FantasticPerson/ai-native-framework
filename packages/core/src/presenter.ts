// 可见执行演出接口。executor 在关键时刻回调 presenter，
// 由它驱动虚拟光标移动、目标高亮等「看得见」的效果。
// presenter 是可选的：不注入时 executor headless 运行（用于测试、或未来作为 MCP server 无 UI 执行）。
// core 提供一个基于 DOM 的默认实现 domPresenter（见 cursor.ts）。

export interface Presenter {
  /** 执行开始，显示光标 */
  begin(): void;
  /** 执行结束（成功或中断），隐藏光标 */
  end(): void;
  /** 光标移动到元素，resolve 表示动画结束 */
  moveTo(el: Element): Promise<void>;
  /** 高亮元素，返回取消高亮的函数 */
  highlight(el: Element): () => void;
}
