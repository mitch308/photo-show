import { computed } from 'vue';
import type { Work } from '@/api/types';

/**
 * 获取作品缩略图 URL
 * 优先使用 mediaItems[0].thumbnailLarge，兼容旧数据的 work.thumbnailLarge
 *
 * @param work 作品对象
 * @returns 缩略图 URL，如果没有则返回 null
 */
export function useWorkThumbnail(work: Work) {
  const thumbnailUrl = computed(() => {
    // 1. 优先使用 mediaItems[0].thumbnailLarge（新数据结构）
    if (work.mediaItems && work.mediaItems.length > 0 && work.mediaItems[0].thumbnailLarge) {
      return work.mediaItems[0].thumbnailLarge;
    }

    // 2. 降级使用 work.thumbnailLarge（旧数据兼容）
    if (work.thumbnailLarge) {
      return work.thumbnailLarge;
    }

    // 3. 无缩略图
    return null;
  });

  return {
    thumbnailUrl,
  };
}