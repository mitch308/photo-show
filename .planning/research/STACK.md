# Stack Research — v1.1 Enhancements

**Domain:** Photography Studio Portfolio Platform (v1.1 Enhancement Features)
**Researched:** 2026-03-26
**Confidence:** HIGH

## v1.1 New Dependencies

### Frontend — Required Additions

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| @wangeditor/editor | ^5.1 | Rich Text Editor Core | Modern WYSIWYG, TypeScript support, active maintenance (18.3k stars) |
| @wangeditor/editor-for-vue | ^5.1 | Vue 3 Integration | Official Vue 3 wrapper, shallowRef pattern, Element Plus compatible |

### Backend — No New Dependencies Required

| Feature | Implementation | Why No New Library |
|---------|---------------|-------------------|
| File deduplication | Node.js `crypto.createHash('md5')` | Built-in, native, no dependency needed |
| Smart thumbnails | Sharp `withoutEnlargement` + metadata check | Already have Sharp 0.34.5, code change only |

## Integration Details

### Rich Text Editor (wangEditor)

**Installation:**
```bash
# Frontend
npm install @wangeditor/editor @wangeditor/editor-for-vue@next
```

**Why wangEditor over alternatives:**

| Editor | Pros | Cons | Verdict |
|--------|------|------|---------|
| wangEditor 5 | Chinese docs, Vue 3 native, simple API, 18.3k stars | Less customizable than headless | ✅ Recommended |
| Tiptap | Headless, highly customizable, 35.9k stars | Requires building UI, more complex | Overkill for studio intro |
| Vue-Quill | Quill wrapper, mature | VueQuill less active, Quill aging | Second choice |

**Usage pattern with Vue 3:**
```typescript
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

// Must use shallowRef for editor instance
const editorRef = shallowRef()

// Destroy on unmount
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
```

**Key considerations:**
- Use `shallowRef()` for editor instance (not `ref()`)
- Always destroy editor in `onBeforeUnmount`
- Supports image upload customization via `MENU_CONF`
- Works with Element Plus styling

### File Deduplication

**Use Node.js built-in crypto, NOT fast-md5:**

```typescript
import { createHash } from 'crypto'
import fs from 'fs'

async function computeFileMD5(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath)
  return createHash('md5').update(buffer).digest('hex')
}
```

**Why NOT fast-md5:**
- `fast-md5` adds an unnecessary dependency
- Node.js `crypto` module is native, no installation needed
- For large files, use streaming with `crypto.createHash('md5')`:
  ```typescript
  async function computeLargeFileMD5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('md5')
      const stream = fs.createReadStream(filePath)
      stream.on('data', chunk => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }
  ```

**Database change:**
- Add `md5Hash` column to `media_items` table
- Create unique index on `md5Hash` for deduplication queries

### Smart Thumbnail Generation

**Use Sharp's `withoutEnlargement` option:**

```typescript
async generateThumbnails(
  inputPath: string,
  outputDir: string,
  originalName: string
): Promise<ThumbnailResult | null> {
  const image = sharp(inputPath)
  const metadata = await image.metadata()
  
  // Skip if image is smaller than both thumbnail sizes
  const MIN_WIDTH = 300
  if ((metadata.width ?? 0) < MIN_WIDTH) {
    return null // Signal: no thumbnails needed
  }
  
  // Use withoutEnlargement to prevent upscaling
  await sharp(inputPath)
    .resize(300, undefined, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .toFile(smallPath)
  
  // ... rest of logic
}
```

**Benefits:**
- No upscaling artifacts
- Saves storage for small images
- Faster processing (skip unnecessary resize)

## Existing Stack (No Changes)

The following are already in place from v1.0 and require no changes:

| Component | Version | Status |
|-----------|---------|--------|
| Vue 3 | ^3.5.13 | ✅ No change |
| Element Plus | ^2.9.1 | ✅ No change |
| Sharp | ^0.34.5 | ✅ No change |
| TypeORM | ^0.3.21 | ✅ No change |
| Express | ^4.21.2 | ✅ No change |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| fast-md5 | Unnecessary dependency | Node.js `crypto` module (built-in) |
| Tiptap | Overkill for simple studio intro | wangEditor (simpler, better fit) |
| Quill | Older architecture | wangEditor (modern, Vue 3 native) |
| Any image resizing lib | Already have Sharp | Sharp `withoutEnlargement` option |

## Database Schema Changes

### New Table: `studio_settings`

```sql
CREATE TABLE studio_settings (
  id VARCHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default studio intro
INSERT INTO studio_settings (id, setting_key, setting_value) 
VALUES (UUID(), 'studio_intro', '<p>欢迎来到我们的摄影工作室</p>');
```

### MediaItem Table Addition

```sql
ALTER TABLE media_items ADD COLUMN md5_hash VARCHAR(32);
CREATE INDEX idx_media_items_md5 ON media_items(md5_hash);
```

## Installation Commands

```bash
# Frontend — add rich text editor
cd frontend
npm install @wangeditor/editor @wangeditor/editor-for-vue@next

# Backend — no new packages needed
# crypto is built-in to Node.js
```

## Sources

- wangEditor GitHub: https://github.com/wangeditor-team/wangEditor — 18.3k stars, Vue 3 support verified
- wangEditor docs: https://www.wangeditor.com/v5/for-frame.html — Vue 3 integration guide
- Node.js crypto docs: https://nodejs.org/api/crypto.html — MD5 hashing built-in
- Sharp resize docs: https://sharp.pixelplumbing.com/api-resize — `withoutEnlargement` option

---
*Stack research for: v1.1 Enhancement Features*
*Researched: 2026-03-26*