import { defineStore } from 'pinia';
import { worksApi } from '@/api/works';
import type { Work } from '@/api/types';

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
    async fetchWorks(filters?: { albumId?: string; tagId?: string; isPublic?: boolean }) {
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
  },
});