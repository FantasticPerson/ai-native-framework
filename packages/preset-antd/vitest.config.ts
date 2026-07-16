import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // runtime 适配器测试需要 DOM；scan-form 纯逻辑测试不受影响
    environment: 'jsdom',
  },
});
