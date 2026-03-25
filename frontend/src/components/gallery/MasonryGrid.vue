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

// Calculate row span for each work based on aspect ratio
// This is a simplified approach - actual implementation may need image load detection
const getRowSpan = (_work: Work) => {
  // Default row span, will be adjusted on image load
  return 20; // Approximate for landscape images
};
</script>

<template>
  <div class="masonry-grid">
    <div
      v-for="work in works"
      :key="work.id"
      class="masonry-item"
      :style="{ '--row-span': getRowSpan(work) }"
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-auto-rows: 10px;
  gap: 16px;
}

.masonry-item {
  grid-row-end: span var(--row-span, 20);
  cursor: pointer;
  transition: transform 0.2s;
}

.masonry-item:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .masonry-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .masonry-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.loading-indicator {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}
</style>