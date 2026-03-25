import { defineStore } from 'pinia';
import { publicApi } from '@/api/public';
import type { Work, Album, Tag } from '@/api/types';

export const useGalleryStore = defineStore('gallery', {
  state: () => ({
    works: [] as Work[],
    albums: [] as Album[],
    tags: [] as Tag[],
    filters: {
      albumId: null as string | null,
      tagId: null as string | null,
      search: null as string | null
    },
    pagination: {
      limit: 20,
      offset: 0,
      hasMore: true,
      total: 0
    },
    loading: false,
    error: null as string | null
  }),

  getters: {
    hasFilters: (state) => 
      state.filters.albumId || state.filters.tagId || state.filters.search
  },

  actions: {
    async fetchWorks(append = false) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await publicApi.getWorks({
          albumId: this.filters.albumId || undefined,
          tagId: this.filters.tagId || undefined,
          q: this.filters.search || undefined,
          limit: this.pagination.limit,
          offset: append ? this.pagination.offset : 0
        });
        
        if (append) {
          this.works.push(...response.works);
        } else {
          this.works = response.works;
        }
        
        this.pagination.total = response.total;
        this.pagination.hasMore = response.hasMore;
        this.pagination.offset = this.works.length;
      } catch (e: any) {
        this.error = e.message || 'Failed to load works';
      } finally {
        this.loading = false;
      }
    },

    async loadMore() {
      if (!this.pagination.hasMore || this.loading) return;
      await this.fetchWorks(true);
    },

    async setFilter(key: 'albumId' | 'tagId' | 'search', value: string | null) {
      this.filters[key] = value;
      this.pagination.offset = 0;
      this.pagination.hasMore = true;
      await this.fetchWorks(false);
    },

    clearFilters() {
      this.filters = { albumId: null, tagId: null, search: null };
      this.pagination.offset = 0;
      this.fetchWorks(false);
    },

    async fetchAlbums() {
      this.albums = await publicApi.getAlbums();
    },

    async fetchTags() {
      this.tags = await publicApi.getTags();
    }
  }
});