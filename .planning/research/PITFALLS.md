# Pitfalls Research: v1.1 Enhancement Features

**Domain:** Photo Gallery Platform — Adding enhancement features to existing v1.0 system
**Researched:** 2026-03-26
**Confidence:** HIGH (based on codebase analysis + official documentation)

---

## Critical Pitfalls

### Pitfall 1: MD5 Deduplication Race Condition

**What goes wrong:**
Two simultaneous uploads of the same file create duplicate files with different UUIDs, or one upload overwrites the other's database record.

**Why it happens:**
MD5 calculation + file existence check + file save are not atomic. Between checking "does file with MD5 X exist?" and "save file with MD5 X", another upload could complete the same operation.

**How to avoid:**
- Use file locking or named temporary files during deduplication check
- Calculate MD5 first, then use atomic file operations (write to temp, then rename)
- Store file hash in database with unique constraint to catch duplicates at DB level
- Implement reference counting: track how many works reference each file

**Warning signs:**
- Same file appearing twice in gallery with different thumbnails
- 404 errors when downloading (file deleted by one work's deletion)
- Database constraint violations during concurrent uploads

**Phase to address:** File Storage Optimization (MD5 deduplication)

---

### Pitfall 2: Orphaned Files on Transaction Failure

**What goes wrong:**
Files uploaded to disk but database transaction fails, leaving orphaned files that are never cleaned up. Or, database record deleted but file system deletion fails.

**Why it happens:**
File system operations and database transactions are not atomic. A crash between `fs.writeFile()` and `mediaItemRepo.save()` leaves inconsistent state.

**How to avoid:**
- Use "staging" pattern: upload to temp location, move to final only after DB commit
- Implement periodic cleanup job for files not referenced in database
- Add transaction hooks to rollback file operations on DB failure
- Store file path in DB BEFORE moving file to final location (optimistic lock)

```typescript
// Anti-pattern
await fs.writeFile(finalPath, buffer);
await mediaItemRepo.save(mediaItem); // If this fails, file is orphaned

// Better pattern
await fs.writeFile(tempPath, buffer);
await mediaItemRepo.save(mediaItem); // If this fails, temp file can be cleaned
await fs.rename(tempPath, finalPath); // Atomic on same filesystem
```

**Warning signs:**
- Disk usage growing faster than database records
- Files in upload directory with no corresponding DB entries
- Out of disk space errors

**Phase to address:** File Storage Optimization (MD5 deduplication must handle this)

---

### Pitfall 3: Thumbnail Generation for Small Images

**What goes wrong:**
Images smaller than target thumbnail size (e.g., 200x150 image) get enlarged to 300px, wasting storage and reducing quality. Or, exactly-sized images generate redundant thumbnails.

**Why it happens:**
Sharp's `resize(300, undefined, { fit: 'inside' })` only prevents enlarging when `withoutEnlargement: true` is set. Default behavior allows upscaling.

**How to avoid:**
- Check image dimensions before generating thumbnails
- Use Sharp's `withoutEnlargement: true` option
- Skip thumbnail generation entirely for images below threshold
- For exactly-sized images, use symbolic links or copy instead of processing

```typescript
// Correct approach
const metadata = await sharp(inputPath).metadata();
if (metadata.width && metadata.width <= 300) {
  // Use original file as "small" thumbnail
  thumbnailSmall = filePath; // No generation needed
} else {
  await sharp(inputPath)
    .resize(300, undefined, { fit: 'inside', withoutEnlargement: true })
    .toFile(smallPath);
}
```

**Warning signs:**
- Thumbnails larger than originals
- Pixelated small thumbnails
- Storage bloat from unnecessary processing

**Phase to address:** File Storage Optimization (smart thumbnails)

---

### Pitfall 4: XSS in Studio Introduction Rich Text

**What goes wrong:**
Malicious scripts injected into studio introduction get executed in admin panel or public page, potentially stealing admin session or defacing site.

**Why it happens:**
Rich text editors allow arbitrary HTML. Without proper sanitization, `<script>`, `onerror`, `onclick` handlers persist to database and execute when rendered.

**How to avoid:**
- Use a well-maintained sanitizer (DOMPurify on frontend, sanitize-html on backend)
- Whitelist allowed HTML tags: `p, br, strong, em, h1-h6, ul, ol, li, a, img`
- Strip ALL event handlers: `onclick`, `onerror`, `onload`, etc.
- Sanitize on BOTH frontend (for display) and backend (for storage)
- Use Content Security Policy headers as defense-in-depth

```typescript
// Backend sanitization
import sanitizeHtml from 'sanitize-html';

const cleanIntro = sanitizeHtml(richText, {
  allowedTags: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img'],
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['src', 'alt', 'title']
  },
  allowedSchemes: ['https'], // Only https links
});
```

**Warning signs:**
- `<script>` tags visible in stored content
- Console errors about blocked scripts (CSP working but XSS attempted)
- Unexpected redirects when viewing studio page

**Phase to address:** Studio Introduction Page

---

### Pitfall 5: Share Token Points to Deleted Work

**What goes wrong:**
Share link shows "work not found" errors because the work was deleted after the share was created. Or, album share shows stale work list (works added/removed after share creation).

**Why it happens:**
Share tokens store `workIds` array at creation time. No mechanism updates or invalidates shares when works are deleted or albums change.

**How to avoid:**
- Filter out non-existent works when loading share (already partially implemented)
- Track share references in Work model (soft dependency)
- Consider "soft delete" for works with active shares
- For album shares, decide: snapshot at creation time OR dynamic (current works in album)
- Document behavior clearly: what happens when shared work is deleted?

**Current code partially handles this:**
```typescript
// In share.ts - filters nulls
const validWorks = works.filter(w => w !== null);
```

But doesn't inform user that some works are missing.

**Warning signs:**
- Share pages showing fewer works than expected
- Client complaints about missing photos
- 404 errors in share download endpoints

**Phase to address:** Share Extension (work/album sharing)

---

### Pitfall 6: View Count Inflation

**What goes wrong:**
View counts are inflated by page refreshes, bot crawlers, or malicious requests. A single user viewing a work 10 times adds 10 to view count.

**Why it happens:**
Current implementation increments count on every `getPublicWorkById` call with no deduplication.

```typescript
// Current implementation
await this.workRepo.increment({ id }, 'viewCount', 1); // Called every time
```

**How to avoid:**
- Use Redis for rate-limited view counting (one view per IP/session per time window)
- Store view events in a queue, aggregate periodically
- Exclude known bot user agents from counting
- Consider unique view counting (per session or per user fingerprint)
- Separate "views" from "impressions" (scrolling past vs. actually viewing)

```typescript
// Better approach with Redis rate limiting
const viewKey = `view:${workId}:${sessionId}`;
const alreadyViewed = await redis.get(viewKey);
if (!alreadyViewed) {
  await redis.setex(viewKey, 3600, '1'); // 1 hour window
  await this.workRepo.increment({ id }, 'viewCount', 1);
}
```

**Warning signs:**
- View counts disproportionately high vs. expected traffic
- View counts spike during crawl events
- Same IP showing hundreds of views

**Phase to address:** Bug Fix (view count should increment properly)

---

### Pitfall 7: Large File Download Memory Exhaustion

**What goes wrong:**
Large video downloads (50MB+) cause memory spikes, especially with concurrent downloads. Server becomes unresponsive.

**Why it happens:**
While current code uses streaming (`fs.createReadStream().pipe(res)`), error handling and back-pressure aren't properly managed. Connection drops can leave file handles open.

**How to avoid:**
- Use `stream.pipeline()` instead of `.pipe()` for proper error handling
- Implement Range request support for large files (HTTP 206 Partial Content)
- Set connection timeouts for slow clients
- Limit concurrent downloads per IP
- Use `res.writeHead()` with proper headers before streaming

```typescript
// Better streaming with pipeline
import { pipeline } from 'node:stream/promises';

try {
  await pipeline(
    fs.createReadStream(filePath),
    res
  );
} catch (err) {
  // Handle errors properly - stream cleanup is automatic
  if (!res.headersSent) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, 'Download failed'));
  }
}
```

**Warning signs:**
- Server memory usage climbing during downloads
- Timeout errors for large file downloads
- EPIPE errors in logs (client disconnected)

**Phase to address:** Bug Fix (download returns source file)

---

### Pitfall 8: Removing the Last Media Item from a Work

**What goes wrong:**
User removes the only media item from a work, leaving an "empty" work with no files. Work record exists but displays nothing.

**Why it happens:**
Current `deleteMediaItem` in mediaItemService deletes the file immediately without checking if it's the last item. Work model allows empty `mediaItems` array.

**How to avoid:**
- Check media item count before deletion
- Prompt user: "This is the last image. Delete the entire work?" or "Work will be empty"
- Either: prevent deletion of last item, OR auto-delete the work
- Add validation: work must have at least one media item (business rule)

```typescript
// In deleteMediaItem
const itemCount = await this.getMediaItemCount(mediaItem.workId);
if (itemCount === 1) {
  throw new Error('Cannot delete the last media item. Delete the work instead.');
}
```

**Warning signs:**
- Works showing "No images" in gallery
- Empty work cards in admin panel
- Confused clients seeing blank shares

**Phase to address:** Work File Management Enhancement

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip MD5 deduplication | Faster uploads | Duplicate files, wasted storage | Never — essential for photo gallery |
| Always generate thumbnails | Simpler code | Wasted storage, quality loss for small images | Never — check dimensions first |
| Delete files immediately | Simpler logic | Can't recover from mistakes | Use soft delete or trash folder |
| Store raw HTML in intro | Fastest implementation | XSS vulnerabilities, security debt | Never — always sanitize |
| Increment view count on every load | Simplest code | Inflated metrics, meaningless data | Use rate-limited counting |
| Ignore orphaned files | Save dev time | Disk bloat, eventual storage crisis | Never — implement cleanup job |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sharp image processing | Ignoring memory limits with large batches | Process in batches, monitor memory, use streaming |
| Redis for share tokens | No TTL management, manual cleanup | Use SETEX for auto-expiration (already implemented) |
| Redis for view counting | Increment on every request | Rate-limit with session/IP key + TTL |
| Multer file upload | No file type validation | Check MIME type AND file signature |
| File streaming | Using `.pipe()` without error handling | Use `stream.pipeline()` with try/catch |
| TypeORM cascade | Cascade delete without checking shares | Check for active shares before deleting work |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Increment view count synchronously | Slow page loads under traffic | Async queue + periodic aggregation | 100+ concurrent viewers |
| Generate thumbnails on upload | Upload timeouts for batch operations | Background job queue | 20+ images in one batch |
| Full file scan for MD5 | Slow uploads for large files | Stream MD5 calculation during upload | Files > 10MB |
| Store shares in Redis only | Lost shares on Redis restart | Persist to database, Redis for speed | Redis restart/crash |
| No download rate limiting | Server overload from scrapers | Rate limit per IP, per token | Any public gallery |
| N+1 queries for media items | Slow work listing | Eager load relations | 100+ works displayed |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| No file type validation | Malicious files uploaded (e.g., PHP shell) | Validate MIME type AND file signature, not just extension |
| Predictable share tokens | Attackers guess share URLs | Use crypto.randomBytes(32) — already implemented |
| No download auth check | Anyone can download via direct URL | Verify share token before every download (already implemented) |
| Rich text without sanitization | Stored XSS in admin panel | Sanitize on both frontend and backend |
| File path in URL parameters | Path traversal attacks | Never use user input in file paths directly |
| No rate limiting on downloads | Resource exhaustion | Limit concurrent downloads per IP/token |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Share link shows "work not found" | Confusion, client thinks product deleted | Show "work no longer available" with context |
| Empty work after removing last file | Work exists but shows nothing | Prompt before removing last file, or auto-delete work |
| Thumbnail quality issues | Professional photos look amateur | Quality-first thumbnail settings, test with real photos |
| View count never updates | Stats feel broken | Real-time update or clear "updated every X" indicator |
| Download starts without progress | Large files seem frozen | Show progress bar or file size estimate |
| No indication of duplicate upload | User re-uploads same file, confused | Show "file already exists" with option to use existing |
| Share created without confirmation | User unsure if link was generated | Show success toast with link preview |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **MD5 Deduplication:** Often missing reference counting — verify deleting one work doesn't break shared files
- [ ] **Smart Thumbnails:** Often missing edge case for exactly-sized images — verify no redundant thumbnails
- [ ] **File Management:** Often missing orphan cleanup — verify no files left when DB operation fails
- [ ] **Rich Text:** Often missing backend sanitization — verify `<script>` tags are stripped on save
- [ ] **Share Extension:** Often missing work deletion handling — verify share shows clear error for deleted works
- [ ] **View Counting:** Often missing bot filtering — verify crawler traffic doesn't inflate counts
- [ ] **File Download:** Often missing Range support — verify large video files resume after pause
- [ ] **Last Media Item:** Often missing validation — verify user can't leave work empty

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate files (no deduplication) | MEDIUM | Script to find MD5 duplicates, consolidate with reference counting |
| Orphaned files | LOW | Query DB for all paths, delete files not in result set |
| Corrupted thumbnails | LOW | Delete all thumbnails, regenerate on-demand or in batch |
| XSS in rich text | HIGH | Find all stored HTML, sanitize, update DB, review for damage |
| Broken share links | MEDIUM | Query shares with invalid workIds, notify admins or auto-clean |
| Inflated view counts | LOW | Reset counts, implement proper tracking going forward |
| Memory exhaustion from downloads | LOW | Restart server, implement proper streaming + rate limits |
| Empty works (last item deleted) | LOW | Query for works with no mediaItems, prompt for action |

---

## Pitfall-to-Phase Mapping

How v1.1 roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| MD5 Race Condition | File Storage Optimization | Test concurrent upload of same file |
| Orphaned Files | File Storage Optimization | Kill process mid-upload, run cleanup job |
| Thumbnail Small Images | File Storage Optimization | Upload 200x150 image, verify no enlargement |
| XSS Rich Text | Studio Introduction | Submit `<script>alert(1)</script>`, verify stripped |
| Share Deleted Works | Share Extension | Create share, delete work, verify clear error |
| View Count Inflation | Bug Fix (view count) | Refresh page 10x, verify 1 count increment |
| Large File Memory | Bug Fix (download) | Download 100MB video, monitor memory usage |
| Last Media Item | Work File Management | Delete last item, verify prompt or auto-delete |

---

## Codebase-Specific Considerations

### Current Patterns to Preserve

1. **Share token format:** `crypto.randomBytes(32).toString('base64url')` — already secure
2. **Streaming downloads:** `fs.createReadStream().pipe(res)` — already implemented, needs `pipeline()`
3. **Cascade delete:** TypeORM `cascade: true` on mediaItems — already handles DB consistency
4. **Month-based folders:** `YYYY-MM` structure — keep for organization, add MD5-based naming
5. **Redis TTL for shares:** Using `setex` for auto-expiration — already correct

### Current Gaps to Address

1. **No MD5 calculation:** Files stored with UUID names, no deduplication
2. **No thumbnail size check:** Always generates 300px/1200px regardless of source
3. **No orphan cleanup:** If process dies mid-upload, temp files remain
4. **No view rate limiting:** Every `getPublicWorkById` call increments
5. **No rich text storage:** Studio intro doesn't exist yet, start with sanitization
6. **No last-item validation:** Can delete last media item without warning

---

## v1.0 Pitfalls (Preserved for Reference)

The following pitfalls from v1.0 are still relevant:

| Pitfall | Status | Notes |
|---------|--------|-------|
| 大文件上传超时 | ✅ Addressed | Multer streaming + size limits implemented |
| 图片处理阻塞 | ⚠️ Partial | Sharp is async but batch operations could still block |
| 私密链接安全隐患 | ✅ Addressed | crypto.randomBytes + TTL implemented |
| 数据库连接未释放 | ✅ Addressed | TypeORM connection pooling configured |
| 前端状态丢失 | ✅ Addressed | VueUse + localStorage for theme |
| 文件名冲突 | ⚠️ Partial | UUID naming used, but MD5 deduplication not yet |

---

## Sources

- Sharp documentation — `withoutEnlargement` option, streaming API, memory management
- OWASP XSS Prevention Cheat Sheet — sanitization strategies, stored XSS risks
- Node.js Stream documentation — `pipeline()` for error handling, back-pressure
- Codebase analysis — Current patterns in shareService, uploadService, publicService, mediaItemService
- Personal experience — Photo gallery platform development patterns

---

*Pitfalls research for: Photo Gallery v1.1 Enhancement Features*
*Researched: 2026-03-26*
*Previous version: v1.0 PITFALLS.md (2026-03-24)*