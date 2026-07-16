import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { aggregate, type SourceFile } from './aggregate';
import type { Preset, PresetContribution } from './preset';

export interface AIScannerOptions {
  /** 扫描根目录，相对 cwd，默认 'src/modules' */
  modulesDir?: string;
  /** 输出的 manifest 路径，相对 cwd，默认 'src/ai-manifest.json' */
  output?: string;
  /** 扫描的文件扩展名，默认 ['.tsx'] */
  extensions?: string[];
  /** 自动推断预设（如 reactRouterPreset），构建时收集模块种子。见 RFC §4 第一层。 */
  presets?: Preset[];
}

function collectFiles(dir: string, extensions: string[]): SourceFile[] {
  const out: SourceFile[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(full, extensions));
    } else if (extensions.some((ext) => name.endsWith(ext))) {
      out.push({ path: full, code: readFileSync(full, 'utf-8') });
    }
  }
  return out;
}

/** 扫描指定目录下的 data-ai-* 标注，生成 manifest JSON 文件，返回模块数。 */
export function generateManifest(opts: Required<AIScannerOptions>): number {
  const files = collectFiles(resolve(process.cwd(), opts.modulesDir), opts.extensions);
  const contribution: PresetContribution = { modules: [], fields: [], actions: [] };
  for (const p of opts.presets) {
    const c = p.collect();
    if (c.modules) contribution.modules!.push(...c.modules);
    if (c.fields) contribution.fields!.push(...c.fields);
    if (c.actions) contribution.actions!.push(...c.actions);
  }
  const manifest = aggregate(files, { contribution });
  writeFileSync(resolve(process.cwd(), opts.output), JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  return Object.keys(manifest.modules).length;
}

/** Vite 插件：构建时与 dev watch 时扫描标注、生成能力清单。 */
export function aiScannerPlugin(options: AIScannerOptions = {}): Plugin {
  const opts: Required<AIScannerOptions> = {
    modulesDir: options.modulesDir ?? 'src/modules',
    output: options.output ?? 'src/ai-manifest.json',
    extensions: options.extensions ?? ['.tsx'],
    presets: options.presets ?? [],
  };
  const watchDir = resolve(process.cwd(), opts.modulesDir);

  return {
    name: 'ai-manifest-scanner',
    buildStart() {
      const n = generateManifest(opts);
      this.info?.(`[ai-scanner] 已生成 manifest（${n} 个模块）`);
    },
    configureServer(server) {
      generateManifest(opts);
      const onChange = (file: string) => {
        if (file.startsWith(watchDir) && opts.extensions.some((ext) => file.endsWith(ext))) {
          const n = generateManifest(opts);
          server.config.logger.info(`[ai-scanner] 重新生成 manifest（${n} 个模块）`);
        }
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
