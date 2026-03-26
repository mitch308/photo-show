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

# v1.2 UI/UX Improvement Pitfalls

**Domain:** Vue 3 UI/UX Improvements for Existing Photography Platform
**Researched:** 2026-03-26
**Confidence:** HIGH (based on codebase analysis and Vue.js/Element Plus best practices)

---

## Critical Pitfalls

### Pitfall 1: CSS Layout Breaking When Adding Independent Scrolling

**What goes wrong:**
When adding independent scrolling to the sidebar (`.nav`), the flex layout can break, causing:
- Sidebar footer to be pushed off-screen
- Main content area to collapse
- Scroll position not persisting between route changes

**Why it happens:**
Developers often add `overflow-y: auto` without considering the flex container's behavior. The sidebar uses `flex-direction: column` with `.nav` having `flex: 1`, but without proper height constraints, scrolling won't work as expected.

**Consequences:**
- Sidebar becomes unusable on smaller screens
- Footer buttons (theme toggle, logout) become inaccessible
- User frustration navigating admin panel

**Prevention:**
```css
/* WRONG - This breaks the layout */
.sidebar {
  overflow-y: auto; /* Scrolls entire sidebar, hides footer */
}

/* CORRECT - Only the nav section scrolls */
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Fixed height constraint */
}

.nav {
  flex: 1;
  overflow-y: auto; /* Only nav scrolls */
  min-height: 0; /* Critical for flex overflow */
}
```

**Warning signs:**
- Sidebar footer disappears when nav items exceed viewport height
- Horizontal scrollbar appears unexpectedly
- Theme toggle button not visible without scrolling entire page

**Phase to address:** UI beautification phase (sidebar scroll fix)

---

### Pitfall 2: Thumbnail Display Breaking After Switching to mediaItems

**What goes wrong:**
After changing thumbnail logic to use `work.mediaItems[0]`, images fail to load or show broken image placeholders.

**Why it happens:**
1. The `Work` type has both legacy fields (`thumbnailSmall`, `thumbnailLarge`) and `mediaItems` array
2. Older works may not have `mediaItems` populated
3. `mediaItems` could be empty or undefined
4. Accessing `mediaItems[0].thumbnailLarge` without null checks causes errors

**Consequences:**
- Blank thumbnails in admin table and public gallery
- Console errors: "Cannot read property 'thumbnailLarge' of undefined"
- Works appear broken to users

**Prevention:**
```typescript
// WRONG - Direct access causes crashes
const thumbnail = work.mediaItems[0].thumbnailLarge;

// CORRECT - Fallback chain with null checks
function getWorkThumbnail(work: Work): string {
  // Try first mediaItem
  if (work.mediaItems?.length && work.mediaItems[0].thumbnailLarge) {
    return work.mediaItems[0].thumbnailLarge;
  }
  // Fallback to legacy field
  return work.thumbnailLarge || work.filePath;
}
```

**Warning signs:**
- Works with single file show correctly, multi-file works show broken images
- Error in console about undefined access
- Some thumbnails show, others don't

**Phase to address:** Thumbnail fix phase

---

### Pitfall 3: Element Plus Table Filter State Not Persisting

**What goes wrong:**
After adding filters to admin tables, the filter state is lost when:
- Navigating to another page and returning
- Opening a dialog and closing it
- Browser refresh

**Why it happens:**
Vue Router doesn't preserve component state by default. When a component is unmounted (route change) or the parent re-renders, local filter state is lost.

**Consequences:**
- Users lose their search context
- Frustration having to re-enter filters
- Poor user experience for power users

**Prevention:**
```typescript
// Option 1: URL-based filters (recommended for shareable links)
const { filters, syncToUrl } = useUrlFilters();

// Option 2: Pinia store for cross-route persistence
const worksStore = useWorksStore();
// Filters stored in store, survive route changes

// Option 3: KeepAlive for component caching
<router-view v-slot="{ Component }">
  <keep-alive include="WorksView">
    <component :is="Component" />
  </keep-alive>
</router-view>
```

**Warning signs:**
- Filter resets after opening edit dialog
- Search term disappears after navigating away
- Filters work but aren't visible in URL

**Phase to address:** Admin list filters phase

---

### Pitfall 4: Style Inconsistency When Converting Plain Tables to Element Plus

**What goes wrong:**
After converting `Shares.vue` and `Clients.vue` from plain `<table>` to `el-table`:
- Spacing and padding look different
- Dark mode colors don't apply correctly
- Custom status badges lose styling

**Why it happens:**
1. Plain tables use custom CSS with CSS variables like `--bg-card`, `--border-color`
2. Element Plus uses its own design tokens (`--el-bg-color`, `--el-border-color`)
3. Custom scoped styles may conflict with Element Plus internal styles
4. Status badge classes defined for plain table don't match Element Plus cell structure

**Consequences:**
- Visual inconsistency between pages
- Dark mode broken on converted pages
- Extra CSS needed to override Element Plus defaults

**Prevention:**
1. Create a shared status badge component that works in both contexts
2. Use Element Plus theming instead of custom styles
3. Map custom CSS variables to Element Plus tokens:
```css
:root {
  --el-bg-color: var(--bg-card);
  --el-border-color: var(--border-color);
}
```
4. Use `el-table` cell slots for custom content instead of overriding styles

**Warning signs:**
- Converted tables look "off" compared to original
- Dark mode toggle doesn't affect table background
- Custom classes no longer apply to cells

**Phase to address:** Style unification phase (Shares/Clients styling)

---

### Pitfall 5: Lightbox Not Showing All MediaItems

**What goes wrong:**
After implementing work detail page, users can't see all files in a work. Lightbox only shows the primary file, not the additional mediaItems.

**Why it happens:**
Current `Lightbox.vue` only displays `work.filePath`:
```vue
<img :src="`/${work.filePath}`" :alt="work.title" />
```
It doesn't iterate over `work.mediaItems`.

**Consequences:**
- Multi-file works only show first file
- Users can't access all photos/videos in a work
- Client dissatisfaction with shared works

**Prevention:**
```vue
<template>
  <div class="lightbox-content">
    <!-- Show all mediaItems with navigation -->
    <div v-if="currentMediaItem" class="media-container">
      <img v-if="currentMediaItem.fileType === 'image'" 
           :src="`/${currentMediaItem.filePath}`" />
      <video v-else :src="`/${currentMediaItem.filePath}`" controls />
    </div>
    
    <!-- Thumbnail strip for navigation -->
    <div class="thumbnail-strip">
      <button v-for="(item, idx) in work.mediaItems" 
              :key="item.id"
              :class="{ active: idx === currentIndex }"
              @click="currentIndex = idx">
        <img :src="`/${item.thumbnailSmall}`" />
      </button>
    </div>
  </div>
</template>
```

**Warning signs:**
- Works with 3+ files only show 1 file
- No way to navigate between files in lightbox
- Download button only downloads first file

**Phase to address:** Work detail page phase

---

### Pitfall 6: About Page Accessible Without Auth Check

**What goes wrong:**
The `/about` page returns 401 or redirects to login when it should be publicly accessible.

**Why it happens:**
The router guard in `router/index.ts` may have overly broad auth requirements, or the route meta isn't configured correctly for public access.

**Consequences:**
- Public visitors can't see studio introduction
- SEO impact (search engines can't index about page)
- Broken user journey from home page

**Prevention:**
```typescript
// In router/index.ts
{
  path: '/about',
  name: 'About',
  component: () => import('@/views/About.vue'),
  meta: { title: '关于我们', public: true }, // Mark as public
},

// In router guard
router.beforeEach((to, _from, next) => {
  // Public routes bypass auth
  if (to.meta.public) {
    next();
    return;
  }
  
  // ... existing auth logic
});
```

**Warning signs:**
- About page redirects to login
- Console shows auth errors on public pages
- Navigation link to about appears broken

**Phase to address:** About page public access fix

---

## Technical Debt Patterns (v1.2)

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline styles for quick UI fixes | Fast implementation | Inconsistent, hard to maintain, breaks dark mode | Never |
| Copy-paste table code between pages | Quick delivery | Duplicate code, inconsistent behavior, harder updates | Never |
| CSS `!important` overrides | Force style to apply | Specificity wars, unmaintainable CSS | Never |
| Skipping null checks on mediaItems | Less code | Runtime errors, broken thumbnails | Never |
| Hardcoded pixel widths | Precise control | Breaks responsiveness, requires more overrides | Only for fixed-size elements |
| Local state for filters | Simpler code | Lost on navigation, poor UX | Only for disposable filters |

## Integration Gotchas (v1.2)

Common mistakes when connecting UI changes to existing patterns.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Element Plus dark mode | Forgetting to set `el-config-provider` | Use CSS variables mapped to Element Plus tokens |
| URL filters with router | Not updating query params | Use `useUrlFilters` composable pattern already in codebase |
| Sidebar scroll with flex | Adding overflow to wrong container | Only `.nav` should scroll, with `min-height: 0` |
| WorkCard thumbnail | Assuming legacy fields always exist | Check `mediaItems` first, fallback to legacy |
| Status badges in el-table | Applying styles to `td` instead of slot content | Use template slot for custom cell content |
| Public route access | Missing `meta.public` flag | Add `public: true` to route meta |

## Performance Traps (v1.2)

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering all mediaItems in lightbox | Sluggish navigation, memory issues | Lazy load thumbnails, virtualize large lists | 50+ items per work |
| No debouncing on filter inputs | API spam, laggy search | Add 300ms debounce (pattern exists in Clients.vue) | 100+ concurrent users |
| Heavy thumbnail strip in lightbox | Slow load, layout shift | Load thumbnails progressively, use `loading="lazy"` | 20+ files per work |
| Not using `v-memo` for table rows | Slow re-renders on filter | Use `v-memo` for unchanged rows | 100+ works in list |

## UX Pitfalls (v1.2)

Common user experience mistakes when adding these features.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Filter without clear button | User stuck with filter, can't see all items | Add clear/reset button to all filters |
| Sidebar scroll without visual indicator | User doesn't know more items exist | Add subtle shadow or gradient at scroll edge |
| Thumbnail strip without current indicator | User loses track of which file they're viewing | Highlight active thumbnail, show position (1/5) |
| Status badges without color legend | User confused about meaning | Use consistent colors: green=active, red=expired, blue=info |
| Settings cards not responsive | Horizontal scroll on narrow screens | Use `max-width: 100%` with container query support |
| No loading state on filter | User thinks filter didn't work | Show loading indicator while filtering |

## "Looks Done But Isn't" Checklist (v1.2)

Things that appear complete but are missing critical pieces.

- [ ] **Sidebar scroll:** Often missing `min-height: 0` on flex child — verify sidebar footer visible at 768px height
- [ ] **Thumbnail fallback:** Often missing check for empty mediaItems — verify works with 0 files don't crash
- [ ] **Filter persistence:** Often missing URL sync — verify filter survives page refresh
- [ ] **Dark mode:** Often missing Element Plus token mapping — verify tables look correct in dark mode
- [ ] **Responsive settings:** Often missing mobile breakpoint — verify at 375px width
- [ ] **Lightbox media nav:** Often missing keyboard support — verify arrow keys work for media navigation
- [ ] **Public about page:** Often missing route meta — verify about accessible without login

## Recovery Strategies (v1.2)

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Sidebar scroll broken | LOW | Add `min-height: 0` to `.nav`, verify flex layout |
| Thumbnail crash | LOW | Add null check function, update all usage sites |
| Filter state lost | MEDIUM | Implement URL sync or Pinia store persistence |
| Style inconsistency | MEDIUM | Create shared components, migrate Element Plus tokens |
| Lightbox incomplete | HIGH | Refactor lightbox component, add mediaItems iteration |
| About page auth issue | LOW | Add `public: true` to route meta |

## Pitfall-to-Phase Mapping (v1.2)

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| CSS layout breaking | Sidebar scroll fix | Test sidebar at multiple viewport heights |
| Thumbnail breaking | Thumbnail fix | Test with works having 0, 1, and multiple files |
| Filter state lost | Admin list filters | Navigate away and back, verify filter persists |
| Style inconsistency | Style unification | Toggle dark mode, compare all admin pages |
| Lightbox incomplete | Work detail page | Open work with multiple files, verify all visible |
| About page access | About page fix | Access /about without login, verify no redirect |

## Codebase-Specific Patterns (v1.2)

### Existing Patterns to Preserve

1. **useUrlFilters composable** — Already exists in codebase, use for filter URL sync
2. **Debounce pattern in Clients.vue** — Search has 300ms debounce, reuse this pattern
3. **Element Plus in Works.vue** — Uses `el-table`, follow this pattern for consistency
4. **CSS variables for theming** — `--bg-card`, `--border-color` etc., maintain for dark mode
5. **Teleport for lightbox** — Already using `<Teleport to="body">`, preserve this

### Codebase Gaps to Address

1. **No filter on Works.vue** — Needs search/filter by title, album, tag, status
2. **No filter on Shares.vue** — Needs filter by status (active/expired), client
3. **Plain HTML tables** — Shares.vue and Clients.vue use `<table>`, not `el-table`
4. **No fallback for mediaItems** — WorkCard directly uses `work.thumbnailLarge`
5. **Settings card fixed width** — `max-width: 600px` hardcoded, needs adaptive width
6. **Lightbox single file** — Only shows `work.filePath`, not all mediaItems

---

## Sources (v1.2)

- Vue.js Performance Guide — Props stability, v-memo patterns
- Element Plus Documentation — Table component, theming, dark mode
- Codebase analysis — Existing patterns in `Clients.vue` (debounce), `useUrlFilters.ts`, `Dashboard.vue` layout
- Personal experience — Common Vue 3 refactoring issues

---

*Pitfalls research for: Photo Gallery v1.2 UI/UX Improvements*
*Researched: 2026-03-26*
*Previous versions: v1.0 PITFALLS.md (2026-03-24), v1.1 PITFALLS.md (2026-03-26)*