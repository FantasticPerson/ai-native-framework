# @ai-operable/preset-antd

自动推断第二层：扫 antd `<Form.Item>` 得到字段清单。依赖 `scanner`。含构建时扫描与运行时字段适配两部分（分子包，依赖集不同）。

## antdPreset（构建时）

```ts
import { antdPreset } from '@ai-operable/preset-antd';

antdPreset({
  forms: [
    { module: 'leave', file: 'src/modules/leave/LeaveForm.tsx' },
    { module: 'employees', file: 'src/modules/employees/EmployeeForm.tsx' },
  ],
});
// 返回 Preset，传给 aiScannerPlugin 的 presets
```

静态解析 antd `<Form.Item name label>`，从子控件推断字段类型：

| 子控件 | 推断类型 |
|---|---|
| `Input` | `text` |
| `InputNumber` | `number` |
| `DatePicker` | `date` |
| `Select` | `select`（含选项） |

Select 选项来源：内联字面量数组、`<Option>` 子元素、同文件常量引用、`.map()` 变换。

## createAntdFieldAdapter（运行时）

```ts
import { createAntdFieldAdapter } from '@ai-operable/preset-antd/runtime';

const fieldAdapter = createAntdFieldAdapter();
useAIAgent({ manifest, provider, fieldAdapter }); // 透传给 react/vue 的 useAIAgent
```

处理 antd 非原生控件的定位与填值：

- **定位**：走 antd 自动生成的 id（`leave.type` → `#type`），`data-ai-field` 优先。
- **填值分派**：原生 input 直接设值（低风险）；Select 模拟展开点选 `.ant-select-item-option`（依赖 antd 内部 class）；DatePicker best-effort。

## 边界

Select / DatePicker 的运行时填值依赖 antd 内部 class，antd 大版本升级可能失效——代价收敛在 runtime 一个文件，随 antd 版本维护。跨文件 import 的常量、API/state 驱动的选项不解析。
