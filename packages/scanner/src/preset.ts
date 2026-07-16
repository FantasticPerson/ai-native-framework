import type { ModuleDef, ManifestField, ManifestAction } from '@ai-native/core';

/**
 * preset 在构建期产出的种子集合：自动推断得到的模块、字段、操作。
 * 字段/操作按 id 的 `module.` 前缀归属模块（与手标扫描一致）。
 * 三类都可选——preset-react-router 只产 modules，preset-antd 主要产 fields。
 */
export interface PresetContribution {
  modules?: ModuleDef[];
  fields?: ManifestField[];
  actions?: ManifestAction[];
}

/**
 * 提取预设：三层接入光谱第一层「自动推断」的载体。
 * 各栈的 preset（如 preset-react-router 扫路由、preset-antd 扫表单）实现此接口，
 * 在构建期产出种子，交给 aggregate 聚合。scanner 只认识这个接口，
 * 不认识任何具体前端框架——preset 是独立包，保证内核解耦。
 */
export interface Preset {
  /** 用于日志与调试的名称，如 'react-router'。 */
  name: string;
  /** 构建期收集种子。preset 自行读取所需源码文件。 */
  collect(): PresetContribution;
}
