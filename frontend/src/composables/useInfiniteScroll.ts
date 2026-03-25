import { ref, onMounted } from 'vue';

export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  options: { threshold?: number } = {}
) {
  const loading = ref(false);
  const sentinel = ref<HTMLElement | null>(null);

  onMounted(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !loading.value) {
          loading.value = true;
          await loadMore();
          loading.value = false;
        }
      },
      { rootMargin: `${options.threshold || 200}px` }
    );

    if (sentinel.value) {
      observer.observe(sentinel.value);
    }
  });

  return { loading, sentinel };
}