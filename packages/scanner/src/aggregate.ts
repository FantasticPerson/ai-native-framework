import { scanSource } from './scanner';
import type { Manifest, ManifestModule, ModuleDef } from '@ai-native/core';

export interface SourceFile {
  path: string;
  code: string;
}

export interface AggregateOptions {
  /**
   * preset 自动推断出的模块种子（如 preset-react-router 扫路由所得）。
   * 先用种子建模块；随后 data-ai-module 手标遇到同名模块会覆盖其 label/route
   * （手标优先，见 RFC §4：自动推断是地板，手标是天花板）。
   */
  moduleSeeds?: ModuleDef[];
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

/** 聚合多个源码文件的扫描结果为一份能力清单。 */
export function aggregate(files: SourceFile[], opts: AggregateOptions = {}): Manifest {
  const manifest: Manifest = { generatedAt: 'build-time', modules: {} };

  // 先用 preset 种子建立模块（自动推断，优先级最低）
  for (const seed of opts.moduleSeeds ?? []) {
    const mod = ensureModule(manifest, seed.name);
    mod.label = seed.label ?? seed.name;
    mod.route = seed.route;
  }

  // 再用 data-ai-module 手标建立/覆盖模块定义（手标优先，覆盖同名种子）
  for (const f of files) {
    const r = scanSource(f.code);
    if (r.module) {
      const mod = ensureModule(manifest, r.module.name);
      mod.label = r.module.label;
      mod.route = r.module.route;
    }
  }

  // 再归入 actions / fields，按 id 前缀定位模块
  for (const f of files) {
    const r = scanSource(f.code);
    for (const a of r.actions) {
      const mod = ensureModule(manifest, moduleOf(a.id));
      if (!mod.actions.some((x) => x.id === a.id)) mod.actions.push(a);
    }
    for (const fld of r.fields) {
      const mod = ensureModule(manifest, moduleOf(fld.id));
      if (!mod.fields.some((x) => x.id === fld.id)) mod.fields.push(fld);
    }
  }

  return manifest;
}
