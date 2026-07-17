import { defineComponent, h, ref, type PropType } from 'vue';
import type { AgentStatus } from './useAIAgent';

const STATUS_TEXT: Record<AgentStatus, string> = {
  idle: '',
  thinking: 'AI 思考中…',
  executing: '执行中…',
  done: '完成',
  error: '出错',
};

export interface AIBarAgent {
  status: { value: AgentStatus };
  narration: { value: string };
  error: { value: string };
  run: (text: string) => void;
  /** 当前尝试轮次（闭环重试时 >1），可选 */
  attempt?: { value: number };
}

/**
 * 通用 AI 输入条（Vue 版）。用渲染函数写，避免引入 SFC 编译链，与 @ai-native/react 的
 * AIBar 对称。业务示例由 props 注入，组件本身不含任何业务内容。
 * agent 传 useAIAgent 的返回值（其字段是 ref，故取 .value）。
 */
export const AIBar = defineComponent({
  name: 'AIBar',
  props: {
    agent: { type: Object as PropType<AIBarAgent>, required: true },
    examples: { type: Array as PropType<string[]>, default: () => [] },
    placeholder: { type: String, default: '说一句话，让 AI 帮你操作' },
  },
  setup(props) {
    const text = ref('');

    const submit = (e: Event) => {
      e.preventDefault();
      const busy = isBusy();
      if (!text.value.trim() || busy) return;
      props.agent.run(text.value.trim());
    };
    const isBusy = () =>
      props.agent.status.value === 'thinking' || props.agent.status.value === 'executing';

    return () => {
      const status = props.agent.status.value;
      const narration = props.agent.narration.value;
      const error = props.agent.error.value;
      const attempt = props.agent.attempt?.value ?? 0;
      const busy = isBusy();

      const chips =
        props.examples.length > 0
          ? h(
              'div',
              { class: 'ai-chips' },
              props.examples.map((ex) =>
                h(
                  'button',
                  {
                    key: ex,
                    type: 'button',
                    class: 'ai-chip',
                    disabled: busy,
                    onClick: () => {
                      text.value = ex;
                    },
                  },
                  ex,
                ),
              ),
            )
          : null;

      const showStatus = narration || error || (status !== 'idle' && STATUS_TEXT[status]);
      const statusRow = showStatus
        ? h('div', { class: `ai-status ${status === 'error' ? 'ai-status-error' : ''}` }, [
            h('span', { class: 'ai-status-tag' }, STATUS_TEXT[status]),
            busy && attempt > 1 ? h('span', { class: 'ai-status-tag' }, `第 ${attempt} 次尝试`) : null,
            h('span', {}, error || narration),
          ])
        : null;

      const inputRow = h('form', { class: 'ai-input-row', onSubmit: submit }, [
        h('input', {
          class: 'ai-input',
          placeholder: props.placeholder,
          value: text.value,
          disabled: busy,
          onInput: (e: Event) => {
            text.value = (e.target as HTMLInputElement).value;
          },
        }),
        h(
          'button',
          { class: 'btn btn-primary', type: 'submit', disabled: busy || !text.value.trim() },
          busy ? '执行中' : '发送',
        ),
      ]);

      return h('div', { class: 'ai-bar' }, [h('div', { class: 'ai-bar-inner' }, [chips, statusRow, inputRow])]);
    };
  },
});
