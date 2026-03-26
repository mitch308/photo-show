<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { publicApi } from '@/api/public';
import type { Work, MediaItem } from '@/api/types';

const route = useRoute();
const router = useRouter();

// Reactive state
const work = ref<Work | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Get work ID from route params
const workId = computed(() => route.params.id as string);

// Computed mediaItems array
const mediaItems = computed<MediaItem[]>(() => {
  if (!work.value) return [];
  // Use mediaItems if available, else fallback to single file
  if (work.value.mediaItems && work.value.mediaItems.length > 0) {
    return work.value.mediaItems;
  }
  // Fallback for legacy works without mediaItems
  return [{
    id: work.value.id,
    workId: work.value.id,
    filePath: work.value.filePath,
    thumbnailSmall: work.value.thumbnailSmall,
    thumbnailLarge: work.value.thumbnailLarge,
    originalFilename: work.value.originalFilename,
    fileType: work.value.fileType,
    mimeType: work.value.mimeType,
    fileSize: work.value.fileSize,
    position: 0,
    createdAt: work.value.createdAt,
    updatedAt: work.value.updatedAt,
  }];
});

// Compute total file size
const totalFileSize = computed(() => {
  return mediaItems.value.reduce((sum, item) => sum + item.fileSize, 0);
});

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Format date helper
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Go back function
const goBack = () => {
  router.push('/');
};

// Load work data on mount
onMounted(async () => {
  const id = workId.value;
  if (!id) {
    error.value = '作品ID无效';
    loading.value = false;
    return;
  }

  try {
    work.value = await publicApi.getWork(id);
    // Record view to increment view count
    await publicApi.recordView(id);
  } catch (err) {
    console.error('Failed to load work:', err);
    error.value = '作品不存在或已被删除';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="work-detail-page">
    <!-- Header -->
    <header class="header">
      <div class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
        <span>返回</span>
      </div>
      <h1 v-if="work" class="header-title">{{ work.title }}</h1>
    </header>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      加载中...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <h2>{{ error }}</h2>
      <button class="back-button" @click="goBack">返回首页</button>
    </div>

    <!-- Main content -->
    <main v-else-if="work" class="main">
      <!-- Work info section -->
      <div class="work-info">
        <h2 class="work-title">{{ work.title }}</h2>
        <p v-if="work.description" class="work-description">{{ work.description }}</p>
        
        <!-- Meta info -->
        <div class="work-meta">
          <span class="meta-item">{{ mediaItems.length }} 个文件</span>
          <span class="meta-item">{{ formatFileSize(totalFileSize) }}</span>
          <span class="meta-item">{{ formatDate(work.createdAt) }}</span>
        </div>

        <!-- Tags -->
        <div v-if="work.tags && work.tags.length > 0" class="tags">
          <span v-for="tag in work.tags" :key="tag.id" class="tag">
            {{ tag.name }}
          </span>
        </div>
      </div>

      <!-- Media grid -->
      <div class="media-grid">
        <div
          v-for="(item, index) in mediaItems"
          :key="item.id"
          class="media-item"
          @click="console.log('Open lightbox for item:', index)"
        >
          <img
            :src="`/${item.thumbnailLarge || item.thumbnailSmall || item.filePath}`"
            :alt="item.originalFilename"
            loading="lazy"
          />
          <!-- Video overlay -->
          <div v-if="item.fileType === 'video'" class="video-overlay">
            <span class="video-icon">▶</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.work-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 40px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-primary);
  transition: opacity 0.2s;
}

.back-btn:hover {
  opacity: 0.7;
}

.back-icon {
  font-size: 18px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--text-secondary);
}

.error-state h2 {
  color: var(--text-primary);
  margin-bottom: 20px;
}

.back-button {
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.main {
  flex: 1;
  padding: 24px 40px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.work-info {
  margin-bottom: 32px;
}

.work-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
}

.work-description {
  margin-top: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.work-meta {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.meta-item {
  padding: 4px 12px;
  background: var(--bg-card);
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-secondary);
}

.tags {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 12px;
  background: var(--color-primary-light, rgba(64, 158, 255, 0.1));
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-primary, #409eff);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1024px) {
  .media-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .header {
    padding: 16px 20px;
  }

  .main {
    padding: 16px;
  }

  .media-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .work-title {
    font-size: 22px;
  }
}

.media-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: var(--bg-card);
}

.media-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s, transform 0.3s;
}

.media-item:hover img {
  transform: scale(1.02);
}

.video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s;
}

.media-item:hover .video-overlay {
  opacity: 1;
}

.video-icon {
  font-size: 48px;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>