<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
import { useTheme } from '@/composables/useTheme';
import { logout } from '@/api/auth';

const router = useRouter();
const authStore = useAuthStore();
const { isDark, toggleDark } = useTheme();

async function handleLogout() {
  try {
    await logout();
  } catch {
    // Ignore logout API errors
  }
  authStore.clearUser();
  ElMessage.success('已退出登录');
  router.push('/login');
}

function handleThemeToggle() {
  toggleDark();
  ElMessage.success(isDark.value ? '已切换到浅色模式' : '已切换到深色模式');
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
        <router-link to="/admin/shares" class="nav-item">分享管理</router-link>
        <router-link to="/admin/clients" class="nav-item">客户管理</router-link>
        <router-link to="/admin/settings" class="nav-item">系统设置</router-link>
      </nav>
      <div class="sidebar-footer">
        <a href="/" target="_blank" class="gallery-link" title="在新窗口打开前台画廊">
          <span class="icon-gallery">🖼️</span>
        </a>
        <button class="theme-toggle" @click="handleThemeToggle" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
          <span v-if="isDark" class="icon-sun">☀️</span>
          <span v-else class="icon-moon">🌙</span>
        </button>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
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
  background: var(--sidebar-bg);
  color: var(--sidebar-text-active);
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
}

.logo {
  padding: 20px;
  border-bottom: 1px solid var(--sidebar-hover-bg);
}

.logo h2 {
  font-size: 18px;
  font-weight: 600;
}

.nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
  min-height: 0;
}

.nav-item {
  display: block;
  padding: 12px 20px;
  color: var(--sidebar-text);
  transition: all 0.2s;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: var(--sidebar-text-active);
  background: var(--sidebar-hover-bg);
}

.sidebar-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--sidebar-hover-bg);
  display: flex;
  gap: 10px;
}

.gallery-link {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--sidebar-hover-bg);
  color: var(--sidebar-text);
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.gallery-link:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-text-active);
}

.theme-toggle {
  width: 40px;
  height: 40px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--sidebar-hover-bg);
  color: var(--sidebar-text);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.theme-toggle:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-text-active);
}

.logout-btn {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--sidebar-hover-bg);
  color: var(--sidebar-text);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-text-active);
}

.main {
  flex: 1;
  background: var(--bg-page);
  padding: 20px;
  overflow-y: auto;
  transition: background-color 0.3s ease;
}
</style>