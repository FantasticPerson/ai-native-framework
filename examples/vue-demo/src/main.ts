import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import LeaveView from './modules/leave/LeaveView.vue';
import EmployeeView from './modules/employees/EmployeeView.vue';
import './index.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/leave' },
    { path: '/leave', component: LeaveView },
    { path: '/employees', component: EmployeeView },
  ],
});

createApp(App).use(router).mount('#app');
