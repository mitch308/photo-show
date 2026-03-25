<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<template>
  <div class="overview-page">
    <h1>概览</h1>
    <p>欢迎回来，{{ authStore.user?.username || '管理员' }}</p>
    <div class="stats">
      <div class="stat-card">
        <h3>作品数</h3>
        <p class="number">0</p>
      </div>
      <div class="stat-card">
        <h3>相册数</h3>
        <p class="number">0</p>
      </div>
      <div class="stat-card">
        <h3>总浏览量</h3>
        <p class="number">0</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-page h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
}

.overview-page > p {
  color: #666;
  margin-bottom: 30px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-card h3 {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 10px;
}

.stat-card .number {
  font-size: 32px;
  font-weight: 600;
  color: #333;
}
</style>