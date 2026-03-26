# Phase 7: Bug 修复 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

修复三个核心功能问题：水印集成、下载修复、浏览量统计。不新增功能，仅修复现有代码中的问题。

</domain>

<decisions>
## Implementation Decisions

### 水印功能 (BUG-01)

- **D-01:** 水印配置采用全局默认设置，存储在系统配置表中
- **D-02:** 水印在上传时生成，应用于缩略图；原图保留无水印
- **D-03:** 公开展示使用带水印的缩略图，私密下载返回无水印原图
- **D-04:** 水印配置项：位置（九宫格）、透明度（0-1）、文字/图片路径

### 下载功能 (BUG-02)

- **D-05:** 修复下载返回 JSON 的问题，确保返回源文件
- **D-06:** 扩展功能：支持选择特定文件下载（多个 MediaItem 时）
- **D-07:** 扩展功能：支持打包下载（ZIP），作为 Phase 7+ 或单独需求

### 浏览量统计 (BUG-03)

- **D-08:** 公开画廊访问作品详情页时，作品 viewCount 递增
- **D-09:** 私密分享访问通过 AccessLog 单独记录，不影响作品 viewCount
- **D-10:** 已有实现：`publicService.getPublicWorkById()` 会递增 viewCount

### the agent's Discretion

- 水印配置存储结构（JSON 字段 vs 单独表）
- ZIP 打包库选择（archiver vs jszip）
- 是否在本 Phase 实现 ZIP 打包（取决于复杂度）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 水印功能
- `backend/src/services/imageService.ts` — addWatermark 方法已实现
- `.planning/research/SUMMARY.md` — 水印集成方案研究

### 下载功能
- `backend/src/routes/share.ts` — 下载路由已实现，需检查流式传输
- `frontend/src/stores/share.ts` — 前端下载逻辑

### 浏览量统计
- `backend/src/services/publicService.ts` — getPublicWorkById 已递增 viewCount
- `backend/src/routes/public.ts` — 公开 API 路由

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ImageService.addWatermark()`: 已实现水印叠加功能，支持文字和图片水印
- `publicService.getPublicWorkById()`: 已在获取作品时递增 viewCount
- `share.ts` 下载路由: 已实现流式文件传输

### Established Patterns
- Sharp 处理图片：缩略图生成使用 Sharp 库
- 流式下载：使用 `fs.createReadStream().pipe(res)`
- AccessLog 记录：私密分享访问已有完整日志记录

### Integration Points
- 上传流程：`uploadService` → `imageService.generateThumbnails()` → 需添加水印步骤
- 公开展示：`publicService.getPublicWorks()` → 返回缩略图路径
- 私密下载：`/api/share/:token/download/:workId` → 返回原图

</code_context>

<specifics>
## Specific Ideas

- 水印全局配置：管理员可在后台设置默认水印（文字/图片、位置、透明度）
- 下载增强：支持多文件作品选择特定文件下载
- ZIP 打包下载：作为后续扩展，暂不在本 Phase 实现

</specifics>

<deferred>
## Deferred Ideas

- ZIP 打包下载功能 — 可作为 Phase 7 扩展或单独需求
- 浏览量去重（会话/IP）— v2 需求 VIEW-01/02
- 每作品独立水印设置 — 当前采用全局默认

</deferred>

---

*Phase: 07-bug*
*Context gathered: 2026-03-26*