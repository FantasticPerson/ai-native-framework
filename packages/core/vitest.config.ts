import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // executor 测试需要 DOM；纯逻辑测试（plan）不受影响
    environment: 'jsdom',
  },
});
