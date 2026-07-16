// LLM provider 抽象。provider 只负责「拿 system + 对话消息，返回模型输出的原始文本」，
// 不关心供应商、不关心前端框架。LLMProvider 是纯函数类型，用户可自由传入任意实现。
// core 内置两个：createHttpProvider（浏览器 → 服务端代理，key 不进前端）、
// createOpenAICompatibleProvider（直连 OpenAI 兼容端点，仅限可安全持有 key 的环境）。

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

export interface OpenAICompatibleOptions {
  /** OpenAI 兼容的 chat completions 端点，如 https://api.deepseek.com/chat/completions */
  endpoint: string;
  /** API key。会以 Authorization: Bearer 发送。 */
  apiKey: string;
  /** 模型名，如 deepseek-chat / gpt-4o */
  model: string;
  /** 采样温度，默认 0（操作编排要确定性） */
  temperature?: number;
  /** 最大 token，默认 1024 */
  maxTokens?: number;
  /** 可注入自定义 fetch（测试用），默认用全局 fetch */
  fetchImpl?: typeof fetch;
}

/**
 * 直连 OpenAI 兼容端点的 provider（DeepSeek / OpenAI / Moonshot / 通义等同一套协议）。
 * system 作为 messages 首条，强制 response_format=json_object 保证只输出操作序列 JSON。
 *
 * ⚠️ 安全：此实现会携带 apiKey。仅用于可安全持有 key 的环境（Node 服务端 / CLI / MCP server）。
 * 浏览器中请勿使用——key 会进入前端 bundle，应改用 createHttpProvider + 服务端代理。
 */
export function createOpenAICompatibleProvider(opts: OpenAICompatibleOptions): LLMProvider {
  const doFetch = opts.fetchImpl ?? fetch;
  return async (system, messages) => {
    const finalMessages = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages;
    const resp = await doFetch(opts.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: finalMessages,
        temperature: opts.temperature ?? 0,
        max_tokens: opts.maxTokens ?? 1024,
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      throw new Error(`上游返回 ${resp.status}${detail ? `：${detail.slice(0, 200)}` : ''}`);
    }
    const data = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
  };
}
