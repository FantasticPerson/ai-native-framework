import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type {
  JSXElement,
  JSXOpeningElement,
  JSXAttribute,
  ArrayExpression,
  Expression,
} from '@babel/types';

// @babel/traverse 的默认导出在 ESM 下需取 .default
const traverse = (_traverse as unknown as { default: typeof _traverse }).default ?? _traverse;

type FieldType = 'text' | 'number' | 'date' | 'select';

/** 从 antd Form.Item 推断出的字段（未含 module 前缀，由 preset 补） */
export interface FormItemField {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
}

/** antd 子组件名 → 字段类型 */
const WIDGET_TYPE: Record<string, FieldType> = {
  Input: 'text',
  'Input.TextArea': 'text',
  TextArea: 'text',
  InputNumber: 'number',
  DatePicker: 'date',
  Select: 'select',
};

/** 读取 JSX 属性的字符串字面量值 */
function readStringAttr(el: JSXOpeningElement, name: string): string | undefined {
  const attr = el.attributes.find(
    (a): a is JSXAttribute => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === name,
  );
  if (!attr || !attr.value) return undefined;
  if (attr.value.type === 'StringLiteral') return attr.value.value;
  if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type === 'StringLiteral') {
    return attr.value.expression.value;
  }
  return undefined;
}

/** JSX 元素名转字符串：Input / Form.Item / Input.TextArea */
function elementName(el: JSXOpeningElement): string {
  const n = el.name;
  if (n.type === 'JSXIdentifier') return n.name;
  if (n.type === 'JSXMemberExpression') {
    const obj = n.object.type === 'JSXIdentifier' ? n.object.name : '';
    const prop = n.property.type === 'JSXIdentifier' ? n.property.name : '';
    return `${obj}.${prop}`;
  }
  return '';
}

/** ArrayExpression → string[]：StringLiteral 取值，ObjectExpression 取 value 属性 */
function arrayExprToStrings(expr: ArrayExpression): string[] {
  const out: string[] = [];
  for (const el of expr.elements) {
    if (!el) continue;
    if (el.type === 'StringLiteral') out.push(el.value);
    else if (el.type === 'ObjectExpression') {
      for (const p of el.properties) {
        if (
          p.type === 'ObjectProperty' &&
          p.key.type === 'Identifier' &&
          p.key.name === 'value' &&
          p.value.type === 'StringLiteral'
        ) {
          out.push(p.value.value);
        }
      }
    }
  }
  return out;
}

/**
 * 把 options 表达式解析成字符串数组，支持：
 * - 内联数组 [...]、内联数组.map(...)
 * - 标识符引用同文件常量 IDENT、IDENT.map(...)
 * .map 的变换忽略——数组项本身即 value 源（只认常见的直取模式）。
 */
function optionsExprToStrings(expr: Expression, symbols: Map<string, string[]>): string[] | undefined {
  // 拆掉 .map(...)：foo.map(...) → 取 foo
  let target: Expression = expr;
  if (
    expr.type === 'CallExpression' &&
    expr.callee.type === 'MemberExpression' &&
    expr.callee.property.type === 'Identifier' &&
    expr.callee.property.name === 'map' &&
    (expr.callee.object.type === 'ArrayExpression' || expr.callee.object.type === 'Identifier')
  ) {
    target = expr.callee.object;
  }

  if (target.type === 'ArrayExpression') {
    const out = arrayExprToStrings(target);
    return out.length ? out : undefined;
  }
  if (target.type === 'Identifier') {
    const found = symbols.get(target.name);
    return found && found.length ? found : undefined;
  }
  return undefined;
}

/** 从 Select 读取 options：内联数组 / 常量引用 / .map(...) / <Option> 子元素 */
function readSelectOptions(select: JSXElement, symbols: Map<string, string[]>): string[] | undefined {
  const optAttr = select.openingElement.attributes.find(
    (a): a is JSXAttribute =>
      a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === 'options',
  );
  if (
    optAttr &&
    optAttr.value?.type === 'JSXExpressionContainer' &&
    optAttr.value.expression.type !== 'JSXEmptyExpression'
  ) {
    const parsed = optionsExprToStrings(optAttr.value.expression, symbols);
    if (parsed) return parsed;
  }

  // <Option value="x"> 子元素
  const out: string[] = [];
  for (const child of select.children) {
    if (child.type === 'JSXElement') {
      const cn = elementName(child.openingElement);
      if (cn === 'Option' || cn === 'Select.Option') {
        const v = readStringAttr(child.openingElement, 'value');
        if (v !== undefined) out.push(v);
      }
    }
  }
  return out.length ? out : undefined;
}

/** 在 Form.Item 的子孙里找第一个可识别的输入控件，返回 [type, selectElement?] */
function inferWidget(item: JSXElement): { type: FieldType; select?: JSXElement } {
  for (const child of item.children) {
    if (child.type !== 'JSXElement') continue;
    const cn = elementName(child.openingElement);
    if (cn in WIDGET_TYPE) {
      const type = WIDGET_TYPE[cn];
      return type === 'select' ? { type, select: child } : { type };
    }
  }
  return { type: 'text' };
}

/**
 * 静态解析源码里的 antd `<Form.Item name label>`，从子控件推断字段类型。
 * 仅支持 JSX 结构；动态生成的表单看不到（诚实的边界）。
 * Select options 支持内联数组、同文件常量引用、.map(...)；跨文件 import 的常量不解析。
 */
export function scanFormItems(code: string): FormItemField[] {
  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch {
    return [];
  }

  // 先建同文件常量符号表：const NAME = [...] → NAME -> string[]
  const symbols = new Map<string, string[]>();
  traverse(ast, {
    VariableDeclarator(path) {
      const { id, init } = path.node;
      if (id.type === 'Identifier' && init && init.type === 'ArrayExpression') {
        symbols.set(id.name, arrayExprToStrings(init));
      }
    },
  });

  const fields: FormItemField[] = [];
  traverse(ast, {
    JSXElement(path) {
      const el = path.node;
      if (elementName(el.openingElement) !== 'Form.Item') return;

      const name = readStringAttr(el.openingElement, 'name');
      if (!name) return;
      const label = readStringAttr(el.openingElement, 'label') ?? name;

      const { type, select } = inferWidget(el);
      const field: FormItemField = { name, label, type };
      if (type === 'select' && select) {
        const options = readSelectOptions(select, symbols);
        if (options) field.options = options;
      }
      fields.push(field);
    },
  });

  return fields;
}
