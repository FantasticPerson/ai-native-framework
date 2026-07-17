# 计划：动态表单扫描——解析变量引用的 options（阶段 2 收尾）

## 背景与实测结论

先用只读探测确认了 scanner 对四类「动态」场景的真实行为（不靠猜）：

| 场景 | 当前行为 | 处理 |
|---|---|---|
| 条件渲染字段 `{isVip && <Form.Item>}` | ✅ 已扫到（babel 深入表达式） | 无需改 |
| **options 引用常量 `options={TYPES}`** | 🟡 字段在，options 丢失 | **本计划要补** |
| **options 用 `.map()` `TYPES.map(v=>({value:v}))`** | 🟡 字段在，options 丢失 | **本计划要补** |
| 循环生成字段 `fields.map(f=><Form.Item name={f.key}>)` | ❌ 扫不到（name 非字面量） | 物理边界，留给运行时 |

结论：唯一值得补的静态可解场景是**同文件内变量引用的 Select options**。这是最常见的真实写法（把选项抽成模块级常量复用），当前却丢失，导致 LLM 不知道 select 的合法值。其余场景要么已支持，要么是物理边界。

## 目标

`scanFormItems` 支持从**同文件内的模块级常量**解析 Select 的 options：
1. `const TYPES = ['事假','病假']; <Select options={TYPES}/>` → options: ['事假','病假']
2. `const TYPES = ['事假','病假']; <Select options={TYPES.map(v=>({value:v,label:v}))}/>` → options: ['事假','病假']
3. `const OPTS = [{value:'a',label:'A'}]; <Select options={OPTS}/>` → options: ['a']

## 非目标（诚实边界，写进代码注释 + ROADMAP）

- 跨文件 import 的常量：不解析（要跟 import 解析，成本高、收益低）。
- 循环生成字段（name 非字面量）：静态不可知，留给未来「运行时提取」。
- options 来自 API/props/state：运行时才有值，静态无解。
- `.map()` 里复杂变换（非 `v=>({value:v})` 这种直取模式）：只认「数组每项直接映射为 value」的常见形态，其余放弃并可选 warn。

## 设计

改动集中在 `packages/preset-antd/src/scan-form.ts`，不动 core/scanner/react。

### 1. 建文件级常量符号表

`scanFormItems` 解析出 AST 后，先遍历顶层 `VariableDeclaration`，收集形如 `const NAME = [...]` 的数组字面量，存成 `Map<string, string[]>`（值为解析出的 string 列表，object 取 value 字段）。复用现有 `readSelectOptions` 里已有的「ArrayExpression → string[]」逻辑，抽成一个纯函数 `arrayExprToStrings(expr)` 供两处共用。

### 2. readSelectOptions 扩展

当前只认 `options={[...]}`（内联 ArrayExpression）。新增：
- `options={IDENT}`（Identifier）→ 查符号表。
- `options={IDENT.map(...)}`（CallExpression，callee 是 `IDENT.map`）→ 查符号表拿 IDENT 的数组，`.map` 的变换忽略（因为数组项本身就是 value 源）。对 `['a','b'].map(...)` 内联数组同样处理。

`readSelectOptions` 需要能访问符号表，改签名 `readSelectOptions(select, symbols)`。

### 3. arrayExprToStrings 纯函数

抽取现有内联数组解析逻辑：ArrayExpression 的每个元素，StringLiteral 取值、ObjectExpression 取 value 属性的 StringLiteral。符号表收集和内联解析都用它，去重复。

## 测试计划（TDD，先写 scan-form.test.ts 新增用例）

- `options={常量标识符}`（字符串数组常量）→ options 正确。
- `options={常量标识符}`（对象数组常量 `[{value,label}]`）→ 取 value。
- `options={常量.map(v=>({value:v,label:v}))}` → options 正确。
- `options={内联数组.map(...)}` → options 正确（回归，不破坏现有）。
- 常量未定义（引用了不存在的标识符）→ options 缺省（不崩，type 仍 select）。
- 现有 6 个 options 用例全部回归通过。

## 验证

- `pnpm --filter @ai-operable/preset-antd test` 新增用例 + 回归全绿。
- demo 反向验证：把 LeaveForm 的内联 options 改回「模块级常量 + `.map()`」写法（更贴近真实开发），重新构建，确认 manifest 的 `leave.type.options` 仍完整。这一步同时证明「我们之前为了迁就扫描器把 options 内联」的妥协可以取消——扫描器现在能跟上真实写法。
- `pnpm -r build` 全量通过。

## 风险

- babel AST 类型判断繁琐：`.map` 的 callee 形态判断（MemberExpression + property.name==='map'）要写对，靠测试兜底。
- 符号表只在单文件作用域：跨文件常量拿不到——这是设计边界，注释写明，不是 bug。
- 影响面小：只动 preset-antd 一个函数，core/其他 preset 不受影响。
