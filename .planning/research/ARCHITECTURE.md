# Architecture Research: v1.2 UI/UX Improvements

**Domain:** Photography Studio Platform - v1.2 UI/UX Optimization
**Researched:** 2026-03-26
**Confidence:** HIGH (based on existing codebase analysis)

## Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (Vue 3)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │   Public Views   │  │   Admin Views    │  │   Shared Views   │       │
│  │   Home.vue       │  │   Dashboard.vue  │  │   Share.vue      │       │
│  │   About.vue      │  │   Works.vue      │  │   AlbumShare.vue │       │
│  │                  │  │   Shares.vue     │  │                  │       │
│  │                  │  │   Clients.vue    │  │                  │       │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘       │
│           │                     │                     │                  │
├───────────┴─────────────────────┴─────────────────────┴──────────────────┤
│                          Components Layer                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐   │
│  │  gallery/           │  │  shared/            │  │  admin/         │   │
│  │  - MasonryGrid      │  │  - Upload           │  │  (inline in    │   │
│  │  - WorkCard         │  │  - BatchActionBar   │  │   views)        │   │
│  │  - FilterBar        │  │  - AccessLogDialog  │  │                 │   │
│  │  - Lightbox         │  │                     │  │                 │   │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                          State Management (Pinia)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ gallery    │  │ works      │  │ clients    │  │ share      │         │
│  │ store      │  │ store      │  │ store      │  │ store      │         │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│                          API Layer                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ public.ts  │  │ works.ts   │  │ clients.ts │  │ share.ts   │         │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Integration Points for UI/UX Improvements

### 1. Work Detail Page (New Feature)

**Current State:** 
- Home.vue uses Lightbox component for work preview
- No dedicated work detail page exists
- Lightbox shows single image from `work.filePath`

**Required Changes:**

| Component | Status | Integration Point |
|-----------|--------|-------------------|
| `views/WorkDetail.vue` | **NEW** | New route `/work/:id` |
| `components/gallery/WorkMediaGallery.vue` | **NEW** | Display all mediaItems |
| `components/gallery/WorkInfo.vue` | **NEW** | Work metadata, tags, description |
| Router | **MODIFY** | Add new route in `router/index.ts` |
| `public.ts` API | **EXISTS** | `getWork(id)` already available |

**Data Flow:**
```
User clicks work card
    ↓
Navigate to /work/:id
    ↓
WorkDetail.vue created
    ↓
Call publicApi.getWork(id)
    ↓
Render WorkMediaGallery + WorkInfo
```

### 2. Thumbnail Display Fix

**Current Implementation (WorkCard.vue:14-15):**
```vue
<img :src="`/${work.thumbnailLarge}`" />
```

**Problem:** Uses deprecated `work.thumbnailLarge` instead of first `mediaItem`

**Solution Pattern:**
```typescript
// Computed thumbnail helper
function getWorkThumbnail(work: Work): string {
  // Priority: first mediaItem > legacy thumbnail
  if (work.mediaItems?.length && work.mediaItems[0].thumbnailLarge) {
    return work.mediaItems[0].thumbnailLarge;
  }
  return work.thumbnailLarge || work.thumbnailSmall || '';
}
```

**Files to Modify:**

| File | Change | Complexity |
|------|--------|------------|
| `WorkCard.vue` | Add thumbnail computed property | Low |
| `MasonryGrid.vue` | Pass work to WorkCard (no change needed) | - |
| `admin/Works.vue` | Table thumbnail column (line 449-455) | Low |
| `Lightbox.vue` | Preview image (line 73) | Low |

### 3. Filter Component Integration

**Current State:**
- Public gallery: FilterBar component exists in `components/gallery/`
- Admin pages: No reusable filter component (each page implements own)

**Existing FilterBar Pattern:**
```
FilterBar.vue
├── Uses useGalleryStore
├── Syncs with URL via useUrlFilters composable
├── Supports: albumId, tagId, search filters
└── Responsive: mobile toggle, desktop inline
```

**Admin Pages Needing Filters:**

| Page | Current Filter | Recommended Pattern |
|------|----------------|---------------------|
| Works.vue | None | Create AdminFilterBar component |
| Albums.vue | None | Reuse AdminFilterBar |
| Tags.vue | None | Reuse AdminFilterBar |
| Shares.vue | None | Reuse AdminFilterBar |
| Clients.vue | Search input only | Extend AdminFilterBar |

**New Component Structure:**
```
components/
├── admin/
│   └── AdminFilterBar.vue  (NEW - reusable admin filter)
└── gallery/
    └── FilterBar.vue       (EXISTS - public gallery)
```

### 4. Admin Layout Improvements

**Current Dashboard.vue Structure:**
```
.admin-layout (flex, min-height: 100vh)
├── .sidebar (width: 220px, fixed)
│   ├── .logo
│   ├── .nav (flex: 1)
│   └── .sidebar-footer
└── .main (flex: 1, overflow-y: auto)
    └── <router-view />
```

**Issue: Sidebar doesn't scroll independently**

**Fix Pattern:**
```css
.sidebar {
  height: 100vh;
  overflow-y: auto;  /* Add independent scroll */
  position: sticky;
  top: 0;
}
```

### 5. Settings Card Responsive Width

**Current (Settings.vue:374-376):**
```css
.settings-card {
  max-width: 600px;  /* Fixed width */
}
```

**Responsive Pattern:**
```css
.settings-card {
  max-width: 600px;
  width: 100%;  /* Allow shrinking */
}
```

### 6. Shares & Clients Style Unification

**Current Differences:**

| Aspect | Shares.vue | Clients.vue |
|--------|------------|-------------|
| Page header | `<h1>` | `<h1>` with search |
| Table wrapper | `.shares-list` | `.clients-list` |
| Search input | None | In header |
| Button style | `.btn-primary` | `.btn-primary` |
| Dialog class | `.dialog` | `.dialog` |

**Recommended Shared Styles:**
```css
/* Create shared admin page styles */
.admin-page { padding: 24px; }
.admin-page-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
.admin-table { width: 100%; border-collapse: collapse; background: var(--bg-card); }
```

## Component Organization

### Recommended Structure for New Components

```
frontend/src/
├── views/
│   ├── WorkDetail.vue          (NEW - public work detail)
│   └── admin/
│       └── (existing files)
├── components/
│   ├── admin/
│   │   └── AdminFilterBar.vue  (NEW - reusable admin filter)
│   └── gallery/
│       ├── WorkCard.vue        (MODIFY - thumbnail fix)
│       ├── Lightbox.vue        (MODIFY - thumbnail fix)
│       ├── WorkMediaGallery.vue (NEW - detail page media grid)
│       └── WorkInfo.vue        (NEW - detail page info panel)
└── composables/
    └── useWorkThumbnail.ts     (NEW - shared thumbnail logic)
```

## Data Model Reference

### Work Type (from types.ts:56-82)

```typescript
interface Work {
  id: string;
  title: string;
  description: string;
  // Legacy single-file fields (deprecated)
  filePath: string;
  thumbnailSmall?: string | null;
  thumbnailLarge?: string | null;
  // New multi-media support
  mediaItems?: MediaItem[];  // First item = representative thumbnail
  // ... other fields
}

interface MediaItem {
  id: string;
  workId: string;
  filePath: string;
  thumbnailSmall?: string | null;
  thumbnailLarge?: string | null;
  position: number;
  // ... other fields
}
```

### Thumbnail Priority Logic

```
1. work.mediaItems[0].thumbnailLarge (if mediaItems exist)
2. work.thumbnailLarge (legacy fallback)
3. work.thumbnailSmall (last resort)
```

## Router Integration

### Current Route Structure

```typescript
// router/index.ts
routes: [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About },  // No guest meta!
  { path: '/login', name: 'Login', component: Login, meta: { guest: true } },
  { 
    path: '/admin', 
    meta: { requiresAuth: true },
    children: [...] 
  },
]
```

### Required Changes

**1. About Page Auth Bypass:**
```typescript
{
  path: '/about',
  name: 'About',
  component: About,
  meta: { guest: true },  // ADD: Allow access when logged in
}
```

**2. New Work Detail Route:**
```typescript
{
  path: '/work/:id',
  name: 'WorkDetail',
  component: () => import('@/views/WorkDetail.vue'),
  meta: { title: '作品详情' },
}
```

## Build Order (Dependency-Aware)

### Phase 1: Foundation (No Dependencies)
1. **useWorkThumbnail composable** - Shared thumbnail logic
2. **About route meta fix** - Single line change in router

### Phase 2: Thumbnail Fixes (Depends on Phase 1)
3. **WorkCard.vue** - Use thumbnail composable
4. **admin/Works.vue** - Table thumbnail fix
5. **Lightbox.vue** - Image source fix

### Phase 3: New Features (Can Parallel with Phase 2)
6. **WorkDetail.vue** - New page
7. **WorkMediaGallery.vue** - Media grid component
8. **WorkInfo.vue** - Info panel component

### Phase 4: Admin Improvements
9. **AdminFilterBar.vue** - Reusable filter
10. **Dashboard.vue** - Sidebar scroll fix
11. **Settings.vue** - Card responsive width

### Phase 5: Style Unification
12. **Shares.vue & Clients.vue** - Unify styles

## Anti-Patterns to Avoid

### 1. Duplicating Thumbnail Logic
**Wrong:** Inline thumbnail selection in each component
**Right:** Single `useWorkThumbnail` composable

### 2. Deep Prop Drilling
**Wrong:** Pass work through 3+ component levels
**Right:** Use provide/inject or direct store access

### 3. Inconsistent Filter Patterns
**Wrong:** Each admin page implements own filter UI
**Right:** Single `AdminFilterBar` component

### 4. Fixed-Width Layouts
**Wrong:** `width: 600px`
**Right:** `max-width: 600px; width: 100%`

## API Endpoints (Existing - No Changes Needed)

| Endpoint | Purpose | Used By |
|----------|---------|---------|
| `GET /public/works/:id` | Single work detail | WorkDetail.vue |
| `GET /public/works` | Work list with filters | Home.vue |
| `GET /public/works/:id/view` | Record view count | Lightbox, WorkDetail |

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Thumbnail fix | HIGH | Clear code path, simple change |
| Work detail page | HIGH | Existing patterns in Lightbox, API ready |
| Filter integration | MEDIUM | Need to create new component pattern |
| Admin layout | HIGH | CSS-only fix |
| Style unification | HIGH | CSS refactoring, no logic changes |

## Files Modified Summary

### New Files (5)
- `views/WorkDetail.vue`
- `components/gallery/WorkMediaGallery.vue`
- `components/gallery/WorkInfo.vue`
- `components/admin/AdminFilterBar.vue`
- `composables/useWorkThumbnail.ts`

### Modified Files (8)
- `router/index.ts` - Add work detail route, fix About meta
- `components/gallery/WorkCard.vue` - Thumbnail fix
- `components/gallery/Lightbox.vue` - Thumbnail fix
- `views/admin/Works.vue` - Thumbnail fix, add filters
- `views/admin/Dashboard.vue` - Sidebar scroll
- `views/admin/Settings.vue` - Card width
- `views/admin/Shares.vue` - Style unification
- `views/admin/Clients.vue` - Style unification

## Sources

- Existing codebase analysis: `frontend/src/**/*.vue`, `frontend/src/**/*.ts`
- Vue 3 Composition API documentation
- Element Plus component patterns
- Router navigation guards documentation

---
*Architecture research for: v1.2 UI/UX Improvements*
*Researched: 2026-03-26*