# Phase 11: 工作室介绍 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** ROADMAP.md Phase 11 definition

<domain>
## Phase Boundary

Phase 11 实现工作室介绍功能，让访客可以了解工作室信息：
1. **STUD-01: 基本信息配置** — 管理员在后台配置名称、Logo、联系方式
2. **STUD-02: 富文本介绍** — 管理员使用富文本编辑器编辑工作室介绍内容
3. **STUD-03: 前台展示** — 访客在前台查看工作室介绍页面

</domain>

<decisions>
## Implementation Decisions

### STUD-01: 基本信息字段

#### D-01: 字段定义
- **决策:** 工作室基本信息包含：
  - `name` (string, 必填) — 工作室名称
  - `logo` (string, 可选) — Logo 图片路径
  - `phone` (string, 可选) — 联系电话
  - `email` (string, 可选) — 邮箱地址
  - `address` (string, 可选) — 工作室地址

#### D-02: 数据存储
- **决策:** 使用现有 SystemSettings key-value 模式存储
- **key:** `studio_info`
- **理由:** 与水印配置保持一致，无需新建表

#### D-03: Logo 上传
- **决策:** 复用现有上传逻辑，存储在 uploads 目录
- **理由:** 与水印图片上传模式一致

### STUD-02: 富文本编辑器

#### D-04: 编辑器选择
- **决策:** 使用 wangEditor (轻量级富文本编辑器)
- **理由:**
  - 中文文档完善
  - Vue 3 支持良好
  - 体积小 (~50KB gzipped)
  - 功能满足需求（文字格式、图片、链接）

#### D-05: XSS 防护
- **决策:** 使用 sanitize-html 过滤用户输入
- **理由:** ROADMAP 风险登记明确要求
- **实现:**
  ```typescript
  import sanitizeHtml from 'sanitize-html';
  
  const cleanHtml = sanitizeHtml(userInput, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img'],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'title']
    }
  });
  ```

#### D-06: 介绍内容存储
- **决策:** 作为 studio_info 配置的 `description` 字段存储
- **格式:** HTML 字符串

### STUD-03: 前台展示

#### D-07: 页面路由
- **决策:** 独立页面 `/about`
- **理由:**
  - 内容独立，便于 SEO
  - 不影响首页画廊展示
  - 可扩展性强

#### D-08: 导航入口
- **决策:** 在前台 header 导航栏添加"关于我们"链接
- **位置:** 位于"管理登录"链接左侧

#### D-09: 联系方式展示
- **决策:** 使用图标 + 文字形式展示
- **图标库:** Element Plus 内置图标或独立 SVG
- **布局:** 卡片式布局，图标在左，文字在右

### Agent's Discretion

- 具体页面样式（间距、颜色、字体）
- 默认占位图/占位文字
- 空状态处理（未配置时显示什么）
- 移动端响应式细节

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 后端模式（复用）
- `backend/src/models/SystemSettings.ts` — key-value 设置存储模型
- `backend/src/services/settingsService.ts` — 设置服务，get/set 模式
- `backend/src/routes/settings.ts` — 设置路由定义

### 前端模式（复用）
- `frontend/src/views/admin/Settings.vue` — 后台设置页面模板
- `frontend/src/api/settings.ts` — 设置 API 调用
- `frontend/src/views/Home.vue` — 前台页面结构、header 导航

### 路由配置
- `frontend/src/router/index.ts` — 路由定义

### 类型定义
- `frontend/src/types/settings.ts` — 设置类型定义

</canonical_refs>

<specifics>
## Specific Ideas

### 后端 API 设计

```typescript
// GET /api/settings/studio
// 返回工作室信息
interface StudioInfo {
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;  // HTML 富文本
}

// PUT /api/settings/studio
// 更新工作室信息（需管理员权限）

// POST /api/settings/studio/logo
// 上传 Logo 图片
```

### 前端类型定义

```typescript
// frontend/src/types/settings.ts
export interface StudioInfo {
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
}
```

### 前台 About 页面结构

```vue
<!-- frontend/src/views/About.vue -->
<template>
  <div class="about-page">
    <header class="header">
      <h1>摄影工作室</h1>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/login">管理登录</router-link>
      </nav>
    </header>
    
    <main class="main">
      <div class="studio-header">
        <img v-if="studioInfo.logo" :src="studioInfo.logo" class="logo" />
        <h1>{{ studioInfo.name }}</h1>
      </div>
      
      <div class="contact-info">
        <div v-if="studioInfo.phone" class="contact-item">
          <el-icon><Phone /></el-icon>
          <span>{{ studioInfo.phone }}</span>
        </div>
        <div v-if="studioInfo.email" class="contact-item">
          <el-icon><Message /></el-icon>
          <span>{{ studioInfo.email }}</span>
        </div>
        <div v-if="studioInfo.address" class="contact-item">
          <el-icon><Location /></el-icon>
          <span>{{ studioInfo.address }}</span>
        </div>
      </div>
      
      <div class="description" v-html="studioInfo.description"></div>
    </main>
  </div>
</template>
```

### 后台设置页面扩展

在现有 Settings.vue 中新增"工作室信息"卡片，包含：
- 基本信息表单
- Logo 上传
- 富文本编辑器

</specifics>

<deferred>
## Deferred Ideas

- **社交媒体链接** — 微信、微博、抖音等 — 可作为后续扩展
- **SEO 信息配置** — 页面 title、description、keywords — v2 考虑
- **工作时间配置** — 营业时间展示 — 低优先级
- **地图集成** — 地址关联地图显示 — 增加复杂度

</deferred>

---

*Phase: 11-工作室介绍*
*Context gathered: 2026-03-26*