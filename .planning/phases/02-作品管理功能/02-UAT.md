---
status: testing
phase: 02-作品管理功能
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md
started: 2026-03-25T03:10:00Z
updated: 2026-03-25T03:10:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  1. Start the backend: `cd backend && npm run dev`
  2. Start the frontend: `cd frontend && npm run dev`
  3. Backend should start without errors on port 3001 (or configured port)
  4. Frontend should start without errors on port 5173
  5. Health check at http://localhost:3001/api/health returns {"status":"ok"}
  6. Frontend loads at http://localhost:5173
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: |
  Start backend and frontend from scratch. Backend boots without errors, health check returns OK, frontend loads in browser.
result: [pending]

### 2. Admin Login
expected: |
  Navigate to http://localhost:5173/login. Enter admin credentials. Should redirect to /admin dashboard. Login state persists on page refresh.
result: [pending]

### 3. Navigate to Works Page
expected: |
  From admin sidebar, click "作品管理". Should navigate to /admin/works and show a table with works list (empty initially is fine).
result: [pending]

### 4. Upload Image - Drag & Drop
expected: |
  On Works page, click "上传作品". Drag an image file (jpg/png/webp) into the upload zone. Progress bar should appear during upload. After success, form dialog appears with title pre-filled from filename.
result: [pending]

### 5. Upload Image - Click to Select
expected: |
  Click the upload zone to open file picker. Select an image. Same progress and form dialog behavior as drag & drop.
result: [pending]

### 6. Upload Video
expected: |
  Upload a video file (mp4/webm). Progress bar shows, then form dialog appears. Video thumbnail should be generated (check that thumbnailSmall field is populated in the form data).
result: [pending]

### 7. Create Work with Metadata
expected: |
  Fill in the work form: title, description, select albums/tags, toggle isPublic and isPinned. Click "创建". Work appears in the table with correct thumbnail, title, type, and status badges.
result: [pending]

### 8. Edit Work
expected: |
  Click "编辑" on a work in the table. Dialog opens with current values pre-filled. Change title or toggle settings. Save. Changes reflect in the table.
result: [pending]

### 9. Delete Work with Confirmation
expected: |
  Click "删除" on a work. Confirmation dialog appears with message "确定要删除作品「{title}」吗？此操作不可恢复。". Confirm to delete. Work is removed from table.
result: [pending]

### 10. Albums CRUD
expected: |
  Navigate to Albums page (/admin/albums). Create new album with name and description. Album appears in table. Edit album. Delete album - should offer option to delete works or just unlink.
result: [pending]

### 11. Tags CRUD
expected: |
  Navigate to Tags page (/admin/tags). Create new tag. Tag appears in table. Create duplicate tag name - should show error "Tag already exists". Edit tag. Delete tag.
result: [pending]

### 12. Navigation Links
expected: |
  All sidebar links work: 概览, 作品管理, 相册管理, 标签管理. Each link navigates to correct page and highlights active state.
result: [pending]

### 13. Unauthenticated Access Blocked
expected: |
  Logout. Try to access /admin/works directly. Should redirect to login page.
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0
blocked: 0

## Gaps

[none yet]