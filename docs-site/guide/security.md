# 安全模型

## 危险操作二次确认

危险性是操作的**固有属性**，在编译期声明进能力清单，而非运行时临时判断。

数据流：

1. **标注**：`data-ai-confirm` 标注危险操作（删除、审批、驳回等）。
2. **扫描**：scanner 填 `ManifestAction.confirm: true`。
3. **执行**：executor 在 click 前经 `confirm` 回调二次确认，拒绝则优雅中断（并标注 `kind: 'user-cancelled'`，不触发重试）。

```tsx
<button data-ai-action="employees.delete" data-ai-label="删除员工" data-ai-confirm>删除</button>
```

## 机制与策略分离

- **core 只定义「要不要问」**：`actionOf` + `confirm` 回调，缺省即放行（headless 可用）。
- **react / vue 提供默认策略**：`window.confirm` 兜底，宿主可传 `onConfirm` 弹自定义 Modal。
- **prompt 让 LLM 知情**：标注危险操作让 LLM 知道，但真正的闸门在 executor，不依赖 LLM 自觉。

默认全放行，只拦显式标注的操作——诚实、不打扰。

## key 不进前端

LLM 的 API key 是红线，绝不进前端 bundle：

- **浏览器**：走 `createHttpProvider` + 服务端代理，key 在服务端环境变量。
- **直连 provider**（`createOpenAICompatibleProvider`）：携带 apiKey，**仅用于可安全持有 key 的环境**（Node / CLI / MCP），不可在浏览器使用。

## 边界

AI 能执行的操作严格限定在编译期确定的能力清单白名单内。LLM 编造的清单外模块/操作会被 `parsePlan` 拒绝，不会执行。
