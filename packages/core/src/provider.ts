// LLM provider 抽象。provider 只负责「拿 system + 对话消息，返回模型输出的原始文本」，
// 不关心供应商、不关心前端框架。多供应商适配（OpenAI/Claude/DeepSeek 直连）留待后续，
// 现在只提供一个「打 HTTP 端点」的默认实现，对应常见的服务端代理模式（key 不进前端）。

export interface ChatMessage {
  role: string;
  content: string;
}

/** 一次调用：传 system prompt 与消息，返回模型输出的原始文本 */
export type LLMProvider = (system: string, messages: ChatMessage[]) => Promise<string>;

export interface HttpProviderOptions {
  /** 服务端代理端点，如 /api/chat */
  endpoint: string;
  /** 可注入自定义 fetch（测试用），默认用全局 fetch */
  fetchImpl?: typeof fetch;
}

/**
 * 默认 provider：POST { system, messages } 到 endpoint，期望响应 { text } 或 { error }。
 * 与 ai-native-demo 现有的 /api/chat 代理契约一致。
 */
export function createHttpProvider(opts: HttpProviderOptions): LLMProvider {
  const doFetch = opts.fetchImpl ?? fetch;
  return async (system, messages) => {
    const resp = await doFetch(opts.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages }),
    });
    const data = (await resp.json()) as { text?: string; error?: string };
    if (!resp.ok || data.error) {
      throw new Error(data.error ?? `请求失败（${resp.status}）`);
    }
    return data.text ?? '';
  };
}
