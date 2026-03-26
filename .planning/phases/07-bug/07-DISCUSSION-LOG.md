# Phase 7: Bug 修复 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 07-bug
**Mode:** discuss
**Areas discussed:** 水印配置, 水印应用时机, 下载行为, 浏览量逻辑

---

## 水印配置方式

| Option | Description | Selected |
|--------|-------------|----------|
| 全局默认 | 管理员在后台设置默认水印配置 | ✓ |
| 每作品独立 | 每个作品可单独设置水印 | |

**User's choice:** 全局默认
**Notes:** 简化配置，管理员统一管理

---

## 水印应用时机

| Option | Description | Selected |
|--------|-------------|----------|
| 上传时生成 | 上传时生成带水印缩略图，原图保留 | ✓ |
| 展示时动态 | 每次展示时动态叠加水印 | |

**User's choice:** 上传时生成
**Notes:** 性能更好，原图无水印便于私密下载

---

## 下载行为

| Option | Description | Selected |
|--------|-------------|----------|
| 下载第一个文件 | 默认下载作品的第一个 MediaItem | |
| 支持选择特定文件 | 用户可选择下载哪个文件 | ✓ |
| 打包下载 | 支持打包下载所有文件（ZIP） | ✓ (扩展) |

**User's choice:** 支持选择特定文件 + 打包下载
**Notes:** 打包下载作为扩展功能，可能单独处理

---

## 浏览量逻辑

| Option | Description | Selected |
|--------|-------------|----------|
| 公开+私密都计数 | 所有访问都递增 viewCount | |
| 仅公开计数 | 公开画廊访问计数，私密分享单独记录 | ✓ |

**User's choice:** 仅公开计数，私密分享单独记录
**Notes:** 私密分享通过 AccessLog 记录，已有实现

---

## the agent's Discretion

- ZIP 打包库选择
- 是否在本 Phase 实现 ZIP 打包

## Deferred Ideas

- ZIP 打包下载 — 扩展功能，可单独处理
- 浏览量去重 — v2 需求