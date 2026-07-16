import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { JSXOpeningElement, JSXAttribute } from '@babel/types';

// @babel/traverse 的默认导出在 ESM 下需取 .default
const traverse = (_traverse as unknown as { default: typeof _traverse }).default ?? _traverse;

/** 从路由推断出的模块（未含 label——路由不编码人类可读名称，label 由 preset 的 labels 补） */
export interface RouteModule {
  /** 模块名，取 path 末段（去掉动态参数） */
  name: string;
  /** 完整路由路径 */
  route: string;
  /** element 对应的组件名，用于调试与未来按组件补 label */
  component: string;
}

/** 读取 JSX 属性的字符串字面量值 */
function readStringAttr(el: JSXOpeningElement, name: string): string | undefined {
  const attr = el.attributes.find(
    (a): a is JSXAttribute => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === name,
  );
  if (!attr || !attr.value) return undefined;
  if (attr.value.type === 'StringLiteral') return attr.value.value;
  if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type === 'StringLiteral') {
    return attr.value.expression.value;
  }
  return undefined;
}

/** 读取 element={<Comp .../>} 里的组件名 */
function readElementComponent(el: JSXOpeningElement): string | undefined {
  const attr = el.attributes.find(
    (a): a is JSXAttribute => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === 'element',
  );
  if (!attr || !attr.value || attr.value.type !== 'JSXExpressionContainer') return undefined;
  const expr = attr.value.expression;
  if (expr.type !== 'JSXElement') return undefined;
  const opening = expr.openingElement.name;
  return opening.type === 'JSXIdentifier' ? opening.name : undefined;
}

/** 从路由 path 推断模块名：取末段，跳过动态参数（:id）与通配（*），必要时回退到前一段 */
function moduleNameFromPath(route: string): string | undefined {
  const segments = route.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg.startsWith(':') || seg === '*') continue;
    return seg;
  }
  return undefined;
}

/**
 * 静态解析源码里的 react-router `<Route path element>`，推断模块清单。
 * 仅支持 JSX 式 `<Routes>/<Route>`；数据式 createBrowserRouter([...]) 暂不支持
 * （诚实的边界，后续可扩展）。跳过 <Navigate> 重定向与无组件 element 的路由。
 */
export function scanRoutes(code: string): RouteModule[] {
  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch {
    return [];
  }

  const mods: RouteModule[] = [];
  traverse(ast, {
    JSXOpeningElement(path) {
      const el = path.node;
      if (el.name.type !== 'JSXIdentifier' || el.name.name !== 'Route') return;

      const route = readStringAttr(el, 'path');
      if (!route) return;

      const component = readElementComponent(el);
      // 无组件（如 <Route path element={<Navigate .../>} /> 会得到 'Navigate'）或纯占位的跳过
      if (!component || component === 'Navigate') return;

      const name = moduleNameFromPath(route);
      if (!name) return;

      mods.push({ name, route, component });
    },
  });

  return mods;
}
