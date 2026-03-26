import { defineStore } from 'pinia';
import { worksApi } from '@/api/works';
import { mediaItemsApi } from '@/api/mediaItems';
import type { Work, MediaItem } from '@/api/types';

interface WorksState {
  works: Work[];
  loading: boolean;
  error: string | null;
}

export const useWorksStore = defineStore('works', {
  state: (): WorksState => ({
    works: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchWorks(filters?: { albumId?: string; tagId?: string; isPublic?: boolean; title?: string; isPinned?: boolean }) {
      this.loading = true;
      this.error = null;
      try {
        this.works = await worksApi.getWorks(filters);
      } catch (error: any) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async createWork(data: Partial<Work>) {
      const work = await worksApi.createWork(data);
      this.works.push(work);
      return work;
    },

    async updateWork(id: string, data: Partial<Work>) {
      const work = await worksApi.updateWork(id, data);
      const index = this.works.findIndex(w => w.id === id);
      if (index !== -1) {
        this.works[index] = work;
      }
      return work;
    },

    async deleteWork(id: string) {
      await worksApi.deleteWork(id);
      this.works = this.works.filter(w => w.id !== id);
    },

    async updatePositions(positions: { id: string; position: number }[]) {
      await worksApi.updatePositions(positions);
      positions.forEach(({ id, position }) => {
        const work = this.works.find(w => w.id === id);
        if (work) work.position = position;
      });
    },

    // Media item management
    async addMediaItem(workId: string, data: {
      filePath: string;
      thumbnailSmall?: string | null;
      thumbnailLarge?: string | null;
      originalFilename: string;
      fileType: 'image' | 'video';
      mimeType: string;
      fileSize: number;
      fileHash?: string;
    }): Promise<MediaItem> {
      const mediaItem = await mediaItemsApi.addMediaItem(workId, data);
      const work = this.works.find(w => w.id === workId);
      if (work) {
        if (!work.mediaItems) {
          work.mediaItems = [];
        }
        work.mediaItems.push(mediaItem);
      }
      return mediaItem;
    },

    async fetchMediaItems(workId: string): Promise<MediaItem[]> {
      const items = await mediaItemsApi.getMediaItems(workId);
      const work = this.works.find(w => w.id === workId);
      if (work) {
        work.mediaItems = items;
      }
      return items;
    },

    async updateMediaItem(id: string, data: Partial<MediaItem>): Promise<MediaItem> {
      const updated = await mediaItemsApi.updateMediaItem(id, data);
      // Update in local state
      for (const work of this.works) {
        if (work.mediaItems) {
          const index = work.mediaItems.findIndex(m => m.id === id);
          if (index !== -1) {
            work.mediaItems[index] = updated;
            break;
          }
        }
      }
      return updated;
    },

    async deleteMediaItem(id: string): Promise<void> {
      await mediaItemsApi.deleteMediaItem(id);
      // Remove from local state
      for (const work of this.works) {
        if (work.mediaItems) {
          work.mediaItems = work.mediaItems.filter(m => m.id !== id);
        }
      }
    },

    async reorderMediaItems(workId: string, itemIds: string[]): Promise<void> {
      await mediaItemsApi.reorderMediaItems(workId, itemIds);
      // Update local state positions
      const work = this.works.find(w => w.id === workId);
      if (work && work.mediaItems) {
        work.mediaItems = itemIds.map((id, index) => {
          const item = work.mediaItems!.find(m => m.id === id);
          return item ? { ...item, position: index } : null;
        }).filter(Boolean) as MediaItem[];
      }
    },
  },
});