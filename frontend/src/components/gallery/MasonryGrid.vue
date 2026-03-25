<script setup lang="ts">
import type { Work } from '@/api/types';
import WorkCard from './WorkCard.vue';

defineProps<{
  works: Work[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', work: Work): void;
}>();
</script>

<template>
  <!-- Empty state -->
  <div v-if="!loading && works.length === 0" class="empty-state">
    <div class="empty-icon">📷</div>
    <h3>暂无作品</h3>
    <p>还没有公开的作品，请稍后再来查看</p>
  </div>
  
  <!-- Grid -->
  <div v-else class="masonry-grid">
    <div
      v-for="work in works"
      :key="work.id"
      class="masonry-item"
      @click="emit('select', work)"
    >
      <WorkCard :work="work" />
    </div>
  </div>
  <div class="loading-indicator" v-if="loading">
    <span>加载中...</span>
  </div>
</template>

<style scoped>
.masonry-grid {
  column-count: 4;
  column-gap: 16px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.masonry-item:hover {
  transform: scale(1.02);
}

@media (max-width: 640px) {
  .masonry-grid {
    column-count: 1;
  }
}

@media (min-width: 641px) and (max-width: 900px) {
  .masonry-grid {
    column-count: 2;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  .masonry-grid {
    column-count: 3;
  }
}

@media (min-width: 1201px) {
  .masonry-grid {
    column-count: 4;
  }
}

@media (min-width: 1600px) {
  .masonry-grid {
    column-count: 5;
  }
}

.loading-indicator {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 14px;
}
</style>