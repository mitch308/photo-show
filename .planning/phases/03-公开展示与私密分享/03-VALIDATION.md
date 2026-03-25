---
phase: 03
slug: 公开展示与私密分享
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (frontend) + Vitest (backend) |
| **Config file** | `frontend/vitest.config.ts`, `backend/vitest.config.ts` |
| **Quick run command** | `npm run test -- --run` (in respective directory) |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run` in affected directory
- **After every plan wave:** Run full suite in both frontend and backend
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PUBL-01, PUBL-05 | unit | `backend: npm test -- --run publicRoutes` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PUBL-02, PUBL-03 | unit | `backend: npm test -- --run filterSearch` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | PRIV-01, PRIV-02 | unit | `backend: npm test -- --run shareService` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | PRIV-03, PRIV-04 | unit | `backend: npm test -- --run shareRoutes` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | PUBL-01~07 | unit | `frontend: npm test -- --run MasonryGrid` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 3 | PUBL-06 | unit | `frontend: npm test -- --run Lightbox` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 4 | PRIV-03, PRIV-04 | unit | `frontend: npm test -- --run SharePage` | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 4 | PUBL-07 | e2e | `playwright test --grep mobile` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

### Backend Tests

- [ ] `backend/src/__tests__/routes/public.test.ts` — Public API tests (PUBL-01~04)
- [ ] `backend/src/__tests__/services/shareService.test.ts` — Share token tests (PRIV-01~04)
- [ ] `backend/src/__tests__/routes/share.test.ts` — Share API tests

### Frontend Tests

- [ ] `frontend/src/components/gallery/__tests__/MasonryGrid.test.ts` — Masonry layout tests
- [ ] `frontend/src/components/gallery/__tests__/Lightbox.test.ts` — Lightbox interaction tests
- [ ] `frontend/src/views/__tests__/Home.test.ts` — Home page integration tests
- [ ] `frontend/src/views/__tests__/Share.test.ts` — Share page tests

### Test Utilities

- [ ] `frontend/src/test-utils.ts` — Vue Test Utils setup
- [ ] `backend/src/__tests__/setup.ts` — Test database setup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 瀑布流视觉效果 | PUBL-05 | Visual regression | 1. Load home page 2. Verify masonry layout 3. Check responsive breakpoints |
| 移动端触控交互 | PUBL-07 | Touch simulation unreliable | 1. Open on mobile device 2. Swipe lightbox 3. Verify touch targets |
| 链接过期提示 | PRIV-02 | Time-dependent | 1. Create link with 1-day expiry 2. Wait or modify Redis TTL 3. Verify error message |

---

## Test Cases Summary

### Backend Unit Tests

```typescript
// public.test.ts - PUBL-01~04
describe('Public API', () => {
  it('GET /api/public/works returns paginated works', async () => {});
  it('GET /api/public/works filters by albumId', async () => {});
  it('GET /api/public/works filters by tagId', async () => {});
  it('GET /api/public/works searches by title', async () => {});
  it('GET /api/public/works only returns isPublic=true', async () => {});
});

// shareService.test.ts - PRIV-01~04
describe('ShareService', () => {
  it('generateShareToken returns 43-char base64url', async () => {});
  it('createShareToken stores in Redis with TTL', async () => {});
  it('validateToken returns workIds for valid token', async () => {});
  it('validateToken returns null for expired token', async () => {});
  it('revokeToken removes token from Redis', async () => {});
});

// shareRoutes.test.ts
describe('Share API', () => {
  it('GET /api/share/:token returns works', async () => {});
  it('GET /api/share/:token/download/:workId returns file', async () => {});
  it('GET /api/share/:token/download/:workId rejects unauthorized workId', async () => {});
});
```

### Frontend Unit Tests

```typescript
// MasonryGrid.test.ts - PUBL-05
describe('MasonryGrid', () => {
  it('renders items in grid layout', async () => {});
  it('applies correct row span based on image height', async () => {});
  it('lazy loads images', async () => {});
  it('loads more on scroll', async () => {});
});

// Lightbox.test.ts - PUBL-06
describe('Lightbox', () => {
  it('opens on image click', async () => {});
  it('navigates with arrows', async () => {});
  it('closes on escape key', async () => {});
  it('shows work info', async () => {});
});

// useUrlFilters.test.ts - D-05
describe('useUrlFilters', () => {
  it('reads filters from URL on mount', async () => {});
  it('updates URL when filters change', async () => {});
});
```

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending