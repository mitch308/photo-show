<script setup lang="ts">
import { ref } from 'vue';
import type { Work } from '@/api/types';

defineProps<{
  work: Work;
}>();

const imageLoaded = ref(false);
</script>

<template>
  <div class="work-card">
    <img
      :src="`/${work.thumbnailLarge}`"
      :alt="work.title"
      loading="lazy"
      @load="imageLoaded = true"
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