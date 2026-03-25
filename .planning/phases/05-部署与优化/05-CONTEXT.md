# Phase 5: 部署与优化 - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

完成生产环境部署配置，进行性能优化和安全加固。这是纯基础设施阶段，不涉及新功能开发。

**包含内容：**
- Nginx 反向代理配置
- PM2 进程管理
- SSL 证书配置（Let's Encrypt）
- 静态资源缓存策略
- 日志轮转和备份
- 安全头配置
- 防火墙规则

**不包含：**
- 新功能开发
- 代码重构
- 数据库迁移

</domain>

<decisions>
## Implementation Decisions

### Deployment Strategy
- **D-01:** 使用 PM2 管理 Node.js 进程（cluster 模式）
- **D-02:** 使用 Nginx 作为反向代理和静态资源服务器
- **D-03:** 前端构建后由 Nginx 直接提供静态文件服务

### SSL & Security
- **D-04:** 使用 Let's Encrypt 免费 SSL 证书
- **D-05:** 强制 HTTPS 重定向
- **D-06:** 配置安全 HTTP 头（HSTS、X-Frame-Options 等）

### Performance
- **D-07:** 静态资源启用 Gzip 压缩
- **D-08:** 静态资源设置缓存头（1 年 for hashed assets）
- **D-09:** API 响应不缓存

### Operations
- **D-10:** 日志按天轮转，保留 30 天
- **D-11:** 数据库每日备份，保留 7 天
- **D-12:** 上传文件目录单独备份

### the agent's Discretion
- PM2 具体配置细节（实例数、内存限制）
- Nginx 缓存具体参数
- 日志格式细节

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Environment Configuration
- `backend/.env.example` — 环境变量模板

### Project Configuration
- `backend/package.json` — 后端依赖和脚本
- `frontend/package.json` — 前端依赖和构建脚本

### Existing Server Config
- 无现有部署配置文件

</canonical_refs>

<code_context>
## Existing Code Insights

### Build Outputs
- `frontend/dist/` — 前端构建输出
- `backend/dist/` — 后端编译输出（使用 `npm run build`）

### Static Files
- `uploads/` — 用户上传的文件目录
- `frontend/dist/` — 前端静态资源

### Ports
- Backend API: 3000
- Frontend dev: 5173 (仅开发环境)

### Dependencies
- MySQL 8.0
- Redis 7.2
- Node.js 20 LTS

</code_context>

<specifics>
## Specific Ideas

- 部署流程简单明了，适合单服务器部署
- 优先稳定性而非极致性能
- 安全配置遵循业界最佳实践

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-部署与优化*
*Context gathered: 2026-03-25*