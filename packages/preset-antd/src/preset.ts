import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Preset, PresetContribution } from '@ai-native/scanner';
import { scanFormItems } from './scan-form';

/** 一个 antd 表单文件及其所属模块——字段 id 会加上 module 前缀 */
export interface AntdFormSource {
  /** 字段所属模块名，用作 id 前缀（如 'leave' → 'leave.days'） */
  module: string;
  /** 表单文件路径，相对 cwd */
  file: string;
}

export interface AntdPresetOptions {
  forms: AntdFormSource[];
}

/**
 * 自动推断预设：扫 antd `<Form.Item name label>` + 子控件推断字段清单（RFC §4 第一层）。
 * 字段 id = `${module}.${name}`，与手标 data-ai-field 的 id 规则一致，可被同 id 手标覆盖。
 */
export function antdPreset(options: AntdPresetOptions): Preset {
  return {
    name: 'antd',
    collect(): PresetContribution {
      const fields: NonNullable<PresetContribution['fields']> = [];
      for (const form of options.forms) {
        let code: string;
        try {
          code = readFileSync(resolve(process.cwd(), form.file), 'utf-8');
        } catch {
          continue;
        }
        for (const f of scanFormItems(code)) {
          fields.push({
            id: `${form.module}.${f.name}`,
            label: f.label,
            type: f.type,
            ...(f.options ? { options: f.options } : {}),
          });
        }
      }
      return { fields };
    },
  };
}
