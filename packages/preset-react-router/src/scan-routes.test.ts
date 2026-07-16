import { describe, expect, it } from 'vitest';
import { scanRoutes } from './scan-routes';

describe('scanRoutes', () => {
  it('从标准 <Routes>/<Route> 提取模块（path + 组件名）', () => {
    const code = `
      export default function App() {
        return (
          <Routes>
            <Route path="/dashboard" element={<DashboardModule />} />
            <Route path="/leave" element={<LeaveModule />} />
          </Routes>
        );
      }
    `;
    const mods = scanRoutes(code);
    expect(mods).toContainEqual({ name: 'dashboard', route: '/dashboard', component: 'DashboardModule' });
    expect(mods).toContainEqual({ name: 'leave', route: '/leave', component: 'LeaveModule' });
  });

  it('跳过 <Navigate> 重定向路由', () => {
    const code = `<Routes><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/leave" element={<LeaveModule />} /></Routes>;`;
    const mods = scanRoutes(code);
    expect(mods.map((m) => m.name)).toEqual(['leave']);
  });

  it('跳过没有 element 或 element 非组件的 Route', () => {
    const code = `<Routes><Route path="/x" /><Route path="/leave" element={<LeaveModule />} /></Routes>;`;
    const mods = scanRoutes(code);
    expect(mods.map((m) => m.name)).toEqual(['leave']);
  });

  it('嵌套/多段 path 用末段作为模块名', () => {
    const code = `<Route path="/admin/users" element={<UsersModule />} />;`;
    const mods = scanRoutes(code);
    expect(mods).toContainEqual({ name: 'users', route: '/admin/users', component: 'UsersModule' });
  });

  it('忽略动态参数段与通配', () => {
    const code = `<Routes><Route path="/leave/:id" element={<LeaveDetail />} /><Route path="*" element={<NotFound />} /></Routes>;`;
    const mods = scanRoutes(code);
    // 末段是 :id → 回退到上一段 leave；* 通配跳过
    expect(mods.map((m) => m.name)).toEqual(['leave']);
  });

  it('解析失败返回空数组，不抛异常', () => {
    expect(scanRoutes('const = = =')).toEqual([]);
  });
});
