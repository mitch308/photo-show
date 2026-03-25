<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGalleryStore } from '@/stores/gallery';
import { useBreakpoints } from '@vueuse/core';

const store = useGalleryStore();
const showFilters = ref(false);

const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768
});

const isMobile = breakpoints.smaller('tablet');

const activeFiltersCount = computed(() => {
  let count = 0;
  if (store.filters.albumId) count++;
  if (store.filters.tagId) count++;
  if (store.filters.search) count++;
  return count;
});

const selectAlbum = (albumId: string | null) => {
  store.setFilter('albumId', albumId || null);
};

const selectTag = (tagId: string | null) => {
  store.setFilter('tagId', tagId || null);
};

const search = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  store.setFilter('search', value || null);
};

const clearAll = () => {
  store.clearFilters();
};
</script>

<template>
  <div class="filter-bar" :class="{ mobile: isMobile }">
    <!-- Mobile toggle -->
    <button v-if="isMobile" class="filter-toggle" @click="showFilters = !showFilters">
      筛选 {{ activeFiltersCount > 0 ? `(${activeFiltersCount})` : '' }}
    </button>
    
    <!-- Filter content -->
    <div class="filter-content" :class="{ open: showFilters || !isMobile }">
      <!-- Search -->
      <div class="filter-item">
        <input
          type="text"
          placeholder="搜索作品..."
          :value="store.filters.search || ''"
          @input="search"
          class="search-input"
        />
      </div>
      
      <!-- Album filter -->
      <div class="filter-item">
        <select :value="store.filters.albumId || ''" @change="selectAlbum(($event.target as HTMLSelectElement).value || null)">
          <option value="">全部相册</option>
          <option v-for="album in store.albums" :key="album.id" :value="album.id">
            {{ album.name }}
          </option>
        </select>
      </div>
      
      <!-- Tag filter -->
      <div class="filter-item">
        <select :value="store.filters.tagId || ''" @change="selectTag(($event.target as HTMLSelectElement).value || null)">
          <option value="">全部标签</option>
          <option v-for="tag in store.tags" :key="tag.id" :value="tag.id">
            {{ tag.name }}
          </option>
        </select>
      </div>
      
      <!-- Clear button -->
      <button v-if="activeFiltersCount > 0" class="clear-btn" @click="clearAll">
        清除筛选
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  padding: 16px;
  background: var(--bg-card);
  border-radius: 8px;
  margin-bottom: 24px;
}

.filter-content {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-bar.mobile .filter-content {
  display: none;
  flex-direction: column;
}

.filter-bar.mobile .filter-content.open {
  display: flex;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-width: 200px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-width: 150px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.clear-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-primary);
}

.filter-toggle {
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>