<script setup lang="ts">
import { ref } from 'vue';

const type = ref('');
const days = ref('');
const reason = ref('');
const submitted = ref('');

function submit() {
  submitted.value = `已提交：${type.value || '（未选）'} / ${days.value || 0} 天 / ${reason.value}`;
}
</script>

<template>
  <!-- data-ai-module 声明模块，scanner 扫 .vue 的 template 得到能力清单 -->
  <div data-ai-module="leave" data-ai-label="请假管理" data-ai-route="/leave" class="card">
    <h2>请假申请</h2>

    <label class="field-row">
      <span>请假类型</span>
      <!-- 原生 select + v-model：vueSetFieldValue 直接写 value 派发 input 即可 -->
      <select
        v-model="type"
        data-ai-field="leave.type"
        data-ai-label="请假类型"
        data-ai-type="select"
        data-ai-options="事假,病假,年假,调休"
      >
        <option value="">请选择</option>
        <option value="事假">事假</option>
        <option value="病假">病假</option>
        <option value="年假">年假</option>
        <option value="调休">调休</option>
      </select>
    </label>

    <label class="field-row">
      <span>天数</span>
      <input v-model="days" type="number" data-ai-field="leave.days" data-ai-label="天数" data-ai-type="number" />
    </label>

    <label class="field-row">
      <span>事由</span>
      <input v-model="reason" type="text" data-ai-field="leave.reason" data-ai-label="事由" data-ai-type="text" />
    </label>

    <button data-ai-action="leave.submit" data-ai-label="提交申请" class="btn btn-primary" @click="submit">
      提交申请
    </button>

    <p v-if="submitted" class="result">{{ submitted }}</p>
  </div>
</template>
