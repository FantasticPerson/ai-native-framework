# 接入光谱

接入不是「全自动 vs 全手动」的二选一，而是一条光谱：**低地板 + 高天花板**，按需组合。

## 三层

### 第一层：自动推断（零改动）

preset 在构建时扫描代码已有结构，零改动生成能力清单：

- `preset-react-router` 扫路由配置得到模块清单。
- `preset-antd` 扫 antd `<Form.Item>` 得到字段清单（含类型、Select 选项）。

多数中后台场景这一层就够用。

### 第二层：配置补漏

自动推断够不到的地方（如数据式路由、跨文件常量），用配置文件补：

```ts
reactRouterPreset({
  routesFile: 'src/App.tsx',
  labels: { '/leave': '请假管理', '/expense': '报销管理' },
});
```

### 第三层：手动精标

准确率要求最高、或结构无法静态推断时，用 `data-ai-*` 属性精确标注：

```tsx
<button data-ai-action="leave.submit" data-ai-label="提交申请" data-ai-confirm>提交</button>
<input data-ai-field="leave.days" data-ai-label="天数" data-ai-type="number" />
```

## 优先级

**手标覆盖种子**：同一 id 的手动标注优先于 preset 自动推断的种子。自动推断是地板，手标是天花板——你可以只在关键操作上精标，其余交给自动推断。

## 诚实的边界

- 自动推断准确率 < 手动标注，是物理规律。
- 循环生成的字段（name 非字面量）、API/state 驱动的选项，静态扫描看不到——这些是物理边界，留给运行时或手标。
