<script setup lang="ts">
import { ref } from 'vue';

const name = ref('');
const dept = ref('');
const position = ref('');
const added = ref('');

function add() {
  added.value = `已新增：${name.value} / ${dept.value || '（未选）'} / ${position.value}`;
}
</script>

<template>
  <div data-ai-module="employees" data-ai-label="员工管理" data-ai-route="/employees" class="card">
    <h2>新增员工</h2>

    <label class="field-row">
      <span>姓名</span>
      <input v-model="name" type="text" data-ai-field="employees.name" data-ai-label="姓名" data-ai-type="text" />
    </label>

    <label class="field-row">
      <span>部门</span>
      <select
        v-model="dept"
        data-ai-field="employees.dept"
        data-ai-label="部门"
        data-ai-type="select"
        data-ai-options="技术部,产品部,市场部,行政部"
      >
        <option value="">请选择</option>
        <option value="技术部">技术部</option>
        <option value="产品部">产品部</option>
        <option value="市场部">市场部</option>
        <option value="行政部">行政部</option>
      </select>
    </label>

    <label class="field-row">
      <span>职位</span>
      <input
        v-model="position"
        type="text"
        data-ai-field="employees.position"
        data-ai-label="职位"
        data-ai-type="text"
      />
    </label>

    <button data-ai-action="employees.add" data-ai-label="新增员工" class="btn btn-primary" @click="add">
      新增员工
    </button>

    <p v-if="added" class="result">{{ added }}</p>
  </div>
</template>
