---
phase: 07
slug: bug
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (frontend) / vitest (backend) |
| **Config file** | frontend/vitest.config.ts, backend/vitest.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run && cd ../frontend && npm test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npm test -- --run`
- **After every plan wave:** Run full suite (backend + frontend)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | BUG-01 | unit | `grep -l "SystemSettings" backend/src/models/SystemSettings.ts` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | BUG-01 | unit | `grep -E "(getWatermarkConfig|setWatermarkConfig)" backend/src/services/settingsService.ts` | ✅ | ⬜ pending |
| 07-01-03 | 01 | 1 | BUG-01 | unit | `grep -E "(settingsService|addWatermark)" backend/src/services/uploadService.ts` | ✅ | ⬜ pending |
| 07-01-04 | 01 | 1 | BUG-01 | integration | `grep -E "(settingsRoutes|/api/settings)" backend/src/app.ts` | ✅ | ⬜ pending |
| 07-01-05 | 01 | 1 | BUG-01 | e2e | `ls frontend/src/views/admin/Settings.vue` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 1 | BUG-02 | integration | `grep -E "(window.location|createElement.*a)" frontend/src/stores/share.ts` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 1 | BUG-02 | e2e | `grep -E "mediaItems|downloadMediaItem" frontend/src/views/Share.vue` | ✅ | ⬜ pending |
| 07-02-03 | 02 | 1 | BUG-02 | e2e | `grep -E "ElMessage|expired" frontend/src/views/Share.vue` | ✅ | ⬜ pending |
| 07-03-01 | 03 | 1 | BUG-03 | unit | `grep -A2 "increment.*viewCount" backend/src/services/publicService.ts` | ✅ | ⬜ pending |
| 07-03-02 | 03 | 1 | BUG-03 | integration | `grep -E "getWork|public/works" frontend/src/views/Home.vue` | ✅ | ⬜ pending |
| 07-03-03 | 03 | 1 | BUG-03 | integration | `grep -E "accessLogService|recordAccess" backend/src/routes/share.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/__tests__/services/settingsService.test.ts` — tests for watermark config
- [ ] `backend/src/__tests__/routes/settings.test.ts` — API endpoint tests
- [ ] `frontend/src/__tests__/stores/share.test.ts` — download logic tests
- [ ] `frontend/src/__tests__/views/Home.test.ts` — view count tracking tests

*Note: Existing test infrastructure in place. Wave 0 adds specific test files for new code.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Watermark visible on thumbnails | BUG-01 | Visual verification | 1. Enable watermark in settings 2. Upload image 3. Check thumbnail has watermark 4. Download original - no watermark |
| File download triggers browser save | BUG-02 | Browser behavior | 1. Create share link 2. Open in browser 3. Click download 4. Verify file saves, not JSON |
| View count increments on detail view | BUG-03 | E2E timing | 1. Record viewCount 2. Open gallery 3. Click work detail 4. Check viewCount incremented |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

*Validation strategy created: 2026-03-26*