# @ai-native/preset-react-router

Auto-inference layer 1: scans the react-router route config to get the module list. Depends on `scanner`.

## reactRouterPreset

```ts
import { reactRouterPreset } from '@ai-native/preset-react-router';

reactRouterPreset({
  routesFile: 'src/App.tsx',           // file containing <Routes>/<Route>
  labels: {                            // optional, add labels to routes
    '/leave': 'Leave',
    '/expense': 'Expense',
  },
});
// returns a Preset, passed to aiScannerPlugin's presets
```

Statically parses JSX-style `<Route path element>` to infer modules (skipping `<Navigate>`, dynamic params, wildcard routes).

## scanRoutes

```ts
import { scanRoutes } from '@ai-native/preset-react-router';
const modules = scanRoutes(code); // RouteModule[]
```

## Boundary

Only JSX-style `<Routes>/<Route>` is supported. Data-style `createBrowserRouter([...])` is not yet supported (honest boundary). Fill unreachable routes with the `labels` config, or annotate manually with `data-ai-module`.
