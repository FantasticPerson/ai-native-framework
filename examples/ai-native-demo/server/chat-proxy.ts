import type { IncomingMessage, ServerResponse } from 'node:http';

const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * 处理 POST /api/chat：接收 { system, messages }，转发到 DeepSeek（OpenAI 兼容格式）。
 * key 从 process.env.DEEPSEEK_API_KEY 读取，不进入前端 bundle。
 * 强制 response_format=json_object，保证模型只输出规定的操作序列 JSON。
 */
export async function handleChat(req: IncomingMessage, res: ServerResponse, apiKey: string | undefined) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }
  if (!apiKey) {
    sendJson(res, 500, { error: '未配置 DEEPSEEK_API_KEY，请在 .env 中填写' });
    return;
  }

  try {
    const raw = await readBody(req);
    const { system, messages } = JSON.parse(raw || '{}') as {
      system?: string;
      messages?: Array<{ role: string; content: string }>;
    };

    // OpenAI 格式：system 作为 messages 首条
    const finalMessages = system ? [{ role: 'system', content: system }, ...(messages ?? [])] : messages ?? [];

    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: finalMessages,
        max_tokens: 1024,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      sendJson(res, 502, { error: `上游返回 ${upstream.status}`, detail: text.slice(0, 500) });
      return;
    }

    const data = (await upstream.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? '';
    sendJson(res, 200, { text });
  } catch (e) {
    sendJson(res, 500, { error: '代理处理失败', detail: (e as Error).message });
  }
}
