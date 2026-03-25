import { useRoute, useRouter } from 'vue-router';
import { useGalleryStore } from '@/stores/gallery';
import { watch, onMounted } from 'vue';

export function useUrlFilters() {
  const route = useRoute();
  const router = useRouter();
  const store = useGalleryStore();

  // Read filters from URL on mount
  onMounted(async () => {
    const albumId = route.query.album as string || null;
    const tagId = route.query.tag as string || null;
    const search = route.query.q as string || null;

    if (albumId) store.filters.albumId = albumId;
    if (tagId) store.filters.tagId = tagId;
    if (search) store.filters.search = search;

    // Fetch with URL filters
    await store.fetchWorks();
    await Promise.all([store.fetchAlbums(), store.fetchTags()]);
  });

  // Sync filters to URL when they change
  watch(
    () => store.filters,
    (filters) => {
      const query: Record<string, string> = {};
      if (filters.albumId) query.album = filters.albumId;
      if (filters.tagId) query.tag = filters.tagId;
      if (filters.search) query.q = filters.search;

      router.replace({ query });
    },
    { deep: true }
  );

  return {
    store
  };
}