<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { shareApi } from '@/api/share';
import MasonryGrid from '@/components/gallery/MasonryGrid.vue';
import Lightbox from '@/components/gallery/Lightbox.vue';
import type { Work, AlbumShareData } from '@/api/types';

const route = useRoute();
const token = route.params.token as string;

const shareData = ref<AlbumShareData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const expired = ref(false);

const selectedWork = ref<Work | null>(null);
const lightboxOpen = ref(false);

onMounted(async () => {
  await fetchAlbumShare();
});

const fetchAlbumShare = async () => {
  loading.value = true;
  error.value = null;
  expired.value = false;
  
  try {
    const data = await shareApi.getAlbumShare(token);
    shareData.value = data;
    
    // Check if expired
    if (data.expiresAt < Date.now()) {
      expired.value = true;
    }
  } catch (e: any) {
    if (e.response?.status === 404) {
      expired.value = true;
      error.value = '链接已过期或不存在';
    } else {
      error.value = e.message || '加载失败';
    }
  } finally {
    loading.value = false;
  }
};

const openLightbox = (work: Work) => {
  selectedWork.value = work;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
};

const isValid = computed(() => shareData.value !== null && !expired.value);

const expiresIn = computed(() => {
  if (!shareData.value) return null;
  const diff = shareData.value.expiresAt - Date.now();
  if (diff <= 0) return '已过期';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}天后过期`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}小时后过期`;
  return '即将过期';
});

const works = computed(() => shareData.value?.works || []);

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

// Handle download with error handling
const handleDownload = async (workId: string, mediaId?: string) => {
  // Check if link is expired
  if (expired.value) {
    ElMessage.error('链接已过期，无法下载');
    return;
  }

  // Check if has valid data
  if (!isValid.value) {
    ElMessage.error('链接无效，无法下载');
    return;
  }

  // Show download starting message
  ElMessage.info('开始下载...');

  // Get download URL and navigate
  const url = shareApi.getAlbumDownloadUrl(token, workId, mediaId);
  window.location.href = url;
};

// Download single file (first media item)
const downloadWork = async (workId: string) => {
  await handleDownload(workId);
};

// Download specific media item
const downloadMediaItem = async (workId: string, mediaId: string) => {
  await handleDownload(workId, mediaId);
};
</script>

<template>
  <div class="album-share-page">
    <header class="header">
      <h1>{{ shareData?.album?.name || '相册分享' }}</h1>
      <p v-if="shareData?.album?.description" class="album-description">
        {{ shareData.album.description }}
      </p>
      <p v-if="isValid" class="expires">{{ expiresIn }}</p>
    </header>
    
    <!-- Loading state -->
    <div v-if="loading" class="loading">
      加载中...
    </div>
    
    <!-- Error/Expired state -->
    <div v-else-if="expired || error" class="error-state">
      <h2>链接已过期或不存在</h2>
      <p>请联系摄影师获取新的分享链接</p>
    </div>
    
    <!-- Gallery -->
    <main v-else-if="isValid" class="main">
      <div class="share-info">
        <p>这是为您精选的 {{ works.length }} 张作品</p>
        <p class="hint">点击作品查看大图，可下载高清无水印原图</p>
      </div>
      
      <MasonryGrid
        :works="works"
        @select="openLightbox"
      />
    </main>
    
    <!-- Lightbox with download button -->
    <Lightbox
      v-if="selectedWork"
      :work="selectedWork"
      :works="works"
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
.album-share-page {
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
  margin-bottom: 8px;
}

.album-description {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
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