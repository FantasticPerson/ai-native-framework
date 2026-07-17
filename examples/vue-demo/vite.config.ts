import { defineConfig, loadEnv, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { aiScannerPlugin } from '@ai-operable/scanner/vite';
import { handleChat } from './server/chat-proxy';

function chatProxyPlugin(apiKey: string | undefined): Plugin {
  return {
    name: 'chat-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (url === '/api/chat' || url.startsWith('/api/chat?')) {
          handleChat(req, res, apiKey);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.DEEPSEEK_API_KEY;

  return {
    server: { port: 5099 },
    plugins: [
      vue(),
      // 扫 .vue 的 <template> 里 data-ai-* 标注生成 manifest——证明扫描链也框架无关。
      aiScannerPlugin({
        modulesDir: 'src/modules',
        extensions: ['.vue'],
      }),
      chatProxyPlugin(apiKey),
    ],
  };
});
