import { scanSource } from './scanner';
import { scanVueSource } from './scan-vue';
import type { Manifest, ManifestModule } from '@ai-operable/core';
import type { PresetContribution } from './preset';
import type { ScanResult } from './types';

export interface SourceFile {
  path: string;
  code: string;
}

export interface AggregateOptions {
  /**
   * preset 自动推断出的种子（模块 / 字段 / 操作）。优先级最低——手标（data-ai-*）
   * 遇到同名模块或同 id 字段/操作时覆盖种子（见 RFC §4：自动推断是地板，手标是天花板）。
   */
  contribution?: PresetContribution;
}

/** 按文件后缀选择扫描器：.vue 走 Vue SFC 扫描，其余按 JSX/TSX 扫描。 */
function scanFile(file: SourceFile): ScanResult {
  return file.path.endsWith('.vue') ? scanVueSource(file.code) : scanSource(file.code);
}

/** id 的 `module.` 前缀即所属模块名 */
function moduleOf(id: string): string {
  const i = id.indexOf('.');
  return i === -1 ? id : id.slice(0, i);
}

function ensureModule(manifest: Manifest, name: string): ManifestModule {
  if (!manifest.modules[name]) {
    manifest.modules[name] = { label: name, route: `/${name}`, actions: [], fields: [] };
  }
  return manifest.modules[name];
}

/** 按 id 插入或覆盖：已存在同 id 则替换，否则追加。用于「手标覆盖种子」。 */
function upsert<T extends { id: string }>(list: T[], item: T): void {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) list.push(item);
  else list[i] = item;
}

/** 聚合多个源码文件的扫描结果为一份能力清单。 */
export function aggregate(files: SourceFile[], opts: AggregateOptions = {}): Manifest {
  const manifest: Manifest = { generatedAt: 'build-time', modules: {} };
  const contribution = opts.contribution ?? {};

  // 1) preset 种子（自动推断，优先级最低）
  for (const seed of contribution.modules ?? []) {
    const mod = ensureModule(manifest, seed.name);
    mod.label = seed.label ?? seed.name;
    mod.route = seed.route;
  }
  for (const a of contribution.actions ?? []) {
    upsert(ensureModule(manifest, moduleOf(a.id)).actions, a);
  }
  for (const fld of contribution.fields ?? []) {
    upsert(ensureModule(manifest, moduleOf(fld.id)).fields, fld);
  }

  // 2) data-ai-module 手标建立/覆盖模块定义（手标优先，覆盖同名种子）
  for (const f of files) {
    const r = scanFile(f);
    if (r.module) {
      const mod = ensureModule(manifest, r.module.name);
      mod.label = r.module.label;
      mod.route = r.module.route;
    }
  }

  // 3) data-ai-action / data-ai-field 手标，按 id 前缀定位模块，覆盖同 id 种子
  for (const f of files) {
    const r = scanFile(f);
    for (const a of r.actions) {
      upsert(ensureModule(manifest, moduleOf(a.id)).actions, a);
    }
    for (const fld of r.fields) {
      upsert(ensureModule(manifest, moduleOf(fld.id)).fields, fld);
    }
  }

  return manifest;
}
