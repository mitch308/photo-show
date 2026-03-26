---
phase: 15-后台筛选
plan: 02
subsystem: backend-filtering
tags: [albums, filtering, search, admin]
requires: []
provides: [AUX-02]
affects: [Albums.vue, albums.ts, albumService.ts]
tech-stack:
  added: [name LIKE search, 300ms debounce]
  patterns: [watch with debounce, query builder filtering]
key-files:
  created: []
  modified:
    - backend/src/routes/albums.ts
    - backend/src/services/albumService.ts
    - frontend/src/api/albums.ts
    - frontend/src/views/admin/Albums.vue
decisions:
  - Use 300ms debounce for search to avoid frequent API calls
  - Name search uses LIKE for fuzzy matching
metrics:
  duration: 3min
  tasks: 2
  files: 4
commits:
  - 2696ddc: feat(15-02): add albums filtering with name search
---

# Phase 15 Plan 02: Albums Filtering Summary

Implemented albums management page filtering with name search.

## What Was Built

### Backend
- Extended `GET /api/albums` to support `name` query parameter
- Added name LIKE search for fuzzy matching using queryBuilder

### Frontend
- Added search input in Albums.vue page header
- Implemented 300ms debounce for search input
- Updated albumsApi.getAlbums to support name parameter

## One-liner

Albums management page now supports name search with fuzzy matching and 300ms debounce.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] Backend build passes
- [x] Frontend build passes
- [x] Search box visible in Albums.vue
- [x] 300ms debounce implemented

## Success Criteria Met

- [x] 管理员可以在相册管理页面看到名称搜索框
- [x] 输入名称后 300ms 自动搜索，结果正确
- [x] 搜索时显示加载状态（loading ref）

## Self-Check: PASSED

- [x] backend/src/routes/albums.ts contains name query param
- [x] backend/src/services/albumService.ts contains name LIKE filter
- [x] frontend/src/views/admin/Albums.vue contains search box
- [x] Commit exists: 2696ddc