<objective>
Research how to implement Phase 3: 公开展示与私密分享
Answer: "What do I need to know to PLAN this phase well?"
</objective>

<files_to_read>
- .planning/phases/03-公开展示与私密分享/03-CONTEXT.md (USER DECISIONS from /gsd-discuss-phase)
- .planning/REQUIREMENTS.md (Project requirements)
- .planning/STATE.md (Project decisions and history)
- .planning/research/STACK.md (Technical stack)
- backend/src/models/Work.ts (Work entity structure)
- backend/src/config/redis.ts (Redis configuration)
- backend/src/services/workService.ts (Existing work service patterns)
</files_to_read>

<additional_context>
**Phase description:** 实现公开画廊和私密链接分享功能，让客户可以查看和下载作品

**Phase requirement IDs (MUST address):** PUBL-01, PUBL-02, PUBL-03, PUBL-04, PUBL-05, PUBL-06, PUBL-07, PRIV-01, PRIV-02, PRIV-03, PRIV-04

**Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
**Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, research should account for project skill patterns

**Key research topics for this phase:**
1. CSS Grid 瀑布流实现最佳实践 - 纯 CSS 方案，响应式列数
2. 私密链接 Token 安全设计 - crypto.randomBytes + Redis TTL 过期机制
3. 响应式移动端适配模式 - 断点设计，移动端交互
4. Lightbox 组件交互设计 - 图片查看器，前后导航
5. 图片懒加载和无限滚动 - Intersection Observer API，性能优化

**Locked decisions from CONTEXT.md (MUST follow):**
- D-01: 瀑布流使用 CSS Grid 实现，无需第三方库
- D-02: 公开 API 不需要认证，验证 isPublic=true
- D-03: 首页加载 20 张作品，滚动加载更多
- D-04: 图片懒加载使用 Intersection Observer API
- D-05: 筛选状态通过 URL 参数同步
- D-06: 搜索使用数据库 LIKE 查询
- D-07: 响应式断点 < 768px / 768-1024px / > 1024px
- D-09: Token 使用 crypto.randomBytes(32).toString('base64url')
- D-10: Token 存储在 Redis，使用 TTL 实现自动过期
- D-11: 默认过期时间 7 天，可选 1/7/30 天
- D-12: 私密链接支持选择多个作品
- D-13: 下载原图需要验证 token 有效性
- D-14: 下载 API: GET /api/share/{token}/download/{workId}

**Existing infrastructure (Phase 1 & 2 built):**
- Express backend with auth middleware
- TypeORM models: Work, Album, Tag (with isPublic, viewCount, downloadCount fields)
- Redis client configured (used for JWT blacklist)
- Image processing service (Sharp, watermark support)
- Vue 3 frontend with Pinia stores
</additional_context>

<output>
Write to: .planning/phases/03-公开展示与私密分享/03-RESEARCH.md
</output>
