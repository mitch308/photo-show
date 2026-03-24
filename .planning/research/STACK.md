# Stack Research

**Domain:** Photography Studio Portfolio Platform
**Researched:** 2026-03-24
**Confidence:** HIGH

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

```bash
# Frontend (in /frontend)
npm create vite@latest . -- --template vue-ts
npm install vue-router pinia element-plus vueuse axios
npm install -D sass

# Backend (in /backend)
npm init -y
npm install express typeorm mysql2 redis multer sharp fluent-ffmpeg bcrypt jsonwebtoken cors dotenv
npm install -D typescript @types/node @types/express @types/multer @types/bcrypt @types/jsonwebtoken ts-node nodemon vite
```

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

**If high traffic expected (10k+ daily visitors):**
- Add CDN for static files
- Use Redis for full-page caching
- Consider PM2 cluster mode

**If large video files (>500MB):**
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

---
*Stack research for: Photography Studio Portfolio Platform*
*Researched: 2026-03-24*