import { scanSource } from './scanner';
import type { Manifest, ManifestModule } from '@ai-native/core';

export interface SourceFile {
  path: string;
  code: string;
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
export function aggregate(files: SourceFile[], generatedAt = 'build-time'): Manifest {
  const manifest: Manifest = { generatedAt, modules: {} };

  // 先建立模块定义（label / route）
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
