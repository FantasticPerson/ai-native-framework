<script setup lang="ts">
import { ref, computed } from 'vue';
import { useData } from 'vitepress';

const { lang } = useData();
const isEn = computed(() => lang.value.startsWith('en'));

// 预置能力清单（静态，不接真实 LLM，避免 key 与红线）
// label 随语言切换，结构与 id 不变
const manifest = computed(() => ({
  modules: {
    leave: {
      label: isEn.value ? 'Leave' : '请假管理',
      route: '/leave',
      actions: [{ id: 'leave.submit', label: isEn.value ? 'Submit' : '提交申请' }],
      fields: [
        {
          id: 'leave.type',
          label: isEn.value ? 'Leave type' : '请假类型',
          type: 'select',
          options: isEn.value
            ? ['Personal', 'Sick', 'Annual', 'Comp']
            : ['事假', '病假', '年假', '调休'],
        },
        { id: 'leave.days', label: isEn.value ? 'Days' : '天数', type: 'number' },
        { id: 'leave.reason', label: isEn.value ? 'Reason' : '事由', type: 'text' },
      ],
    },
    employees: {
      label: isEn.value ? 'Employees' : '员工管理',
      route: '/employees',
      actions: [{ id: 'employees.add', label: isEn.value ? 'Add employee' : '新增员工' }],
      fields: [
        { id: 'employees.name', label: isEn.value ? 'Name' : '姓名', type: 'text' },
        {
          id: 'employees.dept',
          label: isEn.value ? 'Department' : '部门',
          type: 'select',
          options: isEn.value ? ['Engineering', 'Product', 'Marketing'] : ['技术部', '产品部', '市场部'],
        },
      ],
    },
  },
}));

// mock provider：按关键词匹配预置计划，模拟 LLM 产出的操作序列
// 真实场景由 LLM 在 manifest 白名单里编排；这里是静态演示。
const CASES = computed<Array<{ match: RegExp; plan: any }>>(() => [
  {
    match: isEn.value ? /leave|sick|annual|day off/i : /请假|事假|病假|年假/,
    plan: {
      narration: isEn.value
        ? 'Switching to the leave page and filling in the request'
        : '帮你切到请假页并填写请假申请',
      steps: [
        { type: 'navigate', module: 'leave' },
        { type: 'fill', target: 'leave.type', value: isEn.value ? 'Personal' : '事假' },
        { type: 'fill', target: 'leave.days', value: '1' },
        { type: 'fill', target: 'leave.reason', value: isEn.value ? 'Family matter' : '家里有事' },
        { type: 'click', target: 'leave.submit' },
      ],
    },
  },
  {
    match: isEn.value ? /employee|onboard|new hire|add.*person/i : /员工|新增.*人|入职/,
    plan: {
      narration: isEn.value
        ? 'Switching to employee management and adding an employee'
        : '帮你切到员工管理并新增员工',
      steps: [
        { type: 'navigate', module: 'employees' },
        { type: 'fill', target: 'employees.name', value: isEn.value ? 'Alice' : '赵敏' },
        { type: 'fill', target: 'employees.dept', value: isEn.value ? 'Engineering' : '技术部' },
        { type: 'click', target: 'employees.add' },
      ],
    },
  },
]);

const t = computed(() =>
  isEn.value
    ? {
        examples: ['Submit a personal leave for tomorrow, 1 day, family matter', 'Add employee Alice, Engineering'],
        placeholder: 'Say something…',
        colPlan: '① Operation plan produced by the LLM',
        colManifest: '② Matched capabilities (whitelist)',
        noMatch: '(No matching preset demo — try an example on the left)',
        actionLabel: 'action',
        fieldLabel: 'field',
      }
    : {
        examples: ['帮我提个明天的事假，一天，事由家里有事', '新增员工赵敏，技术部'],
        placeholder: '说一句话…',
        colPlan: '① LLM 产出的操作计划',
        colManifest: '② 命中的能力清单（白名单）',
        noMatch: '（无匹配的预置演示，试试左侧示例）',
        actionLabel: 'action',
        fieldLabel: 'field',
      }
);

const examples = computed(() => t.value.examples);
const input = ref('');
// 语言切换后若输入框为空或仍是另一语言的默认示例，重置为当前语言首个示例
const effectiveInput = computed(() => (input.value.trim() ? input.value : examples.value[0]));

const plan = computed(() => {
  const hit = CASES.value.find((c) => c.match.test(effectiveInput.value));
  return hit ? hit.plan : { narration: t.value.noMatch, steps: [] };
});

// 被计划命中的能力 id 集合，用于高亮 manifest
const touched = computed(() => {
  const s = new Set<string>();
  for (const step of plan.value.steps) {
    if (step.type === 'navigate') s.add(step.module);
    if (step.target) s.add(step.target);
  }
  return s;
});
</script>

<template>
  <div class="pg">
    <div class="pg-input">
      <div class="pg-examples">
        <button v-for="ex in examples" :key="ex" class="pg-chip" @click="input = ex">{{ ex }}</button>
      </div>
      <input v-model="input" class="pg-field" :placeholder="t.placeholder" />
    </div>

    <div class="pg-cols">
      <div class="pg-col">
        <h4>{{ t.colPlan }}</h4>
        <p class="pg-narration">{{ plan.narration }}</p>
        <ol class="pg-steps">
          <li v-for="(s, i) in plan.steps" :key="i">
            <code v-if="s.type === 'navigate'">navigate → {{ s.module }}</code>
            <code v-else-if="s.type === 'click'">click → {{ s.target }}</code>
            <code v-else-if="s.type === 'fill'">fill → {{ s.target }} = "{{ s.value }}"</code>
          </li>
        </ol>
      </div>

      <div class="pg-col">
        <h4>{{ t.colManifest }}</h4>
        <div v-for="(mod, key) in manifest.modules" :key="key" class="pg-mod" :class="{ hit: touched.has(key) }">
          <div class="pg-mod-name">{{ key }} · {{ mod.label }}</div>
          <div v-for="a in mod.actions" :key="a.id" class="pg-cap" :class="{ hit: touched.has(a.id) }">
            {{ t.actionLabel }}: {{ a.id }}
          </div>
          <div v-for="f in mod.fields" :key="f.id" class="pg-cap" :class="{ hit: touched.has(f.id) }">
            {{ t.fieldLabel }}: {{ f.id }} ({{ f.type }})
          </div>
        </div>
      </div>
    </div>

    <p class="pg-note" v-if="isEn">
      This is a static demo: preset manifest + mock provider, <strong>no real LLM</strong>. In
      production the LLM orchestrates within the manifest whitelist, and any target outside the list
      is rejected by <code>parsePlan</code>.
    </p>
    <p class="pg-note" v-else>
      这是静态演示：用预置 manifest + mock provider，<strong>不接真实 LLM</strong>。真实场景由 LLM
      在 manifest 白名单里编排操作，清单外的目标会被 <code>parsePlan</code> 拒绝。
    </p>
  </div>
</template>

<style scoped>
.pg {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 16px;
  margin: 16px 0;
}
.pg-examples {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.pg-chip {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}
.pg-chip:hover {
  border-color: var(--vp-c-brand-1);
}
.pg-field {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.pg-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}
@media (max-width: 640px) {
  .pg-cols {
    grid-template-columns: 1fr;
  }
}
.pg-col h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.pg-narration {
  font-size: 13px;
  margin: 0 0 8px;
}
.pg-steps {
  margin: 0;
  padding-left: 20px;
}
.pg-steps li {
  margin: 4px 0;
}
.pg-steps code {
  font-size: 12px;
}
.pg-mod {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
  opacity: 0.55;
}
.pg-mod.hit {
  opacity: 1;
  border-color: var(--vp-c-brand-1);
}
.pg-mod-name {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}
.pg-cap {
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
  padding: 2px 0;
}
.pg-cap.hit {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.pg-note {
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin: 16px 0 0;
}
</style>
