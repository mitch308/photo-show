<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { statsApi, type OverviewStats } from '@/api/stats';

const authStore = useAuthStore();
const stats = ref<OverviewStats | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    stats.value = await statsApi.getOverview();
  } catch (error) {
    console.error('Failed to load stats:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="overview-page">
    <h1>概览</h1>
    <p>欢迎回来，{{ authStore.user?.username || '管理员' }}</p>
    
    <div v-if="loading" class="loading">
      <span class="loading-spinner"></span>
      <span>加载中...</span>
    </div>
    
    <div v-else class="stats">
      <div class="stat-card">
        <h3>作品数</h3>
        <p class="number">{{ stats?.totalWorks || 0 }}</p>
        <p class="sub-info">
          <span class="public">公开 {{ stats?.publicWorks || 0 }}</span>
          <span class="private">私密 {{ stats?.privateWorks || 0 }}</span>
        </p>
      </div>
      <div class="stat-card">
        <h3>相册数</h3>
        <p class="number">{{ stats?.totalAlbums || 0 }}</p>
      </div>
      <div class="stat-card">
        <h3>总浏览量</h3>
        <p class="number">{{ stats?.totalViews || 0 }}</p>
      </div>
      <div class="stat-card">
        <h3>总下载量</h3>
        <p class="number">{{ stats?.totalDownloads || 0 }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-page h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.overview-page > p {
  color: var(--text-secondary);
  margin-bottom: 30px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: var(--text-secondary);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--bg-card);
  padding: 20px;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  transition: background-color 0.3s ease;
}

.stat-card h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.stat-card .number {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-card .sub-info {
  margin-top: 8px;
  font-size: 12px;
  display: flex;
  gap: 12px;
}

.stat-card .sub-info .public {
  color: var(--color-success);
}

.stat-card .sub-info .private {
  color: var(--text-secondary);
}
</style>