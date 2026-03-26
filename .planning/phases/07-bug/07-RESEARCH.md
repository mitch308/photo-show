# Phase 7: Bug 修复 - Research

**Phase:** 07-bug
**Researched:** 2026-03-26
**Goal:** 核心功能按预期工作

## Requirements Coverage

| Requirement | Description | Status |
|-------------|-------------|--------|
| BUG-01 | 管理员可以为作品配置水印，公开展示时自动应用水印 | Needs Implementation |
| BUG-02 | 客户通过私密链接下载文件时返回源文件而非 JSON | Needs Diagnosis |
| BUG-03 | 作品浏览量在访问时正确递增 | Needs Fix |

---

## BUG-01: 水印功能集成

### Current State Analysis

**Existing Assets:**
- `imageService.addWatermark()` — 完整实现 (imageService.ts:52-98)
  - 支持文字和图片水印
  - 支持 5 个位置 (top-left, top-right, bottom-left, bottom-right, center)
  - 支持透明度控制 (0-1)
  - 使用 Sharp 库的 composite 方法

**Missing Components:**
- `SystemSettings` 模型 — 不存在
- `settingsService` — 不存在
- 水印配置 API 端点 — 不存在
- 前端设置界面 — 不存在

**Current Upload Flow:**
```typescript
// uploadService.ts:86-104
async processImage(file: Express.Multer.File): Promise<UploadResult> {
  const { dir, monthDir } = getUploadPath();
  
  // 只生成缩略图，不添加水印
  const thumbnails = await imageService.generateThumbnails(
    file.path,
    dir,
    file.originalname
  );
  
  return { ... };
}
```

### Implementation Approach

**Per D-01 to D-04 (from CONTEXT.md):**
1. 创建 `SystemSettings` 模型存储水印配置
2. 创建 `settingsService` 提供配置存取
3. 修改 `uploadService.processImage()` 在生成缩略图后应用水印
4. 创建 API 端点 GET/PUT `/api/settings/watermark`
5. 创建前端管理界面

**Watermark Configuration Schema:**
```typescript
interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image';
  text?: string;
  imagePath?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number; // 0-1
}
```

**Key Integration Point:**
- 上传流程：`uploadService.processImage()` → `imageService.generateThumbnails()` → **添加水印步骤**
- 原则：原图不修改，只给缩略图添加水印

---

## BUG-02: 下载文件修复

### Current State Analysis

**Backend Implementation (share.ts:66-145):**
```typescript
router.get('/:token/download/:workId', async (req, res) => {
  // 1. 验证 token
  // 2. 验证 workId 在 share 中
  // 3. 获取作品信息
  // 4. 确定下载文件（优先 mediaItems[0]，否则 legacy filePath）
  // 5. 设置响应头
  res.setHeader('Content-Disposition', `attachment; filename="..."`);
  res.setHeader('Content-Type', mimeType);
  // 6. 流式传输
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});
```

**Frontend Implementation (stores/share.ts:61-72):**
```typescript
async downloadWork(workId: string) {
  const url = this.getDownloadUrl(workId);
  if (!url) return;
  
  // 创建 <a> 元素触发下载
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

**API URL Generation (api/share.ts:52-54):**
```typescript
getDownloadUrl(token: string, workId: string): string {
  return `${api.defaults.baseURL}/share/${token}/download/${workId}`;
}
```

### Diagnosis

**Backend:** 看起来正确，使用流式传输，设置了正确的响应头。

**Frontend:** 实现方式正确，创建 `<a>` 元素触发浏览器下载。

**Potential Issues:**
1. `link.download = ''` 可能在某些浏览器中不正确设置文件名
2. 如果有 axios 拦截器影响请求，可能出问题
3. CORS 配置可能影响跨域请求

**Testing Required:**
- 在浏览器中实际测试下载流程
- 检查 Network 面板确认响应头
- 验证下载的文件是源文件而非 JSON

### Enhancement Opportunity (D-06)

当前实现只下载作品的第一个文件。多文件作品可能需要：
- 显示所有 mediaItems 列表
- 每个文件独立下载按钮
- 或使用 `/:token/download/:workId/media/:mediaId` 端点

---

## BUG-03: 浏览量统计修复

### Current State Analysis

**Backend Implementation (publicService.ts:125-142):**
```typescript
async getPublicWorkById(id: string): Promise<Work | null> {
  const work = await this.workRepo.findOne({
    where: { id, isPublic: true },
    relations: ['albums', 'tags', 'mediaItems'],
  });

  if (work) {
    // ✅ 正确递增 viewCount
    await this.workRepo.increment({ id }, 'viewCount', 1);
  }

  return work;
}
```

**Frontend Flow (Home.vue):**
```typescript
// 用户点击作品
const openLightbox = (work: Work) => {
  selectedWork.value = work;  // 直接使用列表中的数据
  lightboxOpen.value = true;
};
```

### Root Cause

**问题：** 前端从不调用 `/api/public/works/:id`

- 列表 API `/api/public/works` 返回所有作品数据
- Lightbox 直接使用列表中的数据
- 单个作品 API `/api/public/works/:id` 未被调用
- 因此 `viewCount` 永远不会递增

### Solutions

**Option A: 调用详情 API（推荐）**
```typescript
// 在 openLightbox 中调用详情 API
const openLightbox = async (work: Work) => {
  // 调用详情 API 触发 viewCount 递增
  const detail = await publicApi.getWork(work.id);
  selectedWork.value = detail;
  lightboxOpen.value = true;
};
```

**Option B: 单独的浏览记录端点**
```typescript
// 新增 POST /api/public/works/:id/view
router.post('/works/:id/view', async (req, res) => {
  await publicService.incrementViewCount(req.params.id);
  res.json(successResponse(null));
});

// 前端调用
await publicApi.recordView(work.id);
```

**Option C: 在列表 API 中记录（不推荐）**
- 问题：滚动加载会重复计数

**Per D-08, D-09:**
- 公开画廊访问 → viewCount 递增 ✓
- 私密分享访问 → 不影响 viewCount（已通过 accessLogService 分离）

---

## Validation Architecture

### Testing Strategy

**BUG-01 (水印):**
```bash
# 1. 配置水印
curl -X PUT http://localhost:3000/api/settings/watermark \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"enabled":true,"type":"text","text":"©工作室","position":"bottom-right","opacity":0.5}'

# 2. 上传图片
curl -X POST http://localhost:3000/api/admin/works \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test.jpg"

# 3. 验证缩略图有水印，原图无水印
```

**BUG-02 (下载):**
```bash
# 1. 创建私密链接
# 2. 在浏览器中打开链接
# 3. 点击下载，检查：
#    - Network 面板响应头 Content-Disposition
#    - 下载的文件是否为源文件
#    - 文件名是否正确
```

**BUG-03 (浏览量):**
```bash
# 1. 记录当前 viewCount
SELECT id, viewCount FROM works WHERE id = 'xxx';

# 2. 在浏览器中访问公开画廊
# 3. 点击查看作品详情
# 4. 再次查询 viewCount，应递增
SELECT id, viewCount FROM works WHERE id = 'xxx';
```

### Integration Points

| Bug | Frontend Entry | Backend Endpoint | Database |
|-----|---------------|------------------|----------|
| BUG-01 | Settings.vue | /api/settings/watermark | system_settings |
| BUG-02 | Share.vue → downloadWork() | /api/share/:token/download/:workId | works, media_items |
| BUG-03 | Home.vue → openLightbox() | /api/public/works/:id | works.viewCount |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| 水印影响原图质量 | Medium | 只修改缩略图，原图保持不变 |
| 大文件水印处理慢 | Low | Sharp 已优化，应无问题 |
| 浏览器下载兼容性 | Medium | 测试主流浏览器 |
| viewCount 并发问题 | Low | TypeORM increment 使用原子操作 |

---

## Dependencies

**Phase 7 depends on:** Phase 6 (数据模型重构)

**Required from Phase 6:**
- `MediaItem` 模型（多文件作品支持）
- `Work.mediaItems` 关系

**All dependencies are in place.**

---

## Research Conclusion

**Ready for Planning:** ✓

**Key Findings:**
1. BUG-01 需要完整实现水印配置系统，现有 `addWatermark()` 方法可直接使用
2. BUG-02 后端实现正确，需要诊断前端是否正确触发下载
3. BUG-03 根因是前端不调用详情 API，需要修改前端逻辑

**Existing Plans Assessment:**
- 现有 3 个计划 (07-01, 07-02, 07-03) 正确覆盖所有需求
- 计划结构与代码分析一致
- 可直接执行现有计划

---

*Research completed: 2026-03-26*