import { describe, expect, it, vi } from 'vitest';
import { createHttpProvider } from './provider';

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
