import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { reactRouterPreset } from './preset';

function tmpRoutesFile(code: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'preset-rr-'));
  const file = join(dir, 'App.tsx');
  writeFileSync(file, code, 'utf-8');
  return file;
}

const ROUTES = `
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<DashboardModule />} />
    <Route path="/leave" element={<LeaveModule />} />
  </Routes>;
`;

describe('reactRouterPreset', () => {
  it('产出模块种子：name / route，label 缺省回退到 name', () => {
    const file = tmpRoutesFile(ROUTES);
    const seeds = reactRouterPreset({ routesFile: file }).collect().modules ?? [];
    expect(seeds).toContainEqual({ name: 'dashboard', route: '/dashboard', label: undefined });
    expect(seeds).toContainEqual({ name: 'leave', route: '/leave', label: undefined });
    expect(seeds.map((s) => s.name)).not.toContain('Navigate');
  });

  it('labels 按路由路径补人类可读名（第二层配置补漏）', () => {
    const file = tmpRoutesFile(ROUTES);
    const seeds =
      reactRouterPreset({
        routesFile: file,
        labels: { '/dashboard': '仪表盘', '/leave': '请假管理' },
      })
        .collect()
        .modules ?? [];
    expect(seeds).toContainEqual({ name: 'dashboard', route: '/dashboard', label: '仪表盘' });
    expect(seeds).toContainEqual({ name: 'leave', route: '/leave', label: '请假管理' });
  });

  it('routesFile 不存在时返回空 contribution，不抛异常', () => {
    const c = reactRouterPreset({ routesFile: '/no/such/file.tsx' }).collect();
    expect(c).toEqual({});
  });

  it('name 为 react-router', () => {
    expect(reactRouterPreset({ routesFile: 'x' }).name).toBe('react-router');
  });
});
