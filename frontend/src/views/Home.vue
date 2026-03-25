<script setup lang="ts">
import { ref } from 'vue';
import { useUrlFilters } from '@/composables/useUrlFilters';
import { useInfiniteScroll } from '@/composables/useInfiniteScroll';
import MasonryGrid from '@/components/gallery/MasonryGrid.vue';
import Lightbox from '@/components/gallery/Lightbox.vue';
import FilterBar from '@/components/gallery/FilterBar.vue';
import type { Work } from '@/api/types';

const { store } = useUrlFilters();
const selectedWork = ref<Work | null>(null);
const lightboxOpen = ref(false);

const { sentinel } = useInfiniteScroll(() => store.loadMore());

const openLightbox = (work: Work) => {
  selectedWork.value = work;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
};

const navigateLightbox = (work: Work) => {
  selectedWork.value = work;
};
</script>

<template>
  <div class="home-page">
    <header class="header">
      <h1>摄影工作室</h1>
      <nav>
        <router-link to="/login">管理登录</router-link>
      </nav>
    </header>
    
    <main class="main">
      <FilterBar />
      
      <MasonryGrid
        :works="store.works"
        :loading="store.loading"
        @select="openLightbox"
      />
      
      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="scroll-sentinel">
        <span v-if="store.loading">加载中...</span>
        <span v-else-if="!store.pagination.hasMore">没有更多作品了</span>
      </div>
    </main>
    
    <Lightbox
      :work="selectedWork"
      :works="store.works"
      :isOpen="lightboxOpen"
      @close="closeLightbox"
      @navigate="navigateLightbox"
    />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: var(--bg-card);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.header nav a {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border-radius: 4px;
}

.main {
  flex: 1;
  padding: 24px 40px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.scroll-sentinel {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .header {
    padding: 16px 20px;
  }
  
  .main {
    padding: 16px;
  }
}
</style>