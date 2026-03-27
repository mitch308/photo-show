# Phase 16: 布局优化 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 16-布局优化
**Areas discussed:** 侧边栏滚动, 卡片宽度

---

## 侧边栏滚动

| Option | Description | Selected |
|--------|-------------|----------|
| 仅 .nav 滚动 | 只需添加 overflow-y: auto 和 min-height: 0，改动最小 | ✓ |
| 不需要独立滚动 | 保持现状，导航项少时无需独立滚动 | |

**User's choice:** 仅 .nav 滚动
**Notes:** 最小改动方案，仅影响导航区域

---

## 卡片宽度

| Option | Description | Selected |
|--------|-------------|----------|
| 完全自适应 | 移除 max-width 限制，卡片填满可用空间 | ✓ |
| 响应式区间 | 设置 min-width 和 max-width，有上下限 | |
| 保持现状 | 保持当前 600px 固定宽度 | |

**User's choice:** 完全自适应
**Notes:** 系统设置表单内容较多，宽屏下可以利用更多空间

---

## Claude's Discretion

- 滚动条样式（使用浏览器默认或自定义）
- 卡片内边距调整（如需要）

## Deferred Ideas

None — discussion stayed within phase scope