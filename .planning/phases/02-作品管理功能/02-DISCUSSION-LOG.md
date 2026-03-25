# Phase 2: 作品管理功能 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 02-作品管理功能
**Areas discussed:** 上传功能, 缩略图生成, 水印功能, 文件存储, 相册管理, 标签管理, 排序方式, 后台界面

---

## 上传交互方式

| Option | Description | Selected |
|--------|-------------|----------|
| 拖拽 + 进度 | 拖拽上传 + 点击选择，显示上传进度条 | ✓ |
| 简约风格 | 简单的文件选择按钮 | |

**User's choice:** 拖拽 + 进度

---

## 单个文件大小限制

| Option | Description | Selected |
|--------|-------------|----------|
| 50MB | 适合单反相机原图，单文件最大 50MB | |
| 100MB | 支持更大文件，但需要更多服务器资源 | |
| 不限制 | 无限制，用户自行控制 | |

**User's choice:** 默认50MB，支持修改配置

---

## 缩略图尺寸

| Option | Description | Selected |
|--------|-------------|----------|
| 3种尺寸 | 小(300px)、中(800px)、大(1200px) | |
| 2种尺寸 | 小(300px)、大(1200px)，简化实现 | ✓ |
| 自适应 | 根据原图比例自适应 | |

**User's choice:** 2种尺寸

---

## 视频缩略图

| Option | Description | Selected |
|--------|-------------|----------|
| 生成缩略图 | 为视频生成缩略图预览，支持播放 | ✓ |
| 不处理 | 视频直接展示，不生成缩略图 | |

**User's choice:** 生成缩略图

---

## 水印默认设置

| Option | Description | Selected |
|--------|-------------|----------|
| 默认开启 | 所有公开展示的作品自动添加水印 | ✓ |
| 默认关闭 | 管理员需要手动开启水印 | |

**User's choice:** 默认开启

---

## 水印类型

| Option | Description | Selected |
|--------|-------------|----------|
| 文字水印 | 摄影师可以设置工作室名称作为水印文字 | |
| 图片水印 | 支持上传透明 PNG 作为 Logo 水印 | |
| 两者都支持 | 文字和图片水印都支持，管理员自选 | ✓ |

**User's choice:** 两者都支持

---

## 作品管理视图

| Option | Description | Selected |
|--------|-------------|----------|
| 表格视图 | 显示缩略图、标题、状态、操作按钮，适合管理大量作品 | ✓ |
| 网格视图 | 以卡片形式展示作品，更直观但占用空间 | |

**User's choice:** 表格视图

---

## 视频格式支持

| Option | Description | Selected |
|--------|-------------|----------|
| 常见格式 | mp4 和 webm，覆盖大多数场景 | |
| 扩展格式 | 包括 MOV、AVI 等专业相机格式 | ✓ |
| 只支持照片 | 先只支持照片，视频后续添加 | |

**User's choice:** 扩展格式

---

## 水印位置

| Option | Description | Selected |
|--------|-------------|----------|
| 5个位置 | 左上、右上、左下、右下、居中 | ✓ |
| 固定右下角 | 仅右下角，简化选项 | |
| 9个位置 | 支持 9 宫格任意位置 | |

**User's choice:** 5个位置

---

## 文件存储组织

| Option | Description | Selected |
|--------|-------------|----------|
| 按年月目录 | uploads/works/年月/，便于管理和备份 | ✓ |
| 按相册目录 | uploads/works/{album_id}/，与相册关联 | |
| 扁平目录 | uploads/works/，所有文件在同一目录 | |

**User's choice:** 按年月目录

---

## 相册关系

| Option | Description | Selected |
|--------|-------------|----------|
| 单相册 | 一个作品只能属于一个相册 | |
| 多相册 | 一个作品可以同时出现在多个相册中 | ✓ |

**User's choice:** 多相册（多对多关系）

---

## 标签管理

| Option | Description | Selected |
|--------|-------------|----------|
| 预设标签 | 管理员可以创建、编辑、删除标签，作品可以选择现有标签 | ✓ |
| 自由输入 | 输入时自动创建新标签，类似于博客标签系统 | |

**User's choice:** 预设标签

---

## 排序方式

| Option | Description | Selected |
|--------|-------------|----------|
| 拖拽排序 | 拖拽作品调整顺序，直观易用 | ✓ |
| 数字排序 | 设置数字排序值，精确控制 | |

**User's choice:** 拖拽排序

---

## 删除确认

| Option | Description | Selected |
|--------|-------------|----------|
| 需要确认 | 删除作品或相册时弹出确认对话框 | ✓ |
| 直接删除 | 点击删除直接执行 | |

**User's choice:** 需要确认

---

## Claude's Discretion

- 数据库表结构设计（Works、Albums、Tags 及关联表）
- Multer 上传中间件配置
- Sharp 图片处理参数
- FFmpeg 视频缩略图提取

## Deferred Ideas

None — discussion stayed within phase scope