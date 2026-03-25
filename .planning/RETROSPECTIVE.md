# Project Retrospective

## Milestone: v1.0 — 摄影工作室作品展示平台

**Shipped:** 2026-03-25
**Phases:** 6 | **Plans:** 27

### What Was Built

- 项目基础架构：前后端分离，JWT 认证，Redis 会话
- 作品管理：上传、编辑、删除、相册、标签、水印
- 公开展示：瀑布流画廊、搜索、筛选、响应式设计
- 私密分享：安全 token、过期时间、访问记录
- 增强功能：批量操作、统计、客户管理、主题切换
- 部署优化：PM2 cluster、Nginx、SSL、备份策略
- 数据模型重构：作品支持多个媒体项

### What Worked

- GSD 工作流保持开发有序，每个阶段目标明确
- TypeScript 全栈开发，类型安全减少了运行时错误
- Vue 3 Composition API 提高了代码复用性
- Element Plus 组件库加速了 UI 开发
- 验证阶段发现了安全漏洞（登出未调用 API）并及时修复

### What Was Inefficient

- Phase 1-2 的代码在 GSD 流程之前已完成，需要额外验证工作
- 前端构建时有 TypeScript 类型定义缺失警告（不影响功能）
- 部分计划没有单独的 SUMMARY.md，需要补充

### Patterns Established

- 文件上传使用 Multer + Sharp 处理
- 私密 token 使用 crypto.randomBytes 生成
- 统计数据使用 Redis INCR + 定期同步 MySQL
- 主题使用 VueUse useDark + CSS 变量

### Key Lessons

1. 安全功能（如登出）需要端到端验证，不能只验证前端行为
2. 数据模型变更需要提前规划迁移策略
3. 部署配置应该尽早准备，与开发并行

### Cost Observations

- 6 个阶段在 2 天内完成
- 主要使用单一模型完成所有工作
- 代码质量通过测试和类型检查保证