# Phase 8: 文件存储优化 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** User directive with new deduplication strategy

<domain>
## Phase Boundary

Phase 8 优化文件存储效率，实现：
1. **Fast-MD5 预检查去重** — 上传前检查，节省带宽和存储
2. **智能缩略图生成** — 小图片不生成缩略图，避免浪费

**关键变化：** 去重发生在上传**之前**，而非上传过程中。客户端计算 fast-md5，调用检查 API，若文件已存在则跳过上传。

</domain>

<decisions>
## Implementation Decisions

### FILE-01: Fast-MD5 预检查去重

#### D-01: Fast-MD5 计算方式
- **锁定决策:** Fast-MD5 = MD5(file_size_bytes + first_64KB_content)
- **理由:** 64KB 足以区分不同文件，计算速度快（比完整 MD5 快 10-100 倍）
- **实现:** 前端使用 SparkMD5 库计算，后端使用 Node.js crypto 模块验证

#### D-02: 文件存储命名
- **锁定决策:** 使用 fast-md5 作为文件名，保留原始扩展名
- **格式:** `{fastMd5}.{ext}` 例如 `a1b2c3d4e5f6.jpg`
- **理由:** 去重后同名文件只存储一份，MD5 唯一性保证不会冲突

#### D-03: 预检查 API 端点
- **锁定决策:** GET /api/media/check?hash={fastMd5}
- **响应:**
  - 200: 文件已存在，返回 `{ exists: true, mediaItem: {...} }`
  - 404: 文件不存在，可上传

#### D-04: MediaItem 模型扩展
- **锁定决策:** 添加 `fileHash` 字段存储 fast-md5
- **字段:** `fileHash: string` (varchar 32, unique)
- **理由:** 通过 hash 快速查找已存储文件

#### D-05: 上传流程变更
- **锁定决策:** 新上传流程：
  1. 前端计算 fast-md5
  2. 调用 GET /api/media/check?hash={fastMd5}
  3. 若存在 → 返回已有 MediaItem，跳过上传
  4. 若不存在 → 上传文件，后端以 fast-md5 命名存储

### FILE-02: 智能缩略图生成

#### D-06: 缩略图尺寸检查
- **锁定决策:** 生成缩略图前检查原图尺寸
- **规则:**
  - 原图宽度 <= 300px → 不生成 small 缩略图，thumbnailSmall 返回原图路径
  - 原图宽度 <= 1200px → 不生成 large 缩略图，thumbnailLarge 返回原图路径

#### D-07: 缩略图命名变更
- **锁定决策:** 缩略图使用 `{fastMd5}_small.{ext}` 和 `{fastMd5}_large.{ext}` 格式
- **理由:** 与主文件命名一致，便于管理

### the agent's Discretion

- SparkMD5 库选择（前端 MD5 计算）
- 错误处理细节
- 进度显示优化
- 是否需要后端 hash 验证（防止前端伪造）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 现有实现参考
- `backend/src/services/uploadService.ts` — 当前上传处理逻辑
- `backend/src/services/imageService.ts` — 缩略图生成逻辑
- `backend/src/models/MediaItem.ts` — 媒体项模型
- `backend/src/middlewares/upload.ts` — Multer 配置
- `frontend/src/components/Upload.vue` — 前端上传组件

### 技术参考
- `backend/src/config/storage.ts` — 存储路径配置
- `backend/src/routes/upload.ts` — 上传路由

</canonical_refs>

<specifics>
## Specific Ideas

### Fast-MD5 实现细节

```typescript
// 前端计算 Fast-MD5
async function computeFastMd5(file: File): Promise<string> {
  const fileSize = file.size;
  const chunkSize = Math.min(64 * 1024, fileSize); // 64KB 或文件大小
  const chunk = file.slice(0, chunkSize);

  // 组合: file_size (8 bytes little-endian) + first_64KB
  const sizeBuffer = new ArrayBuffer(8);
  new DataView(sizeBuffer).setBigUint64(0, BigInt(fileSize), true);

  const chunkBuffer = await chunk.arrayBuffer();
  const combined = new Uint8Array(8 + chunkBuffer.byteLength);
  combined.set(new Uint8Array(sizeBuffer), 0);
  combined.set(new Uint8Array(chunkBuffer), 8);

  // 计算 MD5
  const spark = new SparkMD5.ArrayBuffer();
  spark.append(combined);
  return spark.end();
}
```

### API 响应示例

```json
// GET /api/media/check?hash=a1b2c3d4e5f6
// 文件已存在
{
  "success": true,
  "data": {
    "exists": true,
    "mediaItem": {
      "id": "uuid-xxx",
      "filePath": "uploads/works/2026-03/a1b2c3d4e5f6.jpg",
      "thumbnailSmall": "uploads/works/2026-03/a1b2c3d4e5f6_small.jpg",
      "thumbnailLarge": "uploads/works/2026-03/a1b2c3d4e5f6_large.jpg",
      "originalFilename": "photo.jpg",
      "fileType": "image",
      "fileSize": 1234567,
      "fileHash": "a1b2c3d4e5f6"
    }
  }
}

// 文件不存在
{
  "success": true,
  "data": {
    "exists": false
  }
}
```

### 上传流程时序图

```
Frontend                    Backend                     Storage
   |                           |                           |
   |-- compute fast-md5 -----> |                           |
   |                           |                           |
   |-- GET /check?hash=xxx --> |                           |
   |<-- {exists: false} ------ |                           |
   |                           |                           |
   |-- POST /upload ---------> |                           |
   |   (file + hash)           |                           |
   |                           |-- verify hash ------------>|
   |                           |-- save as hash.ext ------> |
   |                           |-- generate thumbnails ---> |
   |<-- {success, mediaItem} - |                           |
   |                           |                           |
```

</specifics>

<deferred>
## Deferred Ideas

- **批量去重迁移** — 现有文件的 hash 计算和去重（风险高，v2 考虑）
- **去重进度 UI** — 批量上传时的去重统计显示
- **完整 MD5 验证** — 上传后计算完整 MD5 验证文件完整性（增加复杂度）
- **P2P 分享去重** — 私密链接分享的去重统计

</deferred>

---

*Phase: 08-file-storage-optimization*
*Context gathered: 2026-03-26*