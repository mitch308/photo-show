# Phase 1: 项目基础架构 - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

搭建前后端基础框架，实现管理员认证能力。

**交付内容：**
- 可运行的前后端项目骨架
- 数据库连接和基础表结构
- 管理员登录/退出功能
- JWT 认证中间件

**不包含：**
- 作品上传功能（Phase 2）
- 前端页面样式完善（后续迭代）

</domain>

<decisions>
## Implementation Decisions

### 项目结构

- **D-01:** 采用 Monorepo 结构，frontend/ 和 backend/ 在同一仓库
  - 便于统一版本管理和依赖协调
  - 共享 TypeScript 类型定义

### 认证实现

- **D-02:** JWT 存储在 httpOnly Cookie 中，防止 XSS 攻击
- **D-03:** Access Token 过期时间 7 天，同时实现 Refresh Token 机制
  - Access Token: 7 天有效期
  - Refresh Token: 30 天有效期
  - 退出登录时将 Token 加入 Redis 黑名单
- **D-04:** 默认管理员账号在数据库初始化时创建

### API 设计

- **D-05:** 后端 API 采用统一响应格式：
  ```typescript
  {
    code: number,    // 0=成功，非0=错误码
    data: any,       // 响应数据
    message: string  // 提示信息
  }
  ```
- **D-06:** HTTP 状态码用于表示请求状态，业务状态通过 code 字段表示

### 开发环境

- **D-07:** 使用 .env 文件管理环境变量
  - 数据库连接配置
  - Redis 连接配置
  - JWT 密钥
  - 端口号等
- **D-08:** 提供示例配置文件 .env.example

### 前端设计

- **D-09:** 登录页面采用简约风格
  - 用户名/密码输入框
  - 登录按钮
  - 错误提示
  - 无多余装饰元素

### Claude's Discretion

- 数据库表结构设计（管理员表）
- JWT 工具函数封装方式
- 前端路由守卫实现细节
- 错误处理中间件实现

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 技术栈文档
- `.planning/research/STACK.md` — 推荐的技术栈和库版本
- `.planning/research/ARCHITECTURE.md` — 项目结构建议

### 需求文档
- `.planning/REQUIREMENTS.md` — AUTH-01, AUTH-02, AUTH-03 详细需求

### 项目约束
- `.planning/PROJECT.md` — 技术栈约束和设计决策

</canonical_refs>

<code_context>
## Existing Code Insights

### 项目现状
- 空项目，无现有代码
- 仅包含 .planning/ 目录和配置文件

### 需要创建的内容
- frontend/ — Vue3 前端项目
- backend/ — Node/Express 后端项目
- 数据库初始化脚本
- 环境配置文件

</code_context>

<specifics>
## Specific Ideas

- 登录页面简洁实用，不需要花哨设计
- 配置通过 .env 文件管理，支持灵活部署

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-项目基础架构*
*Context gathered: 2026-03-24*