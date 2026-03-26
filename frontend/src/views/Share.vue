<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useShareStore } from '@/stores/share';
import MasonryGrid from '@/components/gallery/MasonryGrid.vue';
import Lightbox from '@/components/gallery/Lightbox.vue';
import type { Work, MediaItem } from '@/api/types';

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

// Check if work has multiple media items
const hasMultipleMedia = computed(() => {
  if (!selectedWork.value) return false;
  return (selectedWork.value.mediaItems?.length ?? 0) > 1;
});

// Get media items for download list
const mediaItems = computed(() => {
  return selectedWork.value?.mediaItems ?? [];
});

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Download single file (first media item)
const downloadWork = async (workId: string) => {
  await store.downloadWork(workId);
};

// Download specific media item
const downloadMediaItem = async (workId: string, mediaId: string) => {
  await store.downloadWork(workId, mediaId);
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
        <!-- Single file: simple download button -->
        <button 
          v-if="!hasMultipleMedia"
          class="download-btn" 
          @click="downloadWork(selectedWork.id)"
        >
          下载原图
        </button>
        
        <!-- Multiple files: download list -->
        <div v-else class="download-list">
          <div class="download-label">选择下载：</div>
          <div class="download-items">
            <button
              v-for="(item, index) in mediaItems"
              :key="item.id"
              class="download-item-btn"
              @click="downloadMediaItem(selectedWork.id, item.id)"
            >
              <span class="item-index">{{ index + 1 }}</span>
              <span class="item-name">{{ item.originalFilename }}</span>
              <span class="item-size">{{ formatFileSize(item.fileSize) }}</span>
            </button>
          </div>
        </div>
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

.download-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 300px;
}

.download-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.download-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.download-item-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}

.download-item-btn:hover {
  background: var(--bg-hover);
}

.item-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--text-primary);
}

.item-size {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .header, .main {
    padding: 16px;
  }
}
</style>