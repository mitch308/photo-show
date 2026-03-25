import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/admin/Login.vue'),
    meta: { title: '登录', guest: true },
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, title: '管理后台' },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/admin/Overview.vue'),
        meta: { title: '概览' },
      },
      {
        path: 'works',
        name: 'Works',
        component: () => import('@/views/admin/Works.vue'),
        meta: { title: '作品管理' },
      },
      {
        path: 'albums',
        name: 'Albums',
        component: () => import('@/views/admin/Albums.vue'),
        meta: { title: '相册管理' },
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import('@/views/admin/Tags.vue'),
        meta: { title: '标签管理' },
      },
      {
        path: 'shares',
        name: 'Shares',
        component: () => import('@/views/admin/Shares.vue'),
        meta: { title: '分享管理' },
      },
      {
        path: 'clients',
        name: 'Clients',
        component: () => import('@/views/admin/Clients.vue'),
        meta: { title: '客户管理' },
      },
    ],
  },
  {
    path: '/share/:token',
    name: 'Share',
    component: () => import('@/views/Share.vue'),
    meta: { title: '私密分享' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '摄影工作室'} - 作品展示平台`;

  const authStore = useAuthStore();

  // 需要认证的路由
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }
  }

  // 已登录用户不能访问登录页
  if (to.meta.guest) {
    if (authStore.isAuthenticated) {
      next({ name: 'Dashboard' });
      return;
    }
  }

  next();
});

export default router;