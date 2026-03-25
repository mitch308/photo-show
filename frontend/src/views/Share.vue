<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useShareStore } from '@/stores/share';
import MasonryGrid from '@/components/gallery/MasonryGrid.vue';
import Lightbox from '@/components/gallery/Lightbox.vue';
import type { Work } from '@/api/types';

const route = useRoute();
const store = useShareStore();

const selectedWork = ref<Work | null>(null);
const lightboxOpen = ref(false);

const token = route.params.token as string;

onMounted(() => {
  store.fetchShare(token);
});

const openLightbox = (work: Work) => {
  selectedWork.value = work;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
};

const downloadWork = async (workId: string) => {
  await store.downloadWork(workId);
};
</script>

<template>
  <div class="share-page">
    <header class="header">
      <h1>私密作品分享</h1>
      <p v-if="store.isValid" class="expires">{{ store.expiresIn }}</p>
    </header>
    
    <!-- Loading state -->
    <div v-if="store.loading" class="loading">
      加载中...
    </div>
    
    <!-- Error/Expired state -->
    <div v-else-if="store.expired || store.error" class="error-state">
      <h2>链接已过期或不存在</h2>
      <p>请联系摄影师获取新的分享链接</p>
    </div>
    
    <!-- Gallery -->
    <main v-else-if="store.isValid" class="main">
      <div class="share-info">
        <p>这是为您精选的 {{ store.works.length }} 张作品</p>
        <p class="hint">点击作品查看大图，可下载高清无水印原图</p>
      </div>
      
      <MasonryGrid
        :works="store.works"
        @select="openLightbox"
      />
    </main>
    
    <!-- Lightbox with download button -->
    <Lightbox
      v-if="selectedWork"
      :work="selectedWork"
      :works="store.works"
      :isOpen="lightboxOpen"
      @close="closeLightbox"
      @navigate="(work) => selectedWork = work"
    >
      <template #actions>
        <button class="download-btn" @click="downloadWork(selectedWork.id)">
          下载原图
        </button>
      </template>
    </Lightbox>
  </div>
</template>

<style scoped>
.share-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.header {
  padding: 20px 40px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.header h1 {
  font-size: 24px;
  color: var(--text-primary);
}

.expires {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 8px;
}

.loading, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--text-secondary);
}

.error-state h2 {
  color: var(--text-primary);
  margin-bottom: 12px;
}

.main {
  padding: 24px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.share-info {
  margin-bottom: 24px;
  text-align: center;
  color: var(--text-secondary);
}

.hint {
  font-size: 14px;
  margin-top: 8px;
}

.download-btn {
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

@media (max-width: 768px) {
  .header, .main {
    padding: 16px;
  }
}
</style>