<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Phone, Message, Location } from '@element-plus/icons-vue';
import { settingsApi } from '@/api/settings';
import type { StudioInfo } from '@/types/settings';

const studioInfo = ref<StudioInfo>({
  name: '',
  phone: '',
  email: '',
  address: '',
  description: ''
});
const loading = ref(true);

onMounted(async () => {
  try {
    const info = await settingsApi.getStudioInfo();
    studioInfo.value = info;
  } catch (error) {
    console.error('Failed to load studio info:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="about-page" v-loading="loading">
    <header class="header">
      <h1>{{ studioInfo.name || '摄影工作室' }}</h1>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/login">管理登录</router-link>
      </nav>
    </header>
    
    <main class="main" v-if="!loading">
      <div class="studio-header">
        <img 
          v-if="studioInfo.logo" 
          :src="studioInfo.logo" 
          :alt="studioInfo.name"
          class="logo"
        />
        <h1 class="title">{{ studioInfo.name }}</h1>
      </div>
      
      <div class="contact-info" v-if="studioInfo.phone || studioInfo.email || studioInfo.address">
        <div v-if="studioInfo.phone" class="contact-item">
          <el-icon :size="20"><Phone /></el-icon>
          <span>{{ studioInfo.phone }}</span>
        </div>
        <div v-if="studioInfo.email" class="contact-item">
          <el-icon :size="20"><Message /></el-icon>
          <a :href="`mailto:${studioInfo.email}`">{{ studioInfo.email }}</a>
        </div>
        <div v-if="studioInfo.address" class="contact-item">
          <el-icon :size="20"><Location /></el-icon>
          <span>{{ studioInfo.address }}</span>
        </div>
      </div>
      
      <div 
        v-if="studioInfo.description" 
        class="description"
        v-html="studioInfo.description"
      ></div>
      
      <div v-if="!studioInfo.name && !studioInfo.description" class="empty-state">
        <p>暂无工作室介绍信息</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.about-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #f5f5f5);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin: 0;
}

.header nav {
  display: flex;
  gap: 16px;
}

.header nav a {
  padding: 8px 16px;
  background: var(--color-primary, #409eff);
  color: white;
  border-radius: 4px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.header nav a:hover {
  opacity: 0.8;
}

.main {
  flex: 1;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.studio-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
}

.logo {
  max-width: 200px;
  max-height: 100px;
  object-fit: contain;
  margin-bottom: 16px;
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin: 0;
}

.contact-info {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  margin-bottom: 40px;
  padding: 20px;
  background: var(--bg-card, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #666);
}

.contact-item a {
  color: var(--color-primary, #409eff);
  text-decoration: none;
}

.contact-item a:hover {
  text-decoration: underline;
}

.description {
  padding: 24px;
  background: var(--bg-card, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  line-height: 1.8;
  color: var(--text-primary, #333);
}

.description :deep(h1) {
  font-size: 24px;
  margin: 0 0 16px 0;
}

.description :deep(h2) {
  font-size: 20px;
  margin: 16px 0 12px 0;
}

.description :deep(h3) {
  font-size: 16px;
  margin: 12px 0 8px 0;
}

.description :deep(p) {
  margin: 0 0 12px 0;
}

.description :deep(ul), .description :deep(ol) {
  padding-left: 24px;
  margin: 0 0 12px 0;
}

.description :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 12px 0;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary, #999);
}

@media (max-width: 768px) {
  .header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 12px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .main {
    padding: 20px 16px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .contact-info {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }
}
</style>