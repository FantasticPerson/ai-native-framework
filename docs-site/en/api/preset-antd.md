# @ai-native/preset-antd

Auto-inference layer 2: scans antd `<Form.Item>` to get the field list. Depends on `scanner`. Includes both build-time scanning and runtime field adaptation (split into sub-packages with different dependency sets).

## antdPreset (build time)

```ts
import { antdPreset } from '@ai-native/preset-antd';

antdPreset({
  forms: [
    { module: 'leave', file: 'src/modules/leave/LeaveForm.tsx' },
    { module: 'employees', file: 'src/modules/employees/EmployeeForm.tsx' },
  ],
});
// returns a Preset, passed to aiScannerPlugin's presets
```

Statically parses antd `<Form.Item name label>` and infers the field type from the child control:

| Child control | Inferred type |
|---|---|
| `Input` | `text` |
| `InputNumber` | `number` |
| `DatePicker` | `date` |
| `Select` | `select` (with options) |

Select option sources: inline literal arrays, `<Option>` children, same-file constant references, `.map()` transforms.

## createAntdFieldAdapter (runtime)

```ts
import { createAntdFieldAdapter } from '@ai-native/preset-antd/runtime';

const fieldAdapter = createAntdFieldAdapter();
useAIAgent({ manifest, provider, fieldAdapter }); // passed through to react/vue's useAIAgent
```

Handles locating and filling antd's non-native controls:

- **Locate**: uses antd's auto-generated id (`leave.type` → `#type`); `data-ai-field` takes priority.
- **Fill dispatch**: native input is set directly (low risk); Select simulates opening and clicking `.ant-select-item-option` (depends on antd's internal class); DatePicker is best-effort.

## Boundary

The runtime filling of Select / DatePicker depends on antd's internal classes and may break on a major antd upgrade — the cost is contained in a single runtime file, maintained alongside the antd version. Constants imported cross-file and API/state-driven options are not parsed.
