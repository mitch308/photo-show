import { defineStore } from 'pinia';
import { shareApi, type ShareData } from '@/api/share';
import type { Work } from '@/api/types';

export const useShareStore = defineStore('share', {
  state: () => ({
    shareData: null as ShareData | null,
    works: [] as Work[],
    loading: false,
    error: null as string | null,
    expired: false
  }),

  getters: {
    isValid: (state) => state.shareData !== null && !state.expired,
    expiresIn: (state) => {
      if (!state.shareData) return null;
      const diff = state.shareData.expiresAt - Date.now();
      if (diff <= 0) return '已过期';
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days > 0) return `${days}天后过期`;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours > 0) return `${hours}小时后过期`;
      return '即将过期';
    }
  },

  actions: {
    async fetchShare(token: string) {
      this.loading = true;
      this.error = null;
      this.expired = false;
      
      try {
        const data = await shareApi.getShare(token);
        this.shareData = data;
        this.works = data.works;
        
        // Check if expired
        if (data.expiresAt < Date.now()) {
          this.expired = true;
        }
      } catch (e: any) {
        if (e.response?.status === 404) {
          this.expired = true;
          this.error = '链接已过期或不存在';
        } else {
          this.error = e.message || '加载失败';
        }
      } finally {
        this.loading = false;
      }
    },

    getDownloadUrl(workId: string): string | null {
      if (!this.shareData || this.expired) return null;
      if (!this.works.find(w => w.id === workId)) return null;
      return shareApi.getDownloadUrl(this.shareData.token, workId);
    },

    async downloadWork(workId: string) {
      const url = this.getDownloadUrl(workId);
      if (!url) return;
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
});