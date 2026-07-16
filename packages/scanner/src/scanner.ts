import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { JSXOpeningElement, JSXAttribute } from '@babel/types';
import type { ManifestField } from '@ai-native/core';
import type { ScanResult } from './types';

// @babel/traverse 的默认导出在 ESM 下需取 .default
const traverse = (_traverse as unknown as { default: typeof _traverse }).default ?? _traverse;

type FieldType = ManifestField['type'];
const FIELD_TYPES: FieldType[] = ['text', 'number', 'date', 'select'];

/** 从 JSX 元素属性中读取字面量字符串值；非字面量返回 undefined。 */
function readLiteral(el: JSXOpeningElement, name: string): { value?: string; present: boolean; literal: boolean } {
  const attr = el.attributes.find(
    (a): a is JSXAttribute => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === name,
  );
  if (!attr) return { present: false, literal: true };
  const v = attr.value;
  if (v && v.type === 'StringLiteral') return { value: v.value, present: true, literal: true };
  if (v && v.type === 'JSXExpressionContainer' && v.expression.type === 'StringLiteral') {
    return { value: v.expression.value, present: true, literal: true };
  }
  return { present: true, literal: false };
}

/** 读取形如 options={['a','b']} 的字符串数组字面量 */
function readArrayLiteral(el: JSXOpeningElement, name: string): string[] | undefined {
  const attr = el.attributes.find(
    (a): a is JSXAttribute => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === name,
  );
  if (!attr || !attr.value || attr.value.type !== 'JSXExpressionContainer') return undefined;
  const expr = attr.value.expression;
  if (expr.type !== 'ArrayExpression') return undefined;
  const out: string[] = [];
  for (const el2 of expr.elements) {
    if (el2 && el2.type === 'StringLiteral') out.push(el2.value);
  }
  return out;
}

/** 扫描单个源码文件，提取其中的 data-ai-* 标注与 <Field> 约定组件。 */
export function scanSource(code: string): ScanResult {
  const result: ScanResult = { actions: [], fields: [], warnings: [] };

  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch (e) {
    result.warnings.push(`解析失败: ${(e as Error).message}`);
    return result;
  }

  traverse(ast, {
    JSXOpeningElement(path) {
      const el = path.node;
      const action = readLiteral(el, 'data-ai-action');
      const field = readLiteral(el, 'data-ai-field');
      const moduleAttr = readLiteral(el, 'data-ai-module');
      const label = readLiteral(el, 'data-ai-label');

      for (const [n, r] of [
        ['data-ai-action', action],
        ['data-ai-field', field],
        ['data-ai-module', moduleAttr],
      ] as const) {
        if (r.present && !r.literal) {
          result.warnings.push(`${n} 的值必须是字符串字面量，禁止变量/表达式`);
        }
      }

      if (action.present && action.literal && action.value) {
        result.actions.push({ id: action.value, label: label.value ?? action.value });
      }

      if (field.present && field.literal && field.value) {
        const typeAttr = readLiteral(el, 'data-ai-type');
        const type = (FIELD_TYPES.includes(typeAttr.value as FieldType) ? typeAttr.value : 'text') as FieldType;
        const optionsAttr = readLiteral(el, 'data-ai-options');
        const entry: ManifestField = {
          id: field.value,
          label: label.value ?? field.value,
          type,
        };
        if (type === 'select') {
          if (optionsAttr.value) {
            entry.options = optionsAttr.value.split(',').map((s) => s.trim()).filter(Boolean);
          } else {
            result.warnings.push(`字段 ${field.value} 为 select 但缺少 data-ai-options`);
          }
        }
        result.fields.push(entry);
      }

      // 约定组件 <Field aiField aiLabel type options />：等价于一个 data-ai-field
      // 注：这是 demo 引入的约定，后续应移入 preset 层。
      const elName = el.name.type === 'JSXIdentifier' ? el.name.name : '';
      if (elName === 'Field') {
        const fId = readLiteral(el, 'aiField');
        const fLabel = readLiteral(el, 'aiLabel');
        if (fId.present && !fId.literal) {
          result.warnings.push('Field 的 aiField 必须是字符串字面量');
        }
        if (fId.present && fId.literal && fId.value) {
          const typeAttr = readLiteral(el, 'type');
          const type = (FIELD_TYPES.includes(typeAttr.value as FieldType) ? typeAttr.value : 'text') as FieldType;
          const optionsAttr = readLiteral(el, 'options');
          const optionsArr = readArrayLiteral(el, 'options');
          const entry: ManifestField = {
            id: fId.value,
            label: fLabel.value ?? fId.value,
            type,
          };
          if (type === 'select') {
            const opts =
              optionsArr ??
              (optionsAttr.value ? optionsAttr.value.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
            if (opts && opts.length) {
              entry.options = opts;
            } else {
              result.warnings.push(`字段 ${fId.value} 为 select 但缺少 options`);
            }
          }
          result.fields.push(entry);
        }
      }

      if (moduleAttr.present && moduleAttr.literal && moduleAttr.value) {
        const route = readLiteral(el, 'data-ai-route');
        result.module = {
          name: moduleAttr.value,
          label: label.value ?? moduleAttr.value,
          route: route.value ?? `/${moduleAttr.value}`,
        };
      }
    },
  });

  return result;
}
