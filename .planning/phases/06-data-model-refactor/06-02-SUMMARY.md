---
phase: 06-data-model-refactor
plan: 06-02
subsystem: backend
tags: [service, media-items, crud, batch-upload]
requires: [06-01]
provides: [MediaItemService, media-items-crud, batch-upload]
affects: [workService, uploadService, publicService]
tech-stack:
  added: [mediaItemService]
  patterns: [repository-pattern, cascade-delete]
key-files:
  created:
    - backend/src/services/mediaItemService.ts
  modified:
    - backend/src/services/workService.ts
    - backend/src/services/uploadService.ts
    - backend/src/services/publicService.ts
decisions:
  - MediaItemService handles CRUD for media items with position ordering
  - WorkService creates work with optional media items array
  - UploadService supports batch processing with error collection
  - PublicService uses first media item as cover for works and albums
metrics:
  duration: 10m
  completed: 2026-03-25
  tasks: 4
  files: 4
---

# Phase 6 Plan 2: Backend Service Updates Summary

Implemented backend services to support the new Work → MediaItem structure.

## One-liner

Created MediaItemService with CRUD operations, updated WorkService/UploadService/PublicService to support multiple media items per work.

## Tasks Completed

### Task 1: Create MediaItemService ✅

Created `backend/src/services/mediaItemService.ts` with:
- `createMediaItem(workId, data)` - Create media item for a work
- `getMediaItemsByWork(workId)` - Get all media items sorted by position
- `getMediaItemById(id)` - Get single media item
- `updateMediaItem(id, data)` - Update media item (position)
- `deleteMediaItem(id)` - Delete with associated files
- `reorderMediaItems(workId, itemIds)` - Reorder items within work
- `deleteMediaItemsByWork(workId)` - Delete all items for a work

### Task 2: Update WorkService ✅

Updated `backend/src/services/workService.ts`:
- Added `MediaItemInput` interface for media item creation
- Extended `CreateWorkData` with optional `mediaItems` array
- Updated `createWork` to accept and create media items
- Updated `getWorks` to include and sort media items
- Updated `getWorkById` to include media items with ordering
- Updated `deleteWork` to delete all media items first

### Task 3: Update UploadService ✅

Updated `backend/src/services/uploadService.ts`:
- Added `processFile(file)` - Auto-detect file type and process
- Added `uploadMultipleFiles(files)` - Batch processing with error collection
- Added `isImageFile()` and `isVideoFile()` helper functions
- Returns `MultipleUploadResult` with results and errors

### Task 4: Update PublicService ✅

Updated `backend/src/services/publicService.ts`:
- `getPublicWorks` - Include media items relation, sorted by position
- `searchPublicWorks` - Include media items relation
- `getPublicWorkById` - Include media items with ordering
- `getPublicAlbums` - Use first media item of first work as cover

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Changes |
|------|---------|
| `mediaItemService.ts` | New file - full CRUD service |
| `workService.ts` | Added media items support |
| `uploadService.ts` | Added batch upload methods |
| `publicService.ts` | Added media items to responses |

## Commits

1. `d097413` - feat(06-02): create MediaItemService with CRUD operations
2. `1cc36cd` - feat(06-02): update WorkService to support media items
3. `ec8152c` - feat(06-02): add batch upload support to UploadService
4. `b2f1e08` - feat(06-02): update PublicService to include media items

## Verification

- [x] TypeScript compiles without errors
- [x] Backend builds successfully
- [x] All services follow existing patterns

## Next Steps

- Plan 06-03: API Routes for Media Items
- Plan 06-04: Frontend Media Management
- Plan 06-05: Migration Script