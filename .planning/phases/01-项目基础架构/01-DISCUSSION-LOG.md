# Phase 1: 项目基础架构 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 01-项目基础架构
**Areas discussed:** 项目结构, 认证实现, API设计, 开发环境, 前端设计

---

## 项目结构

| Option | Description | Selected |
|--------|-------------|----------|
| Monorepo | frontend/ 和 backend/ 在同一仓库，便于统一管理 | ✓ |
| 分开仓库 | 前端和后端分开为两个仓库 | |

**User's choice:** Monorepo
**Notes:** 便于统一版本管理和依赖协调

---

## JWT 存储

| Option | Description | Selected |
|--------|-------------|----------|
| httpOnly Cookie | 更安全，防止 XSS 攻击 | ✓ |
| localStorage | 实现简单，但易受 XSS 攻击 | |

**User's choice:** httpOnly Cookie
**Notes:** 安全性优先

---

## Token 过期策略

| Option | Description | Selected |
|--------|-------------|----------|
| 7天过期 | 安全且无需刷新机制 | |
| 1天过期 + 刷新 | 需要实现 refresh token | |
| 30天过期 | 适合内网环境 | |

**User's choice:** 7天过期 + 刷新
**Notes:** 用户选择了 7 天过期，同时希望有刷新机制

---

## API 响应格式

| Option | Description | Selected |
|--------|-------------|----------|
| 统一格式 | { code, data, message } 格式，便于统一处理 | ✓ |
| 简约风格 | 直接返回数据，HTTP状态码表示结果 | |

**User's choice:** 统一格式
**Notes:** 便于前端统一处理响应

---

## 开发环境配置

| Option | Description | Selected |
|--------|-------------|----------|
| .env 环境变量 | 使用 .env 文件管理配置，便于切换环境 | ✓ |
| 硬编码配置 | 配置文件中硬编码，适合固定环境 | |

**User's choice:** .env 环境变量
**Notes:** 灵活配置，支持多环境部署

---

## 登录页面风格

| Option | Description | Selected |
|--------|-------------|----------|
| 简约风格 | 简洁实用，用户名密码 + 登录按钮 | ✓ |
| 品牌风格 | 包含Logo、背景图等装饰元素 | |

**User's choice:** 简约风格
**Notes:** 功能优先，无需花哨设计

---

## Claude's Discretion

- 数据库表结构设计
- JWT 工具函数封装方式
- 前端路由守卫实现细节
- 错误处理中间件实现

## Deferred Ideas

None — 讨论保持在阶段范围内