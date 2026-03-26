# Feature Research

**Domain:** Photo gallery platform enhancement (v1.1)
**Researched:** 2026-03-26
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| File download returns actual file | Download links should download files, not JSON | LOW | Bug fix - current routes stream files but may have edge cases |
| View count increments | Statistics should be accurate | LOW | Bug fix - publicService.getPublicWorkById increments, need to verify frontend calls |
| Watermark on images | Photographers expect protection for public display | MEDIUM | Bug fix - addWatermark exists in imageService but not integrated into upload flow |
| Work file info display | Users need to know file size/count | LOW | Aggregation from mediaItems (fileSize, count) |
| Admin link to frontend | Admins need quick access to public view | LOW | Simple navigation addition |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| MD5-based file deduplication | Saves storage space, prevents duplicate uploads | MEDIUM | Replace UUID naming with MD5 hash; check if file exists before saving |
| Smart thumbnail generation | Skip thumbnails for small images, save processing time | LOW | Check source dimensions before generating with Sharp |
| Work-level file management | Add/remove files from existing work without recreating | MEDIUM | MediaItemService exists; need UI for add/remove from existing work |
| Album-level private sharing | Share entire albums instead of individual works | MEDIUM | Extend ShareTokenData to support albumIds alongside workIds |
| Studio introduction page | Professional branding, rich text content management | MEDIUM | New model + admin UI + public page; rich text editor integration |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time deduplication with progress | Users want instant feedback | Complex streaming + hash computation; UX complexity | Hash after upload, return dedup info in response |
| Full CMS for studio intro | Flexible content management | Over-engineering for single-page intro | Simple rich text field + basic info form |
| Dedupe existing files retroactively | Clean up storage | Risk of breaking existing references; complex migration | Dedupe only on upload going forward |
| Multi-level album sharing with permissions | Granular access control | Scope creep; conflicts with simple private link model | Keep single-level share tokens; per-album shares |

## Feature Dependencies

```
[File Deduplication]
    └──requires──> [MD5 hash computation in upload middleware]
    └──requires──> [Check if file exists before saving]

[Smart Thumbnail]
    └──requires──> [Sharp metadata() to get dimensions]
    └──enhances──> [Faster upload for small images]

[Work File Management]
    └──requires──> [MediaItemService (EXISTS)]
    └──requires──> [MediaItemManager.vue component (EXISTS)]
    └──requires──> [Add/remove endpoints in works routes]

[Work Info Display]
    └──requires──> [MediaItem.fileSize field (EXISTS)]
    └──requires──> [Aggregation query or computed property]

[Studio Introduction]
    └──requires──> [New StudioConfig model]
    └──requires──> [Rich text editor (recommend: @wangeditor/editor-for-vue or tiptap)]
    └──requires──> [Admin settings page]
    └──requires──> [Public about page]

[Album-level Sharing]
    └──requires──> [ShareTokenData to support albumIds]
    └──requires──> [Resolve album → works at share time]
    └──enhances──> [Existing work-level sharing]

[Watermark Integration]
    └──requires──> [ImageService.addWatermark (EXISTS)]
    └──requires──> [Work watermark settings]
    └──requires──> [Apply on public view, exclude from download]

[Download Fix]
    └──conflicts──> [Returning JSON instead of file]
    └──requires──> [Proper Content-Disposition and Content-Type headers (EXISTS in share.ts)]

[View Count Fix]
    └──requires──> [Public API endpoint to increment (EXISTS in publicService)]
    └──requires──> [Frontend to call view endpoint on work detail]
```

### Dependency Notes

- **Smart Thumbnail requires Sharp metadata():** Sharp's `metadata()` method is synchronous and fast - no additional dependencies needed. Use `withoutEnlargement: true` option for resize.
- **Studio Introduction requires rich text editor:** Recommend lightweight options compatible with Vue 3. WangEditor is Chinese-friendly; Tiptap is more flexible but heavier.
- **Album-level Sharing extends existing:** ShareService stores `workIds[]`. Add `albumIds[]` field; when both exist, merge the resulting work lists.
- **Work File Management has existing foundation:** MediaItemService and MediaItemManager.vue already exist. Need to add API endpoints and integrate with work edit dialog.

## MVP Definition for v1.1

### Launch With (v1.1 Minimum)

Minimum viable product — what's needed to fix bugs and add core enhancements.

- [ ] **Bug: Watermark integration** — Photographers' work is unprotected without it
- [ ] **Bug: Download returns file** — Core functionality broken for private shares
- [ ] **Bug: View count increment** — Statistics inaccurate without it
- [ ] **MD5 deduplication** — Storage optimization, prevents duplicate files
- [ ] **Smart thumbnail generation** — Performance optimization for small images
- [ ] **Work file info display** — Basic UX improvement (file size, count)
- [ ] **Admin link to frontend** — Quick navigation improvement

### Add After Validation (v1.1 Extended)

Features to add once core bugs are fixed.

- [ ] **Work file management (add/remove)** — Requires careful UX for existing works
- [ ] **Album-level private sharing** — Extends existing share system
- [ ] **Studio introduction page** — New feature area, requires design decisions

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Retroactive deduplication** — Complex migration, potential for breaking references
- [ ] **Full CMS for studio pages** — Scope creep for single-purpose gallery
- [ ] **Share analytics dashboard** — Enhanced statistics beyond views/downloads

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Bug: Watermark integration | HIGH | MEDIUM | P1 |
| Bug: Download returns file | HIGH | LOW | P1 |
| Bug: View count increment | HIGH | LOW | P1 |
| MD5 deduplication | MEDIUM | MEDIUM | P1 |
| Smart thumbnail generation | MEDIUM | LOW | P1 |
| Work file info display | MEDIUM | LOW | P1 |
| Admin link to frontend | LOW | LOW | P2 |
| Work file management (add/remove) | MEDIUM | MEDIUM | P2 |
| Album-level sharing | MEDIUM | MEDIUM | P2 |
| Studio introduction page | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v1.1 - bug fixes and core optimizations
- P2: Should have - enhanced functionality
- P3: Nice to have - can defer if time-constrained

## Implementation Details

### 1. MD5 File Deduplication

**Current State:** Files named with UUID (`upload.ts:14-17`)
```typescript
filename: (req, file, cb) => {
  const ext = path.extname(file.originalname);
  const uuid = uuidv4();
  cb(null, `${uuid}${ext}`);
}
```

**Implementation Approach:**
1. Use `crypto.createHash('md5')` or `fast-md5` package (faster for large files)
2. Compute hash before saving (stream-based for large files)
3. Use hash as filename: `{md5hash}{ext}`
4. Check if file exists: `fs.existsSync(hashPath)`
5. If exists: skip save, return existing path
6. Store hash in MediaItem for reference

**Edge Cases:**
- Same content, different extension: Different files (keep both)
- Concurrent uploads of same file: Race condition, use temp file + rename
- Video files: Hash computation time; consider progress indication

### 2. Smart Thumbnail Generation

**Current State:** Always generates 300px and 1200px thumbnails (`imageService.ts:33-41`)
```typescript
await sharp(inputPath)
  .resize(300, undefined, { fit: 'inside' })
  .toFile(smallPath);
```

**Implementation Approach:**
1. Get source dimensions: `await sharp(inputPath).metadata()`
2. Check if source < target: `if (width < 300) skip small thumbnail`
3. Use `withoutEnlargement: true` option for Sharp
4. Return `null` for skipped thumbnails
5. Frontend falls back to original for null thumbnails

**Thresholds:**
- Small thumbnail (300px): Skip if source width < 300px
- Large thumbnail (1200px): Skip if source width < 1200px
- Video thumbnails: Always generate (frame extraction)

### 3. Work File Management (Add/Remove)

**Current State:**
- MediaItemService: CRUD operations exist
- MediaItemManager.vue: UI for managing items exists but not integrated into work edit
- Works.vue: Upload dialog, no edit dialog with file management

**Implementation Approach:**
1. Add "Manage Files" button to Works.vue table
2. Open MediaItemManager in edit mode
3. Add API endpoints:
   - `POST /api/works/:id/media` - Add media item to existing work
   - `DELETE /api/works/:id/media/:mediaId` - Remove media item
4. Handle position updates when adding/removing

### 4. Work Info Display (File Size, File Count)

**Current State:**
- Work.fileSize is deprecated (single file model)
- MediaItem.fileSize exists for each item
- No aggregation endpoint

**Implementation Approach:**
1. Add computed fields to Work response:
   - `totalFileSize`: Sum of all mediaItems.fileSize
   - `fileCount`: Count of mediaItems
2. Either: Compute in service (SQL aggregation) or virtual property
3. Display in Works.vue table: "3 files · 12.5 MB"

### 5. Studio Introduction Page

**Current State:** No implementation

**Implementation Approach:**
1. Create StudioConfig model (MySQL):
   - `id`, `name`, `logo`, `description` (rich text), `contact`, `socialLinks` (JSON)
2. Admin settings page: Form with rich text editor for description
3. Public `/about` page: Display studio info
4. Rich text editor options:
   - **WangEditor** (推荐): Chinese docs, Vue 3 support, lightweight
   - **Tiptap**: More flexible, headless, but heavier
   - **Quill**: Classic, well-documented, medium weight

### 6. Private Sharing Extension (Work OR Album)

**Current State:**
- ShareTokenData: `{ workIds: string[], ... }`
- ShareService validates workIds
- No albumIds support

**Implementation Approach:**
1. Extend ShareTokenData:
   ```typescript
   interface ShareTokenData {
     workIds: string[];
     albumIds?: string[];  // NEW
     // ... existing fields
   }
   ```
2. When creating share: Accept either workIds OR albumIds OR both
3. When validating: Resolve albumIds → workIds, merge with workIds
4. Update admin share creation UI to support album selection
5. Update Share.vue to display album info if shared

### 7. Watermark Integration Fix

**Current State:**
- `ImageService.addWatermark()` exists but unused
- No watermark settings on Work model
- No integration in upload/display flow

**Implementation Approach:**
1. Add watermark settings to Work:
   - `watermarkEnabled: boolean`
   - `watermarkText?: string`
   - `watermarkPosition?: string`
   - `watermarkOpacity?: number`
2. On public display: Apply watermark to thumbnail
3. On private download: Return original (no watermark)
4. Global default watermark in admin settings

### 8. Download Fix

**Current State:** `share.ts` routes appear correct (streaming files)
```typescript
res.setHeader('Content-Disposition', `attachment; filename="..."`);
res.setHeader('Content-Type', mimeType);
const fileStream = fs.createReadStream(filePath);
fileStream.pipe(res);
```

**Potential Issues:**
1. Path resolution: Check if `filePath.replace('uploads/works/', '')` works correctly
2. Missing file: Returns JSON error instead of proper HTTP error
3. Frontend handling: May expect JSON response

**Debug Steps:**
1. Test download endpoint directly with curl/browser
2. Check file paths in database vs actual files
3. Verify media item references

### 9. View Count Fix

**Current State:** `publicService.getPublicWorkById()` increments viewCount
```typescript
if (work) {
  await this.workRepo.increment({ id }, 'viewCount', 1);
}
```

**Potential Issues:**
1. Frontend may not call this endpoint (using list endpoint instead)
2. Private shares may not increment view count
3. Gallery view vs detail view confusion

**Implementation Approach:**
1. Verify frontend calls `/api/public/works/:id` on detail view
2. Add view increment to private share access
3. Consider: Deduplicate views (same session/IP within time window)

## Sources

- **Existing codebase analysis** — HIGH confidence, direct file reading
- **Sharp documentation** — HIGH confidence, official docs at sharp.pixelplumbing.com
- **TypeORM patterns** — HIGH confidence, official docs
- **Vue 3 ecosystem** — MEDIUM confidence, standard patterns for rich text editors

---

*Feature research for: Photo gallery platform v1.1 enhancements*
*Researched: 2026-03-26*