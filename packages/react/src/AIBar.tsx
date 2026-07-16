import { useState, type FormEvent } from 'react';
import type { AgentStatus } from './useAIAgent';

const STATUS_TEXT: Record<AgentStatus, string> = {
  idle: '',
  thinking: 'AI 思考中…',
  executing: '执行中…',
  done: '完成',
  error: '出错',
};

export interface AIBarProps {
  /** useAIAgent 返回的状态与 run 方法 */
  agent: {
    status: AgentStatus;
    narration: string;
    error: string;
    run: (text: string) => void;
    /** 当前尝试轮次（闭环重试时 >1），可选 */
    attempt?: number;
  };
  /** 快捷示例，点击填入输入框；不传则不展示 */
  examples?: string[];
  /** 输入框占位符 */
  placeholder?: string;
}

/** 通用 AI 输入条。业务示例由 props 注入，组件本身不含任何业务内容。 */
export function AIBar({ agent, examples = [], placeholder }: AIBarProps) {
  const { status, narration, error, run, attempt } = agent;
  const [text, setText] = useState('');
  const busy = status === 'thinking' || status === 'executing';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    run(text.trim());
  };

  return (
    <div className="ai-bar">
      <div className="ai-bar-inner">
        {examples.length > 0 && (
          <div className="ai-chips">
            {examples.map((ex) => (
              <button key={ex} type="button" className="ai-chip" disabled={busy} onClick={() => setText(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}
        {(narration || error || (status !== 'idle' && STATUS_TEXT[status])) && (
          <div className={`ai-status ${status === 'error' ? 'ai-status-error' : ''}`}>
            <span className="ai-status-tag">{STATUS_TEXT[status]}</span>
            {busy && attempt && attempt > 1 && (
              <span className="ai-status-tag">第 {attempt} 次尝试</span>
            )}
            <span>{error || narration}</span>
          </div>
        )}
        <form className="ai-input-row" onSubmit={submit}>
          <input
            className="ai-input"
            placeholder={placeholder ?? '说一句话，让 AI 帮你操作'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
          />
          <button className="btn btn-primary" type="submit" disabled={busy || !text.trim()}>
            {busy ? '执行中' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
}
