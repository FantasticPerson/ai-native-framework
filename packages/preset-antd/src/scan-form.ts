import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { JSXElement, JSXOpeningElement, JSXAttribute } from '@babel/types';

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

/** 从 Select 读取 options：支持 options={['a','b']}、options={[{value,label}]}、<Option> 子元素 */
function readSelectOptions(select: JSXElement): string[] | undefined {
  const optAttr = select.openingElement.attributes.find(
    (a): a is JSXAttribute =>
      a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === 'options',
  );
  if (optAttr && optAttr.value?.type === 'JSXExpressionContainer' && optAttr.value.expression.type === 'ArrayExpression') {
    const out: string[] = [];
    for (const el of optAttr.value.expression.elements) {
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
    return out.length ? out : undefined;
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
 */
export function scanFormItems(code: string): FormItemField[] {
  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch {
    return [];
  }

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
        const options = readSelectOptions(select);
        if (options) field.options = options;
      }
      fields.push(field);
    },
  });

  return fields;
}
