<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();

function handleLogout() {
  authStore.clearUser();
  ElMessage.success('已退出登录');
  router.push('/login');
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">
        <h2>摄影工作室</h2>
      </div>
      <nav class="nav">
        <router-link to="/admin" class="nav-item">概览</router-link>
        <router-link to="/admin/works" class="nav-item">作品管理</router-link>
        <router-link to="/admin/albums" class="nav-item">相册管理</router-link>
        <router-link to="/admin/tags" class="nav-item">标签管理</router-link>
      </nav>
      <div class="logout">
        <button @click="handleLogout">退出登录</button>
      </div>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #304156;
  color: white;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  font-size: 18px;
  font-weight: 600;
}

.nav {
  flex: 1;
  padding: 20px 0;
}

.nav-item {
  display: block;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.logout {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout button {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.main {
  flex: 1;
  background: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}
</style>