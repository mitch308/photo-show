<script setup lang="ts">
import { ref } from 'vue';
import type { Work } from '@/api/types';
import { useWorkThumbnail } from '@/composables/useWorkThumbnail';

const props = defineProps<{
  work: Work;
}>();

const { thumbnailUrl } = useWorkThumbnail(props.work);
const imageLoaded = ref(false);
</script>

<template>
  <div class="work-card">
    <img
      v-if="thumbnailUrl"
      :src="`/${thumbnailUrl}`"
      :alt="work.title"
      loading="lazy"
      @load="imageLoaded = true"
      :class="{ loaded: imageLoaded }"
    />
    <div v-else class="placeholder">
      <span>无图片</span>
    </div>
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

.placeholder {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card, #f0f0f0);
  color: var(--text-secondary, #999);
  font-size: 14px;
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