# Stack Research — Photography Platform

**Domain:** Photography Studio Portfolio Platform
**Researched:** 2026-03-26 (v1.2 UI/UX)
**Confidence:** HIGH

---

## v1.2 UI/UX Improvements — NEW Additions

### Required New Libraries

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| vue-easy-lightbox | ^1.19.0 | File gallery lightbox with zoom/pan/rotate | Vue 3 native, 470+ stars, 3.6k users, zero-config, handles multiple images, video support |

### Optional Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vueuse/motion | ^2.2.0 | Animation composables for UI beautification | If enhanced animations are desired (<20kb, Popmotion-based) |
| fuse.js | ^7.1.0 | Client-side fuzzy search | If admin list filters need fuzzy matching |

### Feature-to-Library Mapping

| Target Feature | Solution | Library Needed |
|---------------|----------|----------------|
| Work detail page with file gallery | Replace basic Lightbox.vue with vue-easy-lightbox | **vue-easy-lightbox** |
| Thumbnail fixes | Backend fix (use first mediaItem) | None (code change) |
| Filter functionality for admin lists | Use Element Plus components | None (use existing el-input, el-select) |
| Sidebar independent scrolling | Wrap nav in `el-scrollbar` | None (use existing el-scrollbar) |
| Responsive card layouts | Already implemented with CSS columns | None (existing MasonshipGrid.vue) |
| UI beautification | frontend-design skill + CSS | Optional: @vueuse/motion |
| System settings card auto-width | CSS Grid with auto-fit | None (CSS change) |

### vue-easy-lightbox Integration

**Replace existing `Lightbox.vue`:**
```vue
<script setup lang="ts">
import VueEasyLightbox from 'vue-easy-lightbox'
import 'vue-easy-lightbox/dist/external-css/vue-easy-lightbox.css'
import { ref } from 'vue'

const visibleRef = ref(false)
const indexRef = ref(0)
const imgsRef = ref<string[]>([])

const show = (index: number, images: string[]) => {
  imgsRef.value = images
  indexRef.value = index
  visibleRef.value = true
}
</script>

<template>
  <VueEasyLightbox
    :visible="visibleRef"
    :imgs="imgsRef"
    :index="indexRef"
    @hide="visibleRef = false"
  />
</template>
```

**Key features for photography workflow:**
- Zoom in/out with mouse wheel
- Pan/drag images
- Rotate images
- Keyboard navigation (arrow keys, escape)
- Swipe on mobile
- Video support (for media items)

### el-scrollbar Integration for Sidebar

**Wrap sidebar nav (Dashboard.vue):**
```vue
<aside class="sidebar">
  <div class="logo">...</div>
  <el-scrollbar class="nav-scrollbar">
    <nav class="nav">
      <router-link ...>...</router-link>
    </nav>
  </el-scrollbar>
  <div class="sidebar-footer">...</div>
</aside>

<style scoped>
.nav-scrollbar {
  flex: 1;
  height: 0; /* Important: let flex control height */
}
</style>
```

### @vueuse/motion Integration (Optional)

**For UI beautification animations:**
```vue
<script setup>
import { useMotion } from '@vueuse/motion'
</script>

<template>
  <!-- Fade in with spring animation -->
  <div v-motion-fade-visible>
    Content
  </div>

  <!-- Custom animation -->
  <div
    v-motion
    :initial="{ opacity: 0, y: 100 }"
    :enter="{ opacity: 1, y: 0 }"
  >
    Card content
  </div>
</template>
```

---

## v1.1 Enhancements — Previously Added

### Frontend Additions

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| @wangeditor/editor | ^5.1 | Rich Text Editor Core | Modern WYSIWYG, TypeScript support, active maintenance (18.3k stars) |
| @wangeditor/editor-for-vue | ^5.1 | Vue 3 Integration | Official Vue 3 wrapper, shallowRef pattern, Element Plus compatible |

### Backend — No New Dependencies Required

| Feature | Implementation | Why No New Library |
|---------|---------------|-------------------|
| File deduplication | Node.js `crypto.createHash('md5')` | Built-in, native, no dependency needed |
| Smart thumbnails | Sharp `withoutEnlargement` + metadata check | Already have Sharp, code change only |

---

## Existing Stack (No Changes)

The following are already in place and support both v1.1 and v1.2:

| Component | Version | Purpose |
|-----------|---------|---------|
| Vue 3 | ^3.5.13 | Frontend framework |
| TypeScript | ^5.7.3 | Type safety |
| Vite | ^6.0.7 | Build tool |
| Element Plus | ^2.9.1 | UI components (includes el-scrollbar) |
| Pinia | ^2.3.0 | State management |
| Vue Router | ^4.5.0 | Routing |
| VueUse | ^12.2.0 | Utilities (useBreakpoints, useScroll) |
| Axios | ^1.7.9 | HTTP client |
| Sass | ^1.83.4 | CSS preprocessing |

---

## Installation Commands

```bash
# v1.2 UI/UX — Required
cd frontend
npm install vue-easy-lightbox

# v1.2 UI/UX — Optional (animations)
npm install @vueuse/motion

# v1.2 UI/UX — Optional (fuzzy search)
npm install fuse.js

# v1.1 — Already installed
npm install @wangeditor/editor @wangeditor/editor-for-vue@next
```

---

## Alternatives Considered

### v1.2 Alternatives

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| vue-easy-lightbox | PhotoSwipe 5 | More setup, requires predefined dimensions, larger bundle |
| vue-easy-lightbox | Enhance existing Lightbox.vue | Time-consuming, no zoom/pan, wheel reinvention |
| Element Plus el-scrollbar | CSS overflow-y | el-scrollbar provides consistent styling across browsers |
| fuse.js | Server-side search | Overkill for admin lists, adds latency |
| @vueuse/motion | CSS transitions only | Less interactive, no spring physics |

### v1.1 Alternatives

| Editor | Pros | Cons | Verdict |
|--------|------|------|---------|
| wangEditor 5 | Chinese docs, Vue 3 native, simple API, 18.3k stars | Less customizable than headless | ✅ Chosen |
| Tiptap | Headless, highly customizable, 35.9k stars | Requires building UI, more complex | Overkill |
| Vue-Quill | Quill wrapper, mature | VueQuill less active, Quill aging | Second choice |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| fast-md5 | Unnecessary dependency | Node.js `crypto` module (built-in) |
| vue-masonry-css | Already have CSS column implementation | Existing MasonshipGrid.vue |
| vuetify/quasar | Already using Element Plus | Element Plus components |
| animate.css | Less control, generic animations | @vueuse/motion or CSS |
| lodash.debounce | VueUse has useDebounceFn | `import { useDebounceFn } from '@vueuse/core'` |
| Tiptap | Overkill for simple studio intro | wangEditor (simpler, better fit) |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| vue-easy-lightbox ^1.19 | Vue 3.3+ | Vue 3 only, Vue 2 has separate package |
| @vueuse/motion ^2.2 | VueUse 12+ | Must match VueUse major version |
| fuse.js ^7.1 | Any framework | Pure JS, framework-agnostic |
| wangEditor ^5.1 | Vue 3.x | Use shallowRef for editor instance |

---

## Bundle Size Impact

| Library | Size (min+gzip) | Impact |
|---------|-----------------|--------|
| vue-easy-lightbox | ~8kb | Low — tree-shakeable |
| @vueuse/motion | ~20kb | Medium — optional |
| fuse.js | ~5kb | Low — optional |
| wangEditor | ~50kb | Medium — already added in v1.1 |

---

## Sources

### v1.2 Sources
- **vue-easy-lightbox** — GitHub (470 stars, 3.6k users, v1.19.0 Mar 2024) — HIGH confidence
- **PhotoSwipe** — Official docs (v5.4.4, v6 in dev) — MEDIUM confidence
- **@vueuse/motion** — Official docs (<20kb, Popmotion-based) — HIGH confidence
- **Element Plus Scrollbar** — Official docs (built-in component) — HIGH confidence
- **Fuse.js** — Official docs (v7.1.0, fuzzy search) — HIGH confidence
- **Existing codebase** — Lightbox.vue, MasonshipGrid.vue, Dashboard.vue analysis — HIGH confidence

### v1.1 Sources
- wangEditor GitHub: https://github.com/wangeditor-team/wangEditor — 18.3k stars, Vue 3 support verified
- wangEditor docs: https://www.wangeditor.com/v5/for-frame.html — Vue 3 integration guide
- Node.js crypto docs: https://nodejs.org/api/crypto.html — MD5 hashing built-in
- Sharp resize docs: https://sharp.pixelplumbing.com/api-resize — `withoutEnlargement` option

---
*Stack research for: Photography Platform (v1.1 + v1.2)*
*Last updated: 2026-03-26*