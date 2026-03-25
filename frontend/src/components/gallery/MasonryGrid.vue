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
  <div class="masonry-grid">
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
</style>