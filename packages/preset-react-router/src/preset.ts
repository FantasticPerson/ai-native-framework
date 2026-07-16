import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Preset, PresetContribution } from '@ai-native/scanner';
import { scanRoutes } from './scan-routes';

export interface ReactRouterPresetOptions {
  /** 路由定义所在文件，相对 cwd，如 'src/App.tsx' */
  routesFile: string;
  /**
   * 按路由路径补充人类可读的模块 label。路由本身不编码 label，
   * 缺省时 aggregate 会回退到 name（诚实的边界）。这是三层接入光谱
   * 第二层「配置补漏」：一处集中配置，替代散落在各组件的手标。
   */
  labels?: Record<string, string>;
}

/**
 * 自动推断预设：扫 react-router 的 <Route> 得模块清单（RFC §4 第一层）。
 * 零改动接入——不要求业务组件写 data-ai-module。
 */
export function reactRouterPreset(options: ReactRouterPresetOptions): Preset {
  return {
    name: 'react-router',
    collect(): PresetContribution {
      let code: string;
      try {
        code = readFileSync(resolve(process.cwd(), options.routesFile), 'utf-8');
      } catch {
        return {};
      }
      const labels = options.labels ?? {};
      return {
        modules: scanRoutes(code).map((m) => ({
          name: m.name,
          route: m.route,
          label: labels[m.route],
        })),
      };
    },
  };
}
