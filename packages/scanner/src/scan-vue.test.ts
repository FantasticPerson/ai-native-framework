import { describe, it, expect } from 'vitest';
import { scanVueSource } from './scan-vue';

const wrap = (tmpl: string) => `<template>\n${tmpl}\n</template>\n<script setup>\nconst x = 1;\n</script>\n`;

describe('scanVueSource', () => {
  it('提取 data-ai-action', () => {
    const r = scanVueSource(wrap(`<button data-ai-action="leave.create" data-ai-label="新增">新增</button>`));
    expect(r.actions).toEqual([{ id: 'leave.create', label: '新增' }]);
  });

  it('data-ai-confirm 标注危险操作', () => {
    const r = scanVueSource(wrap(`<button data-ai-action="emp.delete" data-ai-label="删除" data-ai-confirm>删除</button>`));
    expect(r.actions[0]).toEqual({ id: 'emp.delete', label: '删除', confirm: true });
  });

  it('无 data-ai-confirm 的操作不带 confirm 字段', () => {
    const r = scanVueSource(wrap(`<button data-ai-action="leave.create" data-ai-label="新增" />`));
    expect(r.actions[0].confirm).toBeUndefined();
  });

  it('提取 data-ai-field（number）', () => {
    const r = scanVueSource(wrap(`<input data-ai-field="leave.days" data-ai-label="天数" data-ai-type="number" />`));
    expect(r.fields).toEqual([{ id: 'leave.days', label: '天数', type: 'number' }]);
  });

  it('缺 data-ai-type 时字段默认 text', () => {
    const r = scanVueSource(wrap(`<input data-ai-field="emp.name" data-ai-label="姓名" />`));
    expect(r.fields[0].type).toBe('text');
  });

  it('提取 select 及 data-ai-options', () => {
    const r = scanVueSource(
      wrap(`<select data-ai-field="leave.type" data-ai-label="类型" data-ai-type="select" data-ai-options="事假,病假,年假" />`),
    );
    expect(r.fields[0]).toEqual({ id: 'leave.type', label: '类型', type: 'select', options: ['事假', '病假', '年假'] });
  });

  it('select 缺 options 时告警', () => {
    const r = scanVueSource(wrap(`<select data-ai-field="leave.type" data-ai-label="类型" data-ai-type="select" />`));
    expect(r.warnings.some((w) => w.includes('leave.type'))).toBe(true);
  });

  it('提取 data-ai-module', () => {
    const r = scanVueSource(
      wrap(`<div data-ai-module="leave" data-ai-label="请假管理" data-ai-route="/leave" />`),
    );
    expect(r.module).toEqual({ name: 'leave', label: '请假管理', route: '/leave' });
  });

  it('module 缺 route 时按名兜底', () => {
    const r = scanVueSource(wrap(`<div data-ai-module="leave" data-ai-label="请假" />`));
    expect(r.module?.route).toBe('/leave');
  });

  it('缺 label 时用 id 兜底', () => {
    const r = scanVueSource(wrap(`<button data-ai-action="leave.create" />`));
    expect(r.actions[0].label).toBe('leave.create');
  });

  it('动态绑定（:data-ai-action / v-bind）不是字面量，告警且不采集', () => {
    const r = scanVueSource(wrap(`<button :data-ai-action="id" data-ai-label="动态" />`));
    expect(r.actions).toHaveLength(0);
    expect(r.warnings.some((w) => w.includes('data-ai-action'))).toBe(true);
  });

  it('无 template 时返回空结果不报错', () => {
    const r = scanVueSource(`<script setup>const x = 1;</script>`);
    expect(r.actions).toEqual([]);
    expect(r.fields).toEqual([]);
  });

  it('解析失败时给出 warning', () => {
    const r = scanVueSource(`<template><div <<< /></template>`);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
