---
phase: 18-作品编辑修复
plan: 01
subsystem: 作品管理
tags: [bugfix, ui, upload, multi-file]
requirements: [EDIT-01, EDIT-02, EDIT-03, EDIT-04]
duration: 3min
completed_date: 2026-03-27
---

# Phase 18 Plan 01: 作品编辑修复 Summary

## One-liner
修复编辑弹窗文件显示问题，统一 UI 布局，实现多文件上传支持

## Overview

修复了作品编辑弹窗的多个关键问题：确保后端更新时返回完整的 mediaItems 数据、统一上传和编辑弹窗的 UI 布局、支持多文件拖拽和选择上传。

## Changes Made

### Backend Changes

**backend/src/services/workService.ts**
- Fixed `updateWork` method to reload work with mediaItems relations after saving
- Changed from returning `workRepo.save(work)` directly to `await workRepo.save(work); return this.getWorkById(id)`
- Ensures edit dialog displays all files including the first one

### Frontend Changes

**frontend/src/components/Upload.vue**
- Added `multiple` attribute to file input element for multi-file selection
- Updated `handleDrop` function to process all dropped files using `Array.from(files).forEach(file => handleUpload(file))`
- Updated `handleFileChange` function to process all selected files

**frontend/src/views/admin/Works.vue**
- Restructured dialog layout: form fields at top, upload area at bottom (consistent for both upload and edit modes)
- Removed `showAddFile` state and `cancelAddFile` function (no longer needed)
- Updated `handleUploadSuccess` to not open dialog (dialog is already open)
- Added `isFirstFile` state to track first file in multi-upload scenario
- Updated `handleUploadSuccess` to process first file and inform user about additional files
- Updated `resetForm` to reset `isFirstFile` state
- Added CSS for `upload-section` and `upload-label` styles

## Requirements Addressed

- **EDIT-01**: 编辑弹窗显示所有已上传的文件，包括第一个文件 ✅
  - Fixed by reloading work with mediaItems relations in backend updateWork method

- **EDIT-02**: 上传和编辑弹窗的文件拖拽区都位于底部 ✅
  - Fixed by restructuring dialog layout to always place upload area at bottom

- **EDIT-03**: 用户可以同时拖拽多个文件到拖拽区 ✅
  - Fixed by updating handleDrop to process all dropped files

- **EDIT-04**: 用户可以通过文件选择器一次性选择多个文件 ✅
  - Fixed by adding multiple attribute to file input and updating handleFileChange

## Key Decisions

1. **Multi-file upload behavior**: First file creates the work, additional files show an informative message that they need to be added via edit dialog after saving. This approach prioritizes simplicity over more complex batch handling.

2. **Upload area positioning**: Always at the bottom of the dialog for both upload and edit modes, providing consistent UX and clear visual hierarchy.

3. **State management**: Removed `showAddFile` toggle state in favor of always-visible upload area, simplifying the component logic.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Files Modified

- backend/src/services/workService.ts (1 function modified)
- frontend/src/components/Upload.vue (3 functions modified, 1 attribute added)
- frontend/src/views/admin/Works.vue (4 functions modified, 1 function removed, layout restructured, 2 CSS classes added)

## Testing Notes

Manual testing should verify:
1. Edit dialog shows all files including the first one
2. Upload area appears at bottom in both upload and edit modes
3. Multiple files can be dragged at once
4. Multiple files can be selected via file picker
5. First file creates work, additional files show appropriate message

## Self-Check: PASSED

All commits verified:
- f311dca: fix(18-01): reload work with mediaItems after update
- 3184d14: feat(18-01): add multiple file support to Upload component
- 5b2b562: refactor(18-01): reorganize Works.vue dialog layout for UI consistency
- d3b02d9: feat(18-01): handle multiple file uploads in Works.vue

All files verified:
- backend/src/services/workService.ts
- frontend/src/components/Upload.vue
- frontend/src/views/admin/Works.vue
- .planning/phases/18-作品编辑修复/18-01-SUMMARY.md