# Architecture Research: v1.1 Enhancement Features

**Domain:** Photography Studio Portfolio Platform
**Researched:** 2026-03-26
**Confidence:** HIGH (based on existing codebase analysis)

## Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (Vue 3 SPA)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Views     │  │  Components  │  │    Stores    │  │     API      │    │
│  │  (Pages)     │  │   (UI)       │  │   (Pinia)    │  │   (Axios)    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │            │
│  ┌──────┴─────────────────┴─────────────────┴─────────────────┴───────┐    │
│  │                        Vue Router                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Backend (Express)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Routes    │  │  Middlewares │  │   Services   │  │    Models    │    │
│  │  (Endpoints) │  │  (Auth/      │  │  (Business   │  │  (TypeORM    │    │
│  │              │  │   Upload)    │  │   Logic)     │  │   Entities)  │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │            │
├─────────┴─────────────────┴─────────────────┴─────────────────┴────────────┤
│                              Data Layer                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐      ┌────────────────────────────┐         │
│  │     MySQL 8.0              │      │     Redis 7.2              │         │
│  │  (Persistent Storage)      │      │  (Sessions, Share Tokens)  │         │
│  └────────────────────────────┘      └────────────────────────────┘         │
├─────────────────────────────────────────────────────────────────────────────┤
│                              File Storage                                    │
│  ┌────────────────────────────┐                                              │
│  │     Local Filesystem       │                                              │
│  │  uploads/works/YYYY-MM/    │                                              │
│  └────────────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Existing Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Models** | Database entities with TypeORM decorators | `backend/src/models/*.ts` |
| **Services** | Business logic, data operations | `backend/src/services/*.ts` |
| **Routes** | HTTP endpoints, request handling | `backend/src/routes/*.ts` |
| **Stores** | Frontend state management with Pinia | `frontend/src/stores/*.ts` |
| **API** | HTTP client functions with Axios | `frontend/src/api/*.ts` |
| **Views** | Page-level Vue components | `frontend/src/views/**/*.vue` |

---

## v1.1 Feature Integration Analysis

### Feature 1: MD5-based File Deduplication

**What:** Use file content hash as filename, skip upload if file already exists.

**Integration Points:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  upload.ts      │ ──► │  uploadService  │ ──► │  storage.ts     │
│  (middleware)   │     │  (processing)   │     │  (dedup check)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Changes Required:**

| File | Change Type | Description |
|------|-------------|-------------|
| `backend/src/middlewares/upload.ts` | MODIFY | Compute MD5 hash before saving, use hash as filename |
| `backend/src/services/uploadService.ts` | MODIFY | Add deduplication check logic, return existing file info if duplicate |
| `backend/src/config/storage.ts` | MODIFY | Add MD5 file lookup helper (optional: Redis cache for hash→path mapping) |

**Architecture Pattern:**

```typescript
// New flow in upload middleware
1. Receive file in memory buffer (not disk)
2. Compute MD5 hash using crypto.createHash('md5')
3. Check if file with hash exists in uploads directory
4. If exists: return existing file metadata (skip upload)
5. If not exists: save file with hash as filename, generate thumbnails
```

**Data Model Impact:** None - MediaItem already stores `filePath`. Only file naming convention changes.

**Build Order:** 1 (no dependencies on other features)

---

### Feature 2: Smart Thumbnail Logic

**What:** Skip thumbnail generation if source image is smaller than target thumbnail size.

**Integration Points:**

```
┌─────────────────┐     ┌─────────────────┐
│  uploadService  │ ──► │  imageService   │
│  (orchestrates) │     │  (generates)    │
└─────────────────┘     └─────────────────┘
```

**Changes Required:**

| File | Change Type | Description |
|------|-------------|-------------|
| `backend/src/services/imageService.ts` | MODIFY | Check source dimensions before resize, return source path if smaller |

**Architecture Pattern:**

```typescript
// In imageService.generateThumbnails()
async generateThumbnails(inputPath, outputDir, originalName): Promise<ThumbnailResult> {
  const metadata = await sharp(inputPath).metadata();
  const width = metadata.width;
  
  // Smart logic: if source < 300px, use source for small
  // if source < 1200px, use source for large
  const small = width <= 300 
    ? inputPath 
    : await this.resize(inputPath, outputDir, 300);
    
  const large = width <= 1200 
    ? inputPath 
    : await this.resize(inputPath, outputDir, 1200);
    
  return { small, large };
}
```

**Data Model Impact:** None - thumbnail paths can point to source file.

**Build Order:** 2 (independent, can parallel with Feature 1)

---

### Feature 3: Work File Management (Add/Remove MediaItems)

**What:** Allow adding and removing files from existing works.

**Current State:** Already implemented!
- `POST /api/works/:workId/media` - Add media item
- `DELETE /api/media/:id` - Delete media item
- `POST /api/works/:workId/media/reorder` - Reorder items

**Integration Points:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Works.vue      │ ──► │  worksStore     │ ──► │  mediaItemsApi  │
│  (Admin UI)     │     │  (State)        │     │  (HTTP)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Changes Required:**

| File | Change Type | Description |
|------|-------------|-------------|
| `frontend/src/views/admin/Works.vue` | MODIFY | Add file management UI (upload button, delete button for each media item) |
| `frontend/src/stores/works.ts` | ALREADY EXISTS | Has `addMediaItem`, `deleteMediaItem`, `reorderMediaItems` actions |
| `backend/src/routes/mediaItems.ts` | ALREADY EXISTS | All endpoints exist |

**Build Order:** 3 (depends on Feature 1 for dedup to work with new uploads)

---

### Feature 4: Studio Introduction Page

**What:** Configurable studio info page with rich text content, managed from admin.

**New Architecture:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           New Components                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Backend:                                                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  StudioSettings     │  │  settingsService    │  │  routes/settings    │  │
│  │  (Model)            │  │  (Service)          │  │  (Endpoints)        │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                              │
│  Frontend:                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  About.vue          │  │  Admin/Settings.vue │  │  settingsApi        │  │
│  │  (Public Page)      │  │  (Config UI)        │  │  (HTTP Client)      │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**New Model:**

```typescript
// backend/src/models/StudioSettings.ts
@Entity('studio_settings')
export class StudioSettings {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string; // Singleton - always 'default'
  
  @Column({ type: 'varchar', length: 100 })
  studioName: string;
  
  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string; // Logo image path
  
  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;
  
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;
  
  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;
  
  @Column({ type: 'text', nullable: true })
  introduction: string; // Rich text HTML/Markdown
  
  @Column({ type: 'varchar', length: 500, nullable: true })
  wechatQrcode: string; // WeChat QR code image
  
  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
```

**Changes Required:**

| File | Change Type | Description |
|------|-------------|-------------|
| `backend/src/models/StudioSettings.ts` | NEW | Studio settings entity |
| `backend/src/services/settingsService.ts` | NEW | CRUD for settings (singleton pattern) |
| `backend/src/routes/settings.ts` | NEW | Admin endpoints: GET/PUT /api/admin/settings |
| `backend/src/routes/public.ts` | MODIFY | Add GET /api/public/settings (public info only) |
| `frontend/src/views/About.vue` | NEW | Public studio introduction page |
| `frontend/src/views/admin/Settings.vue` | NEW | Admin settings configuration page |
| `frontend/src/api/settings.ts` | NEW | Settings API client |
| `frontend/src/router/index.ts` | MODIFY | Add /about route |

**Build Order:** 4 (independent feature)

---

### Feature 5: Share Model Extension (share_type: work/album)

**What:** Support sharing both individual works and entire albums via private links.

**Current Architecture:**

```typescript
// Current ShareTokenData in Redis
interface ShareTokenData {
  workIds: string[];      // Only works supported
  expiresAt: number;
  createdAt: number;
  clientId?: string;
  maxAccess?: number;
  accessCount?: number;
}
```

**Extended Architecture:**

```typescript
// Extended ShareTokenData
interface ShareTokenData {
  shareType: 'work' | 'album';  // NEW
  workIds?: string[];           // Required if shareType === 'work'
  albumId?: string;             // Required if shareType === 'album'
  expiresAt: number;
  createdAt: number;
  clientId?: string;
  maxAccess?: number;
  accessCount?: number;
}
```

**Integration Points:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Shares.vue     │ ──► │  shareService   │ ──► │  Redis Storage  │
│  (Admin UI)     │     │  (Token Logic)  │     │  (Share Data)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │
         │                      ▼
         │              ┌─────────────────┐
         └─────────────►│  publicService  │
                        │  (Fetch Works)  │
                        └─────────────────┘
```

**Changes Required:**

| File | Change Type | Description |
|------|-------------|-------------|
| `backend/src/services/shareService.ts` | MODIFY | Add shareType support, albumId field, album share validation |
| `backend/src/routes/admin/share.ts` | MODIFY | Accept shareType and albumId in create request |
| `backend/src/routes/share.ts` | MODIFY | Handle album shares, fetch all works from album |
| `frontend/src/views/admin/Shares.vue` | MODIFY | Add share type selector (work/album), album picker |
| `frontend/src/api/share.ts` | MODIFY | Update CreateShareRequest interface |
| `backend/src/services/accessLogService.ts` | MODIFY | Handle album access logging |

**Data Flow for Album Share:**

```
1. Admin creates share with shareType: 'album', albumId: 'xxx'
2. shareService stores: { shareType: 'album', albumId: 'xxx', ... }
3. Client visits /share/:token
4. Backend validates token, fetches album with all works
5. Returns works from album (with real-time data - album contents may change)
```

**Build Order:** 5 (independent feature)

---

### Feature 6: Admin Frontend Link

**What:** Add link in admin panel to view the public frontend.

**Integration Points:**

```
┌─────────────────┐     ┌─────────────────┐
│  Dashboard.vue  │ ──► │  External Link  │
│  (Admin Layout) │     │  (Frontend URL) │
└─────────────────┘     └─────────────────┘
```

**Changes Required:**

| File | Change Type | Description |
|------|-------------|-------------|
| `frontend/src/views/admin/Dashboard.vue` | MODIFY | Add "View Frontend" link in header/sidebar |

**Build Order:** 6 (simplest feature, no dependencies)

---

## Bug Fixes Integration

### Bug 1: Watermark Not Integrated

**Current State:** `imageService.addWatermark()` exists but is not called in upload flow.

**Fix Location:** `backend/src/services/uploadService.ts`

```typescript
// In processImage(), after thumbnail generation:
if (watermarkOptions) {
  await imageService.addWatermark(filePath, watermarkedPath, watermarkOptions);
}
```

**Requires:** Watermark configuration storage (in StudioSettings model)

### Bug 2: Download Returns JSON Instead of File

**Current State:** `share.ts` download endpoint should stream file. Need to verify headers.

**Fix Location:** `backend/src/routes/share.ts` lines 128-134

**Issue:** Likely `res.setHeader()` conflict or middleware issue.

### Bug 3: View Count Not Incrementing

**Current State:** `workService.incrementDownloadCount()` exists but no `incrementViewCount()`.

**Fix Location:** 
- Add `incrementViewCount()` to `workService.ts`
- Call in `public.ts` when viewing public works
- Call in `share.ts` when viewing shared works

---

## Recommended Build Order

Based on dependencies and complexity:

| Order | Feature | Dependencies | Complexity | Risk |
|-------|---------|--------------|------------|------|
| 1 | Bug Fix: View Count | None | Low | Low |
| 2 | Bug Fix: Download File | None | Low | Low |
| 3 | Feature 6: Admin Frontend Link | None | Low | Low |
| 4 | Feature 2: Smart Thumbnail | None | Medium | Low |
| 5 | Feature 1: MD5 Deduplication | None | Medium | Medium |
| 6 | Feature 3: Work File Management UI | Feature 1 | Medium | Low |
| 7 | Bug Fix: Watermark Integration | Feature 4 (settings) | Medium | Medium |
| 8 | Feature 4: Studio Introduction | None | High | Low |
| 9 | Feature 5: Share Extension | None | High | Medium |

**Parallel Work Opportunities:**
- Features 1, 2, 4, 5, 6 can be developed in parallel
- Feature 3 depends on Feature 1
- Bug fix 7 depends on Feature 4 for settings storage

---

## Database Migration Required

| Feature | Migration | Description |
|---------|-----------|-------------|
| Feature 4 | NEW | `studio_settings` table |
| Feature 5 | NONE | Redis-only, no MySQL changes |
| Feature 1 | NONE | File naming convention only |
| Feature 2 | NONE | Logic change only |

---

## API Endpoints Summary

### New Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/public/settings` | Get public studio info |
| GET | `/api/admin/settings` | Get all studio settings |
| PUT | `/api/admin/settings` | Update studio settings |

### Modified Endpoints

| Method | Path | Changes |
|--------|------|---------|
| POST | `/api/admin/share` | Accept `shareType`, `albumId` |
| GET | `/api/share/:token` | Handle album shares |
| POST | `/api/upload` | Return dedup info, smart thumbnails |

---

## Frontend Routes Summary

### New Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/about` | `About.vue` | Public studio introduction page |

### New Admin Views

| Path | Component | Purpose |
|------|-----------|---------|
| `/admin/settings` | `Settings.vue` | Studio settings configuration |

---

## Anti-Patterns to Avoid

### 1. Storing Album Works in Share Token

**What NOT to do:** Store `workIds` from album in share token at creation time.

**Why:** Albums can change (works added/removed), shares should reflect current state.

**Do instead:** Store `albumId`, fetch works dynamically when share is accessed.

### 2. Duplicating Watermark Code

**What NOT to do:** Add watermark logic in multiple places.

**Why:** Maintenance nightmare, inconsistent behavior.

**Do instead:** Centralize in `imageService.addWatermark()`, call from single point.

### 3. Blocking Upload for MD5 Computation

**What NOT to do:** Compute MD5 synchronously on large files.

**Why:** Blocks event loop, slow uploads.

**Do instead:** Use streaming hash computation:

```typescript
import { createHash } from 'crypto';
import { createReadStream } from 'fs';

async function computeMD5(filePath: string): Promise<string> {
  const hash = createHash('md5');
  const stream = createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}
```

### 4. Not Handling Orphan Files

**What NOT to do:** Delete MediaItem without checking if file is used elsewhere.

**Why:** MD5 dedup means same file may be referenced by multiple MediaItems.

**Do instead:** Reference counting or check file usage before deletion.

---

## Scalability Considerations

| Scale | Consideration |
|-------|---------------|
| 0-1k works | MD5 cache in memory is fine |
| 1k-10k works | Consider Redis cache for MD5→path mapping |
| 10k+ works | Consider dedicated file service, CDN for thumbnails |

### First Bottleneck: Thumbnail Generation

- CPU-bound operation during upload
- Consider queue-based processing for batch uploads
- Current: synchronous processing blocks request

### Second Bottleneck: Share Token Lookup

- Redis SCAN for listing all shares is O(N)
- At 1000+ shares, consider MySQL index for metadata

---

## Sources

- Existing codebase analysis: `backend/src/**/*.ts`, `frontend/src/**/*.ts`
- TypeORM documentation: Entity patterns, relations
- Sharp documentation: Image metadata, resize options
- Redis patterns: Token TTL, SCAN command

---
*Architecture research for: Photography Studio Portfolio Platform v1.1*
*Researched: 2026-03-26*