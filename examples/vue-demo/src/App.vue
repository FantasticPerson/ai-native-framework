<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import AIBar from './ai/AIBar.vue';
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>AI-Native Vue Demo</h1>
      <nav class="app-nav">
        <RouterLink to="/leave" class="nav-link">请假管理</RouterLink>
        <RouterLink to="/employees" class="nav-link">员工管理</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
    <AIBar />
  </div>
</template>
