<script setup lang="ts">
import { AIBar as FrameworkAIBar, useAIAgent } from '@ai-native/vue';
import { createHttpProvider, type Manifest } from '@ai-native/core';
import manifestJson from '../ai-manifest.json';

const manifest = manifestJson as Manifest;
const provider = createHttpProvider({ endpoint: '/api/chat' });

// demo 的 AIBar：组合框架的 useAIAgent + AIBar，注入本应用的 manifest、provider、示例。
// 与 React demo 对称——只是换成 Vue 惯用法，core 用的是同一个 runAgent。
const agent = useAIAgent({ manifest, provider });

const examples = [
  '帮我提个明天的事假，一天，事由家里有事',
  '新增员工赵敏，部门技术部，职位后端工程师',
  '切到员工管理',
];
</script>

<template>
  <FrameworkAIBar
    :agent="agent"
    :examples="examples"
    placeholder="说一句话，让 AI 帮你操作，例如「帮我提个明天的事假」"
  />
</template>
