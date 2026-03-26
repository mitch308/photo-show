# Project Research Summary

**Project:** 摄影工作室作品展示平台 (Photography Studio Portfolio Platform)
**Domain:** Photography Gallery Management — v1.2 UI/UX Improvements
**Researched:** 2026-03-26
**Confidence:** HIGH

---

## Executive Summary

This is a Vue 3-based photography platform with existing v1.0 core functionality and v1.1 enhancements (file deduplication, thumbnails, sharing). The v1.2 milestone focuses on **UI/UX polish and feature completion** rather than new architecture — incremental improvements with minimal risk.

The recommended approach prioritizes fixing the thumbnail display bug first (affects user trust across all components), adding the work detail page (most requested feature for multi-file works), then systematically improving admin UX with filters, responsive layouts, and style consistency. Each improvement follows established patterns already in the codebase.

Key risks center on **breaking existing functionality** while modernizing — particularly around thumbnail fallback logic (works may have 0, 1, or multiple mediaItems), CSS layout changes affecting sidebar, and style migration from plain HTML tables to Element Plus. Prevention requires thorough null-checking and maintaining fallback paths for legacy data.

---

## Key Findings

### Recommended Stack

The platform uses a mature Vue 3 + TypeScript + Vite stack with Element Plus for UI components. For v1.2, the key addition is **vue-easy-lightbox** (^1.19.0) to replace the basic custom Lightbox.vue with a production-ready gallery component supporting zoom, pan, rotate, keyboard navigation, and video.

**Core technologies:**
- **Vue 3 (^3.5.13)** + TypeScript — Composition API with excellent performance
- **Element Plus (^2.9.1)** — UI components including el-scrollbar for sidebar fix
- **vue-easy-lightbox** — Gallery lightbox with zoom/pan/rotate, replaces basic Lightbox.vue
- **Sharp (^0.33)** — Backend image processing (already in place)
- **wangEditor** — Rich text editor for studio intro (added in v1.1)

**Optional additions:**
- **@vueuse/motion** — Animation composables for UI beautification (<20kb)
- **fuse.js** — Client-side fuzzy search for admin filters (~5kb)

### Expected Features

**Must have (table stakes):**
- **Work detail page** — Users expect to see all files in a multi-file work, not just the first image
- **Admin list filters** — Standard CRUD operation: search/filter in Works, Shares, Clients pages
- **Consistent admin styling** — Professional appearance: Shares.vue and Clients.vue use plain `<table>`, should use `el-table` like Works.vue
- **Responsive card layouts** — Mobile/tablet support per project constraints

**Should have (competitive):**
- **Independent sidebar scroll** — Admin navigation stays visible while content scrolls
- **Gallery-style detail view** — Elegant presentation matching photography aesthetic
- **Real-time filter feedback** — Debounced search with instant results

**Defer (v2+):**
- Visual filter chips — Enhanced UX for complex filtering
- Keyboard shortcuts in admin — Power user feature
- Collapsible sidebar — Not needed at current sidebar width

### Architecture Approach

The architecture follows a clean **view-component-store-API** separation. Public pages (Home, About, Share) and admin pages (Dashboard with nested routes) share common components in `gallery/` and `shared/` directories.

**Major components:**
1. **Views layer** — Public (Home, About, Share) + Admin (Works, Shares, Clients, etc.)
2. **Components layer** — `gallery/` (WorkCard, Lightbox, FilterBar), `shared/` (Upload, BatchActionBar), `admin/` (AdminFilterBar - NEW)
3. **State layer** — Pinia stores (gallery, works, clients, share)
4. **API layer** — Axios-based modules (public.ts, works.ts, clients.ts, share.ts)

**Key pattern:** Existing `useUrlFilters` composable and debounce pattern in Clients.vue should be reused for new admin filters.

### Critical Pitfalls

1. **Thumbnail display breaking** — After switching from `work.thumbnailLarge` to `work.mediaItems[0].thumbnailLarge`, works without mediaItems show broken images. Prevention: Create `useWorkThumbnail` composable with fallback chain (mediaItems[0] → legacy thumbnail → filePath).

2. **CSS layout breaking with sidebar scroll** — Adding `overflow-y: auto` without `min-height: 0` on flex child breaks layout, pushing footer off-screen. Prevention: Only `.nav` should scroll with `flex: 1; min-height: 0; overflow-y: auto`.

3. **Filter state lost on navigation** — Vue Router unmounts components, losing local filter state. Prevention: Use URL-based filters via `useUrlFilters` composable (already exists in codebase).

4. **Style inconsistency with Element Plus migration** — Converting plain tables to el-table breaks dark mode if CSS variables aren't mapped. Prevention: Map `--bg-card` → `--el-bg-color`, use cell slots for custom content.

5. **Lightbox not showing all mediaItems** — Current Lightbox.vue only shows `work.filePath`, ignoring additional files. Prevention: Replace with vue-easy-lightbox or refactor to iterate mediaItems.

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Thumbnail Foundation
**Rationale:** Fixes a bug affecting user trust; establishes shared composable that all other phases depend on.
**Delivers:** Correct thumbnail display across all components
**Addresses:** Thumbnail fix from FEATURES.md
**Avoids:** Pitfall #2 — thumbnail breaking with null mediaItems
**New file:** `composables/useWorkThumbnail.ts`

### Phase 2: Work Detail Page
**Rationale:** Highest-value feature; users need to see multi-file works in public gallery.
**Delivers:** New `/work/:id` route showing all mediaItems in a work
**Uses:** vue-easy-lightbox from STACK.md
**Implements:** WorkMediaGallery.vue, WorkInfo.vue, WorkDetail.vue
**Avoids:** Pitfall #5 — lightbox incomplete

### Phase 3: Admin Filters
**Rationale:** Essential for managing growing data; builds on existing debounce pattern.
**Delivers:** Search/filter in Works, Shares, Albums, Tags pages
**Uses:** `useUrlFilters` composable pattern from ARCHITECTURE.md
**Avoids:** Pitfall #3 — filter state lost
**New file:** `components/admin/AdminFilterBar.vue`

### Phase 4: Sidebar & Layout Polish
**Rationale:** Low-risk CSS improvements; improves admin navigation UX.
**Delivers:** Independent sidebar scroll, responsive card layouts
**Uses:** Element Plus el-scrollbar from STACK.md
**Avoids:** Pitfall #1 — CSS layout breaking

### Phase 5: Style Unification
**Rationale:** Visual consistency; converts plain tables to Element Plus.
**Delivers:** Unified styling for Shares.vue and Clients.vue
**Avoids:** Pitfall #4 — style inconsistency with Element Plus migration

### Phase Ordering Rationale

- **Thumbnail first:** Foundation for all other features — WorkCard, Works table, and Lightbox all need this fix
- **Work detail before filters:** More user-visible value, independent of admin improvements
- **Filters before layout:** Admin filters benefit from consistent styling that comes later
- **Layout before style unification:** Sidebar and card fixes establish responsive patterns, then tables are unified

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Work Detail):** May need `/gsd-research-phase` for vue-easy-lightbox integration details, video handling in gallery
- **Phase 5 (Style Unification):** May need research on Element Plus dark mode token mapping

Phases with standard patterns (skip research-phase):
- **Phase 1 (Thumbnail):** Clear fallback logic, no external dependencies
- **Phase 3 (Filters):** Existing debounce and URL filter patterns in codebase
- **Phase 4 (Layout):** CSS-only changes, well-documented patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | vue-easy-lightbox verified with 470+ stars, Element Plus well-documented |
| Features | HIGH | Based on direct codebase analysis and existing patterns |
| Architecture | HIGH | Component structure already established, clear integration points |
| Pitfalls | HIGH | Identified from codebase analysis and Vue.js best practices |

**Overall confidence:** HIGH

### Gaps to Address

- **Video handling in work detail:** vue-easy-lightbox supports video, but integration pattern with existing mediaItems needs verification during Phase 2 planning
- **About page public access:** ROUTER meta `guest: true` flag needed — single-line fix identified, verify during Phase 1
- **Backend filter support:** Works endpoint may need `status`, `albumId`, `tagId` filter params added — verify during Phase 3

---

## Sources

### Primary (HIGH confidence)
- **vue-easy-lightbox** — GitHub (470 stars, 3.6k users, v1.19.0) — Gallery lightbox with zoom/pan
- **Element Plus documentation** — el-table, el-scrollbar, dark mode theming
- **Existing codebase** — Clients.vue (debounce pattern), useUrlFilters.ts (filter pattern), Dashboard.vue (sidebar layout)

### Secondary (MEDIUM confidence)
- **Vue.js Performance Guide** — v-memo patterns, props stability
- **CSS-Tricks** — Sticky sidebar pattern for independent scrolling
- **Sharp documentation** — withoutEnlargement option for smart thumbnails

### Tertiary (LOW confidence)
- **@vueuse/motion docs** — Optional animations, needs validation during beautification

---

## Files Summary

**New files (5):**
- `views/WorkDetail.vue` — Public work detail page
- `components/gallery/WorkMediaGallery.vue` — Media grid component
- `components/gallery/WorkInfo.vue` — Info panel component
- `components/admin/AdminFilterBar.vue` — Reusable admin filter
- `composables/useWorkThumbnail.ts` — Shared thumbnail logic

**Modified files (8):**
- `router/index.ts` — Add work detail route, fix About meta
- `components/gallery/WorkCard.vue` — Thumbnail fix
- `components/gallery/Lightbox.vue` — Replace with vue-easy-lightbox
- `views/admin/Works.vue` — Thumbnail fix, add filters
- `views/admin/Dashboard.vue` — Sidebar scroll
- `views/admin/Settings.vue` — Card responsive width
- `views/admin/Shares.vue` — Convert to el-table, style unification
- `views/admin/Clients.vue` — Convert to el-table, style unification

---

*Research completed: 2026-03-26*
*Ready for roadmap: yes*