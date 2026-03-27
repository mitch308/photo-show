<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import VueEasyLightbox from 'vue-easy-lightbox';
import 'vue-easy-lightbox/dist/external-css/vue-easy-lightbox.css';
import type { MediaItem } from '@/api/types';

const props = defineProps<{
  mediaItems: MediaItem[];
  initialIndex: number;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}>();

// Current index in lightbox
const currentIndex = ref(props.initialIndex);

// Computed current media item
const currentMedia = computed(() => props.mediaItems[currentIndex.value]);

// Image URLs for vue-easy-lightbox (use filePath for original quality)
const imageUrls = computed(() =>
  props.mediaItems.map(item => `/${item.filePath}`)
);

// Navigation
const hasPrev = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < props.mediaItems.length - 1);

const onPrev = () => {
  if (hasPrev.value) currentIndex.value--;
};

const onNext = () => {
  if (hasNext.value) currentIndex.value++;
};

const onClose = () => {
  emit('update:visible', false);
  emit('close');
};

// Index change handler from vue-easy-lightbox
const onIndexChange = (index: number) => {
  currentIndex.value = index;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Mouse click navigation for SHOW-03
const handleMouseDown = (e: MouseEvent) => {
  if (!props.visible) return;
  
  // Left click (button 0) → previous image
  if (e.button === 0) {
    e.preventDefault();
    onPrev();
  }
  // Right click (button 2) → next image
  else if (e.button === 2) {
    e.preventDefault();
    onNext();
  }
};

// Prevent context menu on right click
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault();
};

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.visible) return;
  switch (e.key) {
    case 'ArrowLeft':
      onPrev();
      break;
    case 'ArrowRight':
      onNext();
      break;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// Reset index when opening with different initial
watch(() => props.initialIndex, (newIndex) => {
  if (props.visible) {
    currentIndex.value = newIndex;
  }
});

// Reset index when visibility changes to true
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    currentIndex.value = props.initialIndex;
  }
});
</script>

<template>
  <VueEasyLightbox
    :visible="visible"
    :imgs="imageUrls"
    :index="currentIndex"
    :loop="true"
    :rotateDisabled="false"
    :zoomDisabled="false"
    :pinchDisabled="false"
    :dblclickDisabled="false"
    :moveDisabled="false"
    @hide="onClose"
    @on-index-change="onIndexChange"
    @mousedown="handleMouseDown"
    @contextmenu="handleContextMenu"
  >
    <template #toolbar>
      <div class="lightbox-toolbar">
        <span class="file-info">
          {{ currentMedia?.originalFilename }} · {{ formatFileSize(currentMedia?.fileSize || 0) }}
        </span>
        <span class="position-info">
          {{ currentIndex + 1 }} / {{ mediaItems.length }}
        </span>
        <span class="hint-info">左键上一张，右键下一张</span>
      </div>
    </template>
  </VueEasyLightbox>
</template>

<style scoped>
.lightbox-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  z-index: 10;
}

.file-info {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.position-info {
  font-size: 12px;
  opacity: 0.8;
}

.hint-info {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
}
</style>