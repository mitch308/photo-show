# Phase 12: 相册分享 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 12-相册分享
**Areas discussed:** Token 结构, API 设计, 前端入口, 客户端页面

---

## 分享 Token 结构

| Option | Description | Selected |
|--------|-------------|----------|
| 扩展现有 ShareTokenData | 添加 albumId 字段，workIds 快照存储 | ✓ |
| 新建 AlbumShareTokenData | 独立结构，动态解析相册作品 | |

**User's choice:** 扩展现有结构
**Notes:** 保持与现有分享机制一致，便于统一管理

---

## 后端 API 设计

| Option | Description | Selected |
|--------|-------------|----------|
| 新增 /api/admin/album-share | 专用端点，返回相同格式 | ✓ |
| 复用 /api/admin/share | 在现有端点添加 albumId 参数 | |

**User's choice:** 新增专用端点
**Notes:** 语义清晰，便于前端区分

---

## 前端管理入口

| Option | Description | Selected |
|--------|-------------|----------|
| 相册管理页面添加分享按钮 | 在 Albums.vue 行操作区域 | ✓ |
| 分享管理页面添加创建入口 | 在 Shares.vue 添加相册选择器 | |

**User's choice:** 相册管理页面添加
**Notes:** 操作入口靠近数据源，符合用户习惯

---

## 客户端访问页面

| Option | Description | Selected |
|--------|-------------|----------|
| 复用 Share.vue | 根据 token 数据动态显示标题 | ✓ |
| 新建 AlbumShare.vue | 专用相册分享页面 | |

**User's choice:** 复用现有页面
**Notes:** 减少代码重复，保持一致性

---

## Claude's Discretion

- 对话框 UI 细节
- 错误提示文案
- 分享成功后的反馈方式

## Deferred Ideas

None — discussion stayed within phase scope