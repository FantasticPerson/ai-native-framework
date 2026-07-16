import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { aiScannerPlugin } from '@ai-native/scanner/vite';
import { reactRouterPreset } from '@ai-native/preset-react-router';
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
    server:{port:5088},
    plugins: [
      react(),
      aiScannerPlugin({
        presets: [
          reactRouterPreset({
            routesFile: 'src/App.tsx',
            labels: {
              '/dashboard': '仪表盘',
              '/employees': '员工管理',
              '/leave': '请假管理',
              '/expense': '报销管理',
            },
          }),
        ],
      }),
      chatProxyPlugin(apiKey),
    ],
  };
});
