# Phase 3: 公开展示与私密分享 - Research

**Domain:** Photography Studio Portfolio Platform
**Phase:** 3 - 公开展示与私密分享
**Researched:** 2026-03-25
**Confidence:** HIGH

## Research Summary

This phase implements the public gallery and private sharing functionality. Key technical challenges:
1. CSS-only masonry layout without third-party libraries
2. Secure private link token generation and storage
3. Responsive design for mobile/tablet/desktop
4. Lightbox interaction for image viewing
5. Lazy loading and infinite scroll performance

---

## Topic 1: CSS Grid 瀑布流实现 (Masonry Layout)

### Recommended Approach: CSS Grid with grid-row-end: span N

**Why not use JavaScript libraries:**
- D-01 locked decision: 瀑布流使用 CSS Grid 实现，无需第三方库
- CSS-only solution is lighter (~0KB vs Masonry.js ~30KB)
- Native browser support, better performance
- Works well with lazy loading

**Implementation Pattern:**

```css
/* Masonry container */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-auto-rows: 10px; /* Small row height for smooth spanning */
  gap: 16px;
}

/* Masonry item - requires knowing image aspect ratio */
.masonry-item {
  grid-row-end: span var(--rows); /* CSS variable set by JS */
}
```

**JavaScript Helper (minimal):**

```typescript
// Calculate row span based on image height
function calculateRowSpan(imageHeight: number, rowHeight: number = 10, gap: number = 16): number {
  return Math.ceil((imageHeight + gap) / rowHeight);
}

// Set CSS variable on image load
function setMasonrySpan(img: HTMLImageElement) {
  const rowHeight = 10;
  const rows = Math.ceil((img.naturalHeight * 0.3) / rowHeight); // 0.3 is scale factor
  img.parentElement?.style.setProperty('--rows', String(rows));
}
```

**Alternative: CSS Columns (simpler but less control):**

```css
.masonry-columns {
  column-count: 3;
  column-gap: 16px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 16px;
}
```

**Recommendation:** Use CSS Grid with JavaScript row calculation for precise control. CSS Columns as fallback for older browsers.

### Responsive Column Count (D-07)

```css
/* Mobile: single column */
.masonry-grid {
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .masonry-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3-4 columns */
@media (min-width: 1024px) {
  .masonry-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
```

---

## Topic 2: 私密链接 Token 安全设计

### Token Generation (D-09)

**Locked decision:** `crypto.randomBytes(32).toString('base64url')`

**Why this approach:**
- 32 bytes = 256 bits of entropy
- base64url encoding: URL-safe (no +, /, =)
- Total token length: ~43 characters
- Cryptographically secure (not guessable)

**Implementation:**

```typescript
import crypto from 'crypto';

function generateShareToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Example output: "aB3dE7fG9hJ2kL5mN8pQ1rS4tU6vW0xY"
```

**Security considerations:**
- NEVER use UUID v4 (predictable pattern)
- NEVER use sequential IDs
- NEVER use timestamps alone

### Token Storage in Redis (D-10)

**Data structure:**

```
Key: share:{token}
Value: JSON.stringify({ workIds: string[], expiresAt: number, createdAt: number })
TTL: expiresAt - now (in seconds)
```

**Implementation:**

```typescript
interface ShareTokenData {
  workIds: string[];
  expiresAt: number; // Unix timestamp (ms)
  createdAt: number;
}

class ShareService {
  private redis: Redis;

  async createShareToken(workIds: string[], expiresInDays: number = 7): Promise<string> {
    const token = generateShareToken();
    const now = Date.now();
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;
    const ttlSeconds = expiresInDays * 24 * 60 * 60;

    const data: ShareTokenData = {
      workIds,
      expiresAt,
      createdAt: now
    };

    await this.redis.setex(
      `share:${token}`,
      ttlSeconds,
      JSON.stringify(data)
    );

    return token;
  }

  async validateToken(token: string): Promise<ShareTokenData | null> {
    const data = await this.redis.get(`share:${token}`);
    if (!data) return null;

    return JSON.parse(data);
  }

  async revokeToken(token: string): Promise<void> {
    await this.redis.del(`share:${token}`);
  }
}
```

### Expiration Options (D-11)

| Option | TTL (seconds) | Use Case |
|--------|---------------|----------|
| 1 day | 86400 | Quick client review |
| 7 days | 604800 | Default, most common |
| 30 days | 2592000 | Long-term access |
| Custom | User-defined | Flexible needs |

---

## Topic 3: 响应式移动端适配

### Breakpoint Strategy (D-07)

```typescript
// VueUse composable for responsive detection
import { useBreakpoints } from '@vueuse/core';

const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024
});

const isMobile = breakpoints.smaller('tablet');
const isTablet = breakpoints.between('tablet', 'desktop');
const isDesktop = breakpoints.greater('desktop');
```

### Mobile-Specific Considerations (D-08, D-20)

**1. Filter bar - dropdown instead of sidebar:**

```vue
<!-- Mobile: Collapsible filter -->
<div class="filter-mobile" v-if="isMobile">
  <button @click="showFilters = !showFilters">
    筛选 {{ activeFilters > 0 ? `(${activeFilters})` : '' }}
  </button>
  <div v-show="showFilters" class="filter-dropdown">
    <!-- Filter options -->
  </div>
</div>

<!-- Desktop: Always visible sidebar -->
<div class="filter-desktop" v-else>
  <!-- Filter options always visible -->
</div>
```

**2. Touch gestures for lightbox:**
- Swipe left/right for navigation
- Pinch to zoom
- Tap to close

**3. Touch target sizes:**
- Minimum 44px × 44px for buttons
- Adequate spacing between interactive elements

### Performance on Mobile

**1. Reduce image quality:**

```typescript
// Serve smaller thumbnails on mobile
const thumbnailSize = isMobile ? 'small' : 'large';
```

**2. Limit initial load:**

```typescript
// D-03: Load 20 items initially, but fewer on mobile
const initialLoad = isMobile ? 12 : 20;
```

---

## Topic 4: Lightbox 组件交互设计

### Component Structure

```vue
<!-- components/gallery/Lightbox.vue -->
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="lightbox-overlay" @click.self="close">
        <!-- Close button -->
        <button class="lightbox-close" @click="close">×</button>
        
        <!-- Navigation -->
        <button class="lightbox-prev" @click="prev" :disabled="!hasPrev">
          ‹
        </button>
        <button class="lightbox-next" @click="next" :disabled="!hasNext">
          ›
        </button>
        
        <!-- Main image -->
        <div class="lightbox-content">
          <img :src="currentImage" :alt="currentWork.title" />
          <div class="lightbox-info">
            <h3>{{ currentWork.title }}</h3>
            <p v-if="currentWork.description">{{ currentWork.description }}</p>
          </div>
        </div>
        
        <!-- Thumbnail strip (optional) -->
        <div class="lightbox-thumbnails">
          <img v-for="(work, i) in works" 
               :key="work.id"
               :src="work.thumbnailSmall"
               @click="goTo(i)"
               :class="{ active: i === currentIndex }" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
```

### Keyboard Navigation

```typescript
// composables/useLightbox.ts
function useKeyboardNavigation(lightbox: Ref<LightboxState>) {
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
  
  function handleKeydown(e: KeyboardEvent) {
    if (!lightbox.value.isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        lightbox.value.close();
        break;
      case 'ArrowLeft':
        lightbox.value.prev();
        break;
      case 'ArrowRight':
        lightbox.value.next();
        break;
    }
  }
}
```

### Touch Navigation (Mobile)

```typescript
// composables/useSwipe.ts
function useSwipe(element: Ref<HTMLElement | null>, callbacks: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  let startX = 0;
  
  function onTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
  }
  
  function onTouchEnd(e: TouchEvent) {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) callbacks.onSwipeRight();
      else callbacks.onSwipeLeft();
    }
  }
  
  // Attach listeners...
}
```

---

## Topic 5: 图片懒加载和无限滚动

### Lazy Loading with Intersection Observer (D-04)

```typescript
// composables/useLazyLoad.ts
export function useLazyLoad() {
  const observer = ref<IntersectionObserver | null>(null);
  
  onMounted(() => {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.value?.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '100px' } // Start loading 100px before visible
    );
  });
  
  function observe(img: HTMLImageElement) {
    if (observer.value) {
      observer.value.observe(img);
    }
  }
  
  return { observe };
}
```

**Template usage:**

```vue
<img 
  :data-src="work.thumbnailLarge" 
  src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  ref="imgRef"
  loading="lazy"
/>
```

**Note:** Modern browsers support native `loading="lazy"`, but Intersection Observer provides more control.

### Infinite Scroll

```typescript
// composables/useInfiniteScroll.ts
export function useInfiniteScroll(
  fetchMore: () => Promise<void>,
  options: { threshold?: number } = {}
) {
  const loading = ref(false);
  const hasMore = ref(true);
  const sentinel = ref<HTMLElement | null>(null);
  
  onMounted(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !loading.value && hasMore.value) {
          loading.value = true;
          await fetchMore();
          loading.value = false;
        }
      },
      { rootMargin: `${options.threshold || 200}px` }
    );
    
    if (sentinel.value) {
      observer.observe(sentinel.value);
    }
  });
  
  return { loading, hasMore, sentinel };
}
```

**Template usage:**

```vue
<div class="masonry-grid">
  <WorkCard v-for="work in works" :key="work.id" :work="work" />
</div>

<!-- Sentinel element -->
<div ref="sentinel" class="scroll-sentinel">
  <Spinner v-if="loading" />
</div>
```

### Pagination Strategy (D-03)

```typescript
// stores/gallery.ts
export const useGalleryStore = defineStore('gallery', {
  state: () => ({
    works: [] as Work[],
    page: 0,
    pageSize: 20,
    hasMore: true,
    filters: {
      albumId: null,
      tagId: null,
      search: ''
    }
  }),
  
  actions: {
    async fetchWorks(append = false) {
      const params = {
        page: this.page,
        limit: this.pageSize,
        ...this.filters
      };
      
      const response = await api.get('/api/public/works', { params });
      
      if (append) {
        this.works.push(...response.data);
      } else {
        this.works = response.data;
      }
      
      this.hasMore = response.data.length === this.pageSize;
    },
    
    async loadMore() {
      this.page++;
      await this.fetchWorks(true);
    }
  }
});
```

---

## Topic 6: URL State Sync for Filters (D-05)

### Why URL Sync?

- Shareable links (send filtered view to client)
- Bookmark support
- Browser back/forward navigation
- Refresh maintains state

### Implementation

```typescript
// composables/useUrlFilters.ts
export function useUrlFilters() {
  const route = useRoute();
  const router = useRouter();
  
  const filters = reactive({
    albumId: route.query.album as string || null,
    tagId: route.query.tag as string || null,
    search: route.query.q as string || ''
  });
  
  // Sync to URL
  watch(filters, (newFilters) => {
    const query: Record<string, string> = {};
    if (newFilters.albumId) query.album = newFilters.albumId;
    if (newFilters.tagId) query.tag = newFilters.tagId;
    if (newFilters.search) query.q = newFilters.search;
    
    router.replace({ query });
  }, { deep: true });
  
  return { filters };
}
```

---

## Topic 7: 搜索实现 (D-06)

### Simple LIKE Search (Phase 3)

```typescript
// services/workService.ts - add search method
async searchPublicWorks(query: string, options?: PaginationOptions): Promise<Work[]> {
  const qb = this.workRepo.createQueryBuilder('work')
    .leftJoinAndSelect('work.albums', 'albums')
    .leftJoinAndSelect('work.tags', 'tags')
    .where('work.isPublic = true')
    .andWhere(
      new Brackets(qb => {
        qb.where('work.title LIKE :query')
          .orWhere('work.description LIKE :query');
      }),
      { query: `%${query}%` }
    )
    .orderBy('work.isPinned', 'DESC')
    .addOrderBy('work.position', 'ASC');
  
  if (options?.limit) {
    qb.take(options.limit);
  }
  if (options?.offset) {
    qb.skip(options.offset);
  }
  
  return qb.getMany();
}
```

**Note:** For Phase 4, consider upgrading to MySQL FULLTEXT index for better performance with large datasets.

---

## Validation Architecture

### Testable Behaviors

| Behavior | Input | Expected Output | Verification |
|----------|-------|-----------------|--------------|
| 瀑布流渲染 | 20张作品 | 正确列数，图片无重叠 | Visual test + DOM check |
| Token 生成 | 调用 generateShareToken | 43字符 base64url 字符串 | Unit test: regex match |
| Token 存储 | workIds + 7天 | Redis key 存在，TTL 正确 | Integration test |
| Token 验证 | 有效 token | 返回 workIds | API test |
| Token 过期 | 过期 token | 返回 null/404 | Redis TTL test |
| 无限滚动 | 滚动到底部 | 加载更多作品 | E2E test |
| 懒加载 | 图片进入视口 | src 从 data-src 加载 | Intersection Observer test |
| 筛选同步 | 选择相册 | URL 更新 ?album=xxx | Router test |
| 移动端响应 | 320px 宽度 | 单列布局 | CSS test |

### Key Integration Points

1. **Frontend ↔ Backend Public API**
   - No authentication required
   - Only returns isPublic=true works
   - Pagination, filtering, search

2. **Frontend ↔ Backend Share API**
   - Token-based access control
   - Redis token validation
   - Original file download

3. **Backend ↔ Redis**
   - Share token storage with TTL
   - View count caching (Phase 4)

---

## API Endpoints Summary

### Public API (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/public/works | List public works (paginated, filterable) |
| GET | /api/public/works/:id | Get single public work |
| GET | /api/public/albums | List all albums |
| GET | /api/public/tags | List all tags |

### Share API (Token Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/share/:token | Get works by share token |
| GET | /api/share/:token/download/:workId | Download original file |

### Admin API (JWT Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/share | Create share link |
| GET | /api/admin/share | List all share links |
| DELETE | /api/admin/share/:token | Revoke share link |

---

## Dependencies

### Frontend

| Package | Purpose | Already Installed |
|---------|---------|-------------------|
| vue-router | Routing | ✓ |
| pinia | State management | ✓ |
| axios | API requests | ✓ |
| @vueuse/core | Responsive, utilities | ✓ |

### Backend

| Package | Purpose | Already Installed |
|---------|---------|-------------------|
| express | API framework | ✓ |
| ioredis | Redis client | ✓ |
| typeorm | ORM | ✓ |

---

## Sources

- CSS Grid Masonry: https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/
- Intersection Observer API: MDN Web Docs
- Redis TTL patterns: Redis Documentation
- Vue 3 Composition API patterns: Vue.js Documentation
- @vueuse/core utilities: https://vueuse.org/

---
*Research for: Phase 3 - 公开展示与私密分享*
*Researched: 2026-03-25*