# Project Research Summary

**Project:** 摄影工作室作品展示平台 (Photography Studio Portfolio Platform)
**Domain:** Photo Gallery Platform — v1.1 Enhancement Features
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

This is an enhancement phase for an existing v1.0 photo gallery platform. The system already has a solid foundation with Vue 3 + TypeScript + Vite frontend, Node.js + Express + TypeORM backend, MySQL for persistence, and Redis for sessions/share tokens. The v1.1 focus is on fixing critical bugs (watermark, download, view count), optimizing storage (MD5 deduplication, smart thumbnails), and adding quality-of-life features (studio introduction, album sharing).

The recommended approach follows a dependency-aware build order: start with bug fixes and low-risk enhancements (view count, admin link), then optimize core systems (file storage, thumbnails), and finally add new features (studio intro, album sharing). The existing codebase is well-structured with clear service layers, making integration straightforward.

Key risks center on concurrent file operations (MD5 deduplication race conditions), security in rich text handling (XSS prevention), and data integrity (orphaned files, deleted works with active shares). Each has documented prevention strategies that should be implemented during their respective phases.

## Key Findings

### Recommended Stack

**No major stack changes required** — this is an enhancement of an existing v1.0 system. Core technologies remain: Vue 3.5, Element Plus 2.9, Sharp 0.34.5, TypeORM 0.3, Express 4.21, MySQL 8.0, Redis 7.2.

**New dependencies for v1.1:**
- **@wangeditor/editor + @wangeditor/editor-for-vue** — Rich text editor for studio introduction page. Chosen for Vue 3 native support, Chinese documentation, and lightweight footprint (18.3k stars, active maintenance).
- **Node.js crypto module (built-in)** — MD5 hash computation for file deduplication. No new dependency needed; `createHash('md5')` is native.

**Database schema changes:**
- New `studio_settings` table for configurable studio info (name, logo, introduction, contact)
- Add `md5_hash` column to `media_items` with unique index for deduplication queries

### Expected Features

**P1 — Must have (bug fixes + core optimizations):**
- Bug: Watermark integration — photographers' work is unprotected without it
- Bug: Download returns file — core functionality broken for private shares
- Bug: View count increment — statistics inaccurate
- MD5 deduplication — storage optimization, prevents duplicate files
- Smart thumbnail generation — performance optimization for small images
- Work file info display — basic UX improvement (file size, count)

**P2 — Should have (enhanced functionality):**
- Admin link to frontend — quick navigation improvement
- Work file management (add/remove files from existing works)
- Album-level private sharing — extend existing share system

**P3 — Defer to later:**
- Studio introduction page — new feature area, requires design decisions
- Retroactive deduplication — complex migration, risk of breaking references
- Full CMS for studio pages — scope creep for single-purpose gallery

### Architecture Approach

The existing architecture follows a clean three-tier pattern: Frontend (Vue 3 SPA with Pinia stores) → Backend (Express routes → services → TypeORM models) → Data (MySQL + Redis + Local filesystem). No architectural changes needed for v1.1 features.

**Major components affected:**

1. **uploadService + imageService** — Add MD5 hash computation, smart thumbnail logic, watermark integration
2. **shareService** — Extend ShareTokenData to support `albumId` alongside `workIds`
3. **StudioSettings (NEW model)** — Singleton pattern for studio configuration with rich text introduction
4. **Admin routes + views** — New settings page, enhanced share creation UI

**Key integration patterns:**
- Use streaming MD5 computation for large files (avoid blocking event loop)
- Use Sharp's `withoutEnlargement: true` for smart thumbnails
- Sanitize rich text on both frontend (display) and backend (storage)
- Reference counting for deduplicated files before deletion

### Critical Pitfalls

1. **MD5 Deduplication Race Condition** — Two simultaneous uploads of the same file create duplicates. Use file locking or atomic temp-file-rename pattern, store hash in DB with unique constraint.

2. **XSS in Studio Introduction** — Rich text editors allow arbitrary HTML. Sanitize with DOMPurify (frontend) and sanitize-html (backend), whitelist allowed tags, strip ALL event handlers.

3. **Orphaned Files on Transaction Failure** — Files uploaded but DB transaction fails. Use staging pattern: upload to temp, move to final only after DB commit, implement periodic cleanup job.

4. **Thumbnail Upscaling** — Small images enlarged to 300px waste storage and reduce quality. Check dimensions with `sharp.metadata()`, use `withoutEnlargement: true`, skip generation for images below threshold.

5. **Share Token Points to Deleted Work** — Share links show confusing errors. Filter invalid works at load time, show clear "work no longer available" message, consider soft-delete for works with active shares.

## Implications for Roadmap

Based on dependency analysis and risk mitigation, suggested phase structure:

### Phase 1: Bug Fixes & Quick Wins
**Rationale:** Address broken functionality before adding features. These are low-risk, high-value fixes that users expect to work.
**Delivers:** Functional watermark, working downloads, accurate view counts, admin navigation
**Addresses:** Watermark integration (P1), Download returns file (P1), View count (P1), Admin link (P2)
**Avoids:** Users losing trust in platform reliability

### Phase 2: File Storage Optimization
**Rationale:** Storage optimizations benefit all future uploads. Complete before file management features to ensure consistent behavior.
**Delivers:** MD5 deduplication, smart thumbnails, storage savings, consistent thumbnail quality
**Uses:** Node.js crypto (built-in), Sharp `withoutEnlargement` option
**Avoids:** Duplicate files wasting storage, upscaled thumbnails degrading quality, orphaned files from failed uploads

### Phase 3: Work File Management Enhancement
**Rationale:** Builds on Phase 2's deduplication system. Users need to manage files in existing works without recreating.
**Delivers:** Add/remove files from existing works, file info display, last-item validation
**Uses:** Existing MediaItemService, enhanced upload flow from Phase 2
**Implements:** Work file info display (P1), Work file management UI (P2)
**Avoids:** Empty works from deleting last item, orphaned file references

### Phase 4: Studio Introduction Page
**Rationale:** New feature area independent of core upload/display flow. Requires new model and admin UI.
**Delivers:** Configurable studio info page, rich text introduction, contact information display
**Uses:** @wangeditor/editor-for-vue, new StudioSettings model
**Implements:** Studio introduction page (P3)
**Avoids:** XSS vulnerabilities through strict sanitization, CMS over-engineering through simple single-page approach

### Phase 5: Album-Level Private Sharing
**Rationale:** Extends existing share system. More complex UI changes and requires careful handling of album-work relationships.
**Delivers:** Share entire albums via single link, share creation UI for albums
**Uses:** Extended ShareTokenData, existing share infrastructure
**Implements:** Album-level sharing (P2)
**Avoids:** Stale share data by fetching works dynamically, confusing UX when shared works are deleted

### Phase Ordering Rationale

- **Phase 1 first:** Bug fixes establish trust; broken features undermine all other work
- **Phase 2 before 3:** File management depends on consistent deduplication behavior
- **Phases 1, 2, 4, 5 parallel-capable:** No dependencies between these tracks
- **Phase 3 depends on 2:** File management adds to existing deduplication flow
- **Phase 4 and 5 independent:** Can be developed by different team members simultaneously

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** MD5 deduplication edge cases (concurrent uploads, video files, cleanup strategy)
- **Phase 4:** Rich text sanitization library selection and configuration, XSS test cases
- **Phase 5:** Album-work relationship edge cases (album deleted, work removed from album)

Phases with standard patterns (skip research-phase):
- **Phase 1:** Bug fixes with clear implementation paths in existing codebase
- **Phase 3:** MediaItemService already exists, UI follows established patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack already in production; new dependencies well-documented |
| Features | HIGH | Based on existing codebase analysis, clear implementation paths documented |
| Architecture | HIGH | Existing code structure analyzed, integration points mapped, build order defined |
| Pitfalls | HIGH | Each pitfall has specific prevention strategy with code examples |

**Overall confidence:** HIGH

### Gaps to Address

- **Video file handling in deduplication:** Large video files may have slower MD5 computation. Consider progress indication for uploads >50MB.
- **Reference counting for deduplicated files:** Implementation details for "how many works reference this file" not fully specified. Decide: track count in DB, or scan on delete?
- **Album share edge cases:** What happens when a work is removed from an album that has an active share? Dynamic resolution needs test cases.
- **Rich text image upload:** wangEditor supports image upload; need to decide where images are stored and if they need deduplication.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis (`backend/src/**/*.ts`, `frontend/src/**/*.ts`) — All service patterns, routes, models verified
- Sharp documentation (sharp.pixelplumbing.com) — `withoutEnlargement` option, streaming API, metadata extraction
- wangEditor GitHub (github.com/wangeditor-team/wangEditor) — 18.3k stars, Vue 3 integration verified
- Node.js crypto documentation (nodejs.org/api/crypto.html) — MD5 hashing built-in, streaming support
- TypeORM documentation — Entity patterns, relations, migrations

### Secondary (MEDIUM confidence)
- OWASP XSS Prevention Cheat Sheet — Sanitization strategies, stored XSS prevention
- Express streaming patterns — `stream.pipeline()` for proper error handling
- Redis patterns for rate limiting — Session-based view counting with TTL

### Tertiary (LOW confidence)
- Personal experience — Photo gallery platform development patterns (validated against codebase)

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*