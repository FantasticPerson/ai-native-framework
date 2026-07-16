import { describe, expect, it, vi } from 'vitest';
import { createHttpProvider, createOpenAICompatibleProvider } from './provider';

describe('createHttpProvider', () => {
  it('POST 到指定端点，传 system + messages，返回 text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: '{"steps":[]}' }),
    });

    const provider = createHttpProvider({ endpoint: '/api/chat', fetchImpl: fetchMock as unknown as typeof fetch });
    const text = await provider('SYS', [{ role: 'user', content: 'hi' }]);

    expect(text).toBe('{"steps":[]}');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/chat');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({ system: 'SYS', messages: [{ role: 'user', content: 'hi' }] });
  });

  it('响应含 error 字段时抛出', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: '未配置 key' }),
    });
    const provider = createHttpProvider({ endpoint: '/api/chat', fetchImpl: fetchMock as unknown as typeof fetch });

    await expect(provider('S', [])).rejects.toThrow('未配置 key');
  });
});

describe('createOpenAICompatibleProvider', () => {
  function okResp(content: string) {
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content } }] }),
    };
  }

  it('把 system 作为首条 message，按 OpenAI 格式请求，取 choices[0].message.content', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResp('{"steps":[]}'));
    const provider = createOpenAICompatibleProvider({
      endpoint: 'https://api.deepseek.com/chat/completions',
      apiKey: 'sk-test',
      model: 'deepseek-chat',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const text = await provider('SYS', [{ role: 'user', content: 'hi' }]);

    expect(text).toBe('{"steps":[]}');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.deepseek.com/chat/completions');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer sk-test');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe('deepseek-chat');
    expect(body.messages).toEqual([
      { role: 'system', content: 'SYS' },
      { role: 'user', content: 'hi' },
    ]);
  });

  it('默认强制 response_format=json_object、temperature=0', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResp('{}'));
    const provider = createOpenAICompatibleProvider({
      endpoint: 'https://x/chat/completions',
      apiKey: 'k',
      model: 'm',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await provider('S', []);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.temperature).toBe(0);
  });

  it('上游非 2xx：抛出含状态码的错误', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });
    const provider = createOpenAICompatibleProvider({
      endpoint: 'https://x/chat/completions',
      apiKey: 'bad',
      model: 'm',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await expect(provider('S', [])).rejects.toThrow(/401/);
  });
});
