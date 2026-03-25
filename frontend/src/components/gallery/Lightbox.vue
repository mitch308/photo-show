<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import type { Work } from '@/api/types';

const props = defineProps<{
  work: Work | null;
  works: Work[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'navigate', work: Work): void;
}>();

const currentIndex = computed(() => {
  if (!props.work) return -1;
  return props.works.findIndex(w => w.id === props.work?.id);
});

const hasPrev = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < props.works.length - 1);

const prev = () => {
  if (hasPrev.value) {
    emit('navigate', props.works[currentIndex.value - 1]);
  }
};

const next = () => {
  if (hasNext.value) {
    emit('navigate', props.works[currentIndex.value + 1]);
  }
};

const close = () => emit('close');

// Keyboard navigation (per D-15)
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;
  
  switch (e.key) {
    case 'Escape':
      close();
      break;
    case 'ArrowLeft':
      prev();
      break;
    case 'ArrowRight':
      next();
      break;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen && work" class="lightbox-overlay" @click.self="close">
        <button class="lightbox-close" @click="close">×</button>
        <button class="lightbox-prev" @click="prev" :disabled="!hasPrev">‹</button>
        <button class="lightbox-next" @click="next" :disabled="!hasNext">›</button>
        
        <div class="lightbox-content">
          <img :src="`/${work.filePath}`" :alt="work.title" />
          <div class="lightbox-info">
            <h3>{{ work.title }}</h3>
            <p v-if="work.description">{{ work.description }}</p>
            <div class="lightbox-meta">
              <span v-for="tag in work.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 40px;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
}

.lightbox-prev, .lightbox-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
  padding: 20px;
}

.lightbox-prev { left: 20px; }
.lightbox-next { right: 20px; }

.lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.lightbox-info {
  padding: 20px;
  color: white;
  text-align: center;
}

.lightbox-meta {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 12px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>