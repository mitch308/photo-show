<!-- GSD:project-start source:PROJECT.md -->
## Project

**摄影工作室作品展示平台**

一个面向摄影工作室的作品展示与管理平台。摄影师可以上传、管理作品，通过公开画廊展示作品，也可生成私密链接分享给特定客户，客户可通过私密链接下载高清无水印原图。

**Core Value:** 让摄影师轻松管理作品，让客户优雅地查看和获取作品。

### Constraints

- **技术栈**: 前端 Vue3 + TypeScript + Vite，后端 Node + TypeScript + Vite — 开发团队熟悉这些技术，快速开发
- **数据库**: MySQL 存储长期数据，Redis 做缓存和短期数据 — 可靠性与性能兼顾
- **文件存储**: 本地存储 — 成本可控，部署简单
- **部署环境**: 自有服务器 — 数据完全掌控
- **UI风格**: 支持深色/浅色主题切换 — 适应不同用户偏好
- **响应式**: 支持电脑、手机、平板 — 多设备访问
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vue 3 | ^3.4 | Frontend Framework | Composition API for better code organization, excellent performance, developer chose |
| TypeScript | ^5.3 | Type Safety | Full-stack type consistency, better IDE support, catch errors at compile time |
| Vite | ^5.0 | Build Tool | Fast HMR, native ESM, excellent Vue support, developer chose |
| Node.js | ^20 LTS | Backend Runtime | Same language as frontend, excellent async I/O for file handling |
| Express | ^4.18 | Backend Framework | Mature, minimal, extensive middleware ecosystem |
| MySQL | ^8.0 | Primary Database | Relational data (users, works, categories), ACID compliance, developer chose |
| Redis | ^7.2 | Cache & Session | Fast key-value store for sessions, view counts, link tokens, developer chose |
### Supporting Libraries - Frontend
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vue Router | ^4.2 | Routing | SPA navigation, lazy loading routes |
| Pinia | ^2.1 | State Management | Global state (user, theme, gallery) |
| Element Plus | ^2.5 | UI Components | Admin panel, forms, tables |
| VueUse | ^10.7 | Composition Utilities | Theme switching, responsive detection |
| Axios | ^1.6 | HTTP Client | API requests with interceptors |
| Sharp (server) | ^0.33 | Image Processing | Thumbnails, watermarks, resizing |
### Supporting Libraries - Backend
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeORM | ^0.3 | ORM | Database models, migrations, relations |
| Multer | ^1.4 | File Upload | Handling multipart/form-data |
| JWT | ^9.0 | Authentication | Stateless admin auth tokens |
| Bcrypt | ^5.1 | Password Hashing | Secure password storage |
| Sharp | ^0.33 | Image Processing | Watermark, resize, format conversion |
| Fluent-FFmpeg | ^2.2 | Video Processing | Video thumbnails, transcoding |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint + Prettier | Linting & Formatting | Airbnb config base |
| Vitest | Unit Testing | Fast, Vite-native |
| TypeScript ESLint | TS Linting Rules | Strict mode recommended |
## Installation
# Frontend (in /frontend)
# Backend (in /backend)
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Express | Fastify | When performance is critical (100k+ req/s) |
| TypeORM | Prisma | When prefering schema-first approach, better TypeScript inference |
| Element Plus | Naive UI | When preferring more minimal design system |
| Sharp | Jimp | When needing pure JS (no native dependencies) |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Vuex | Vue 3 prefers Pinia, better TypeScript support | Pinia |
| moment.js | Large bundle size, mutable API | date-fns or dayjs |
| Body-parser | Built into Express 4.16+ | express.json() |
| localStorage for tokens | XSS vulnerable | httpOnly cookies + JWT |
## Stack Patterns by Variant
- Add CDN for static files
- Use Redis for full-page caching
- Consider PM2 cluster mode
- Use streaming upload (multipart with chunks)
- Consider separate video processing queue
- Store videos on separate subdomain
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Vue 3.4+ | Vite 5.x | Requires Vite 4.3+ for full features |
| TypeScript 5.x | Vue 3.3+ | Vue 3.3+ has improved TS support |
| TypeORM 0.3 | Node 18+ | Node 18+ recommended for performance |
| Sharp 0.33 | Node 18+ | Prebuilt binaries for Node 18+ |
## Sources
- Vue 3 official documentation — Composition API patterns
- TypeORM documentation — MySQL integration
- Sharp documentation — Image processing performance
- Personal experience — Photography platform development patterns
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
