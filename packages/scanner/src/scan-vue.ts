import { parse } from '@vue/compiler-sfc';
import type { ManifestAction, ManifestField } from '@ai-native/core';
import type { ScanResult } from './types';

type FieldType = ManifestField['type'];
const FIELD_TYPES: FieldType[] = ['text', 'number', 'date', 'select'];

// @vue/compiler-sfc 的 template AST 节点类型（数值枚举，避免引入运行时枚举依赖）：
//   1 = Element，6 = 静态属性（有 name / value.content），7 = 指令（v-bind / :xxx）
const NODE_ELEMENT = 1;
const ATTR_STATIC = 6;
const ATTR_DIRECTIVE = 7;

interface VueAttr {
  type: number;
  name: string;
  value?: { content?: string };
  arg?: { content?: string };
}
interface VueNode {
  type: number;
  tag?: string;
  props?: VueAttr[];
  children?: VueNode[];
}

/** 从元素静态属性读值。返回 present（是否出现，含无值属性如 data-ai-confirm）与 value。 */
function readAttr(props: VueAttr[], name: string): { value?: string; present: boolean } {
  const attr = props.find((p) => p.type === ATTR_STATIC && p.name === name);
  if (!attr) return { present: false };
  return { value: attr.value?.content, present: true };
}

/** 是否存在把该属性写成动态绑定（:name / v-bind:name）——对应 JSX 的非字面量，应告警。 */
function hasDynamicBind(props: VueAttr[], name: string): boolean {
  return props.some((p) => p.type === ATTR_DIRECTIVE && p.name === 'bind' && p.arg?.content === name);
}

/** 扫描单个 Vue SFC，提取 <template> 中的 data-ai-* 标注，产出与 scanSource 同构的 ScanResult。 */
export function scanVueSource(code: string): ScanResult {
  const result: ScanResult = { actions: [], fields: [], warnings: [] };

  let ast: VueNode | null | undefined;
  try {
    const { descriptor, errors } = parse(code, { filename: 'component.vue' });
    if (errors.length) {
      result.warnings.push(`解析失败: ${errors[0].message}`);
      return result;
    }
    ast = descriptor.template?.ast as VueNode | undefined;
  } catch (e) {
    result.warnings.push(`解析失败: ${(e as Error).message}`);
    return result;
  }
  if (!ast) return result;

  const visit = (node: VueNode) => {
    if (node.type === NODE_ELEMENT) {
      const props = node.props ?? [];

      for (const n of ['data-ai-action', 'data-ai-field', 'data-ai-module']) {
        if (hasDynamicBind(props, n)) {
          result.warnings.push(`${n} 的值必须是静态字面量，禁止动态绑定（:${n} / v-bind）`);
        }
      }

      const action = readAttr(props, 'data-ai-action');
      const field = readAttr(props, 'data-ai-field');
      const moduleAttr = readAttr(props, 'data-ai-module');
      const label = readAttr(props, 'data-ai-label');

      if (action.present && action.value) {
        const confirm = readAttr(props, 'data-ai-confirm');
        const entry: ManifestAction = { id: action.value, label: label.value ?? action.value };
        if (confirm.present) entry.confirm = true;
        result.actions.push(entry);
      }

      if (field.present && field.value) {
        const typeAttr = readAttr(props, 'data-ai-type');
        const type = (FIELD_TYPES.includes(typeAttr.value as FieldType) ? typeAttr.value : 'text') as FieldType;
        const entry: ManifestField = { id: field.value, label: label.value ?? field.value, type };
        if (type === 'select') {
          const optionsAttr = readAttr(props, 'data-ai-options');
          if (optionsAttr.value) {
            entry.options = optionsAttr.value.split(',').map((s) => s.trim()).filter(Boolean);
          } else {
            result.warnings.push(`字段 ${field.value} 为 select 但缺少 data-ai-options`);
          }
        }
        result.fields.push(entry);
      }

      if (moduleAttr.present && moduleAttr.value) {
        const route = readAttr(props, 'data-ai-route');
        result.module = {
          name: moduleAttr.value,
          label: label.value ?? moduleAttr.value,
          route: route.value ?? `/${moduleAttr.value}`,
        };
      }
    }
    for (const c of node.children ?? []) visit(c);
  };
  visit(ast);

  return result;
}
