// 生产服务：Koa 静态托管 dist/ + /api/chat 转发 DeepSeek。
// 用 `node --env-file=.env server/prod-server.mjs` 启动（Node 18+ 原生读 .env）。
// /api/chat 转发逻辑与 server/chat-proxy.ts 保持同步（dev 是 Vite 中间件，prod 是 Koa 进程）。
import Koa from 'koa';
import serve from 'koa-static';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT) || 5088;
const API_KEY = process.env.DEEPSEEK_API_KEY;

const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const app = new Koa();

// POST /api/chat：转发 DeepSeek
app.use(async (ctx, next) => {
  if (ctx.path !== '/api/chat') return next();
  if (ctx.method !== 'POST') {
    ctx.status = 405;
    ctx.body = { error: 'Method Not Allowed' };
    return;
  }
  if (!API_KEY) {
    ctx.status = 500;
    ctx.body = { error: '未配置 DEEPSEEK_API_KEY，请在 .env 中填写' };
    return;
  }

  try {
    const raw = await readBody(ctx.req);
    const { system, messages } = JSON.parse(raw || '{}');
    const finalMessages = system ? [{ role: 'system', content: system }, ...(messages ?? [])] : messages ?? [];

    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${API_KEY}` },
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
      ctx.status = 502;
      ctx.body = { error: `上游返回 ${upstream.status}`, detail: text.slice(0, 500) };
      return;
    }

    const data = await upstream.json();
    ctx.status = 200;
    ctx.body = { text: data.choices?.[0]?.message?.content ?? '' };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { error: '代理处理失败', detail: e.message };
  }
});

// 静态资源
app.use(serve(DIST));

// SPA fallback：其余 GET 请求回 index.html
app.use(async (ctx) => {
  if (ctx.method !== 'GET') return;
  ctx.type = 'html';
  ctx.body = await readFile(join(DIST, 'index.html'), 'utf-8');
});

app.listen(PORT, () => {
  console.log(`生产服务已启动：http://localhost:${PORT}`);
  if (!API_KEY) console.warn('警告：未检测到 DEEPSEEK_API_KEY，/api/chat 将返回 500');
});
