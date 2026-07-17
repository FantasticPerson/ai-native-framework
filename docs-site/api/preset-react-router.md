# @ai-native/preset-react-router

自动推断第一层：扫 react-router 路由配置得到模块清单。依赖 `scanner`。

## reactRouterPreset

```ts
import { reactRouterPreset } from '@ai-native/preset-react-router';

reactRouterPreset({
  routesFile: 'src/App.tsx',           // 含 <Routes>/<Route> 的文件
  labels: {                            // 可选，给路由补中文标签
    '/leave': '请假管理',
    '/expense': '报销管理',
  },
});
// 返回 Preset，传给 aiScannerPlugin 的 presets
```

静态解析 JSX 式 `<Route path element>` 推断模块（跳过 `<Navigate>`、动态参数、通配路由）。

## scanRoutes

```ts
import { scanRoutes } from '@ai-native/preset-react-router';
const modules = scanRoutes(code); // RouteModule[]
```

## 边界

仅支持 JSX 式 `<Routes>/<Route>`。数据式 `createBrowserRouter([...])` 暂不支持（诚实边界）。够不到的路由用 `labels` 配置补，或用 `data-ai-module` 手标。
