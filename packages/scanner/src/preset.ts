import type { ModuleDef } from '@ai-native/core';

/**
 * 提取预设：三层接入光谱第一层「自动推断」的载体。
 * 各栈的 preset（如 preset-react-router 扫路由、preset-antd 扫表单）实现此接口，
 * 在构建期产出模块种子，交给 aggregate 聚合。scanner 只认识这个接口，
 * 不认识任何具体前端框架——preset 是独立包，保证内核解耦。
 */
export interface Preset {
  /** 用于日志与调试的名称，如 'react-router'。 */
  name: string;
  /** 构建期收集模块种子。preset 自行读取所需源码文件。 */
  collect(): ModuleDef[];
}
