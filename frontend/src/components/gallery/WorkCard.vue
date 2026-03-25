<script setup lang="ts">
import { ref } from 'vue';
import type { Work } from '@/api/types';

defineProps<{
  work: Work;
}>();

const imageLoaded = ref(false);
const imageRef = ref<HTMLImageElement | null>(null);

const onImageLoad = () => {
  imageLoaded.value = true;
  // Calculate row span based on actual image dimensions
  if (imageRef.value) {
    const aspectRatio = imageRef.value.naturalWidth / imageRef.value.naturalHeight;
    const rowSpan = Math.ceil((300 / aspectRatio + 16) / 10);
    const masonryItem = imageRef.value.closest('.masonry-item') as HTMLElement;
    if (masonryItem) {
      masonryItem.style.setProperty('--row-span', String(rowSpan));
    }
  }
};
</script>

<template>
  <div class="work-card">
    <img
      ref="imageRef"
      :src="`/${work.thumbnailLarge}`"
      :alt="work.title"
      loading="lazy"
      @load="onImageLoad"
      :class="{ loaded: imageLoaded }"
    />
    <div class="work-overlay">
      <h3>{{ work.title }}</h3>
    </div>
  </div>
</template>

<style scoped>
.work-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-card);
}

.work-card img {
  width: 100%;
  display: block;
  opacity: 0;
  transition: opacity 0.3s;
}

.work-card img.loaded {
  opacity: 1;
}

.work-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.work-card:hover .work-overlay {
  opacity: 1;
}
</style>