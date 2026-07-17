import type { ManifestAction, ManifestField } from '@ai-operable/core';

/** 单文件扫描结果 */
export interface ScanResult {
  module?: { name: string; label: string; route: string };
  actions: ManifestAction[];
  fields: ManifestField[];
  warnings: string[];
}
