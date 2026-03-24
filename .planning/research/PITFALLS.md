# Pitfalls Research

**Domain:** Photography Studio Portfolio Platform
**Researched:** 2026-03-24
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: 大文件上传超时

**What goes wrong:**
上传大尺寸照片（如 50MB RAW 文件）时，请求超时或内存溢出，服务器崩溃。

**Why it happens:**
默认 Express body-parser 将整个文件加载到内存，大文件占用过多内存，处理时间过长触发超时。

**How to avoid:**
- 使用 Multer 流式上传，设置内存限制
- 前端分片上传或压缩后再传
- 配置 Nginx/服务器超时时间

**Warning signs:**
- 上传 10MB+ 文件时响应变慢
- 服务器内存使用飙升
- 偶发的 504 Gateway Timeout

**Phase to address:**
Phase 1 (文件上传功能)

---

### Pitfall 2: 图片处理阻塞主线程

**What goes wrong:**
添加水印、生成缩略图时，API 响应变慢，其他请求被阻塞。

**Why it happens:**
Sharp 虽然高效，但大量图片同步处理会占用 CPU，Node 单线程特性导致其他请求等待。

**How to avoid:**
- 使用异步处理，上传后立即返回，后台处理图片
- 限制并发处理数量
- 考虑使用 Worker Threads 处理大量图片

**Warning signs:**
- 上传后 API 响应时间 > 3秒
- 服务器 CPU 100% 占用
- 其他用户反馈页面卡顿

**Phase to address:**
Phase 1 (图片处理)

---

### Pitfall 3: 私密链接安全隐患

**What goes wrong:**
私密链接被猜测、泄露，或链接永不过期导致作品长期暴露。

**Why it happens:**
- 使用简单递增 ID 作为 token
- Token 无过期时间
- 未限制访问次数

**How to avoid:**
- 使用加密安全的随机 token（crypto.randomBytes）
- 设置合理的过期时间（如 7 天）
- 可选：限制访问次数或 IP
- Redis 存储并设置 TTL

**Warning signs:**
- Token 看起来像递增数字
- Token 长度 < 16 字符
- 没有过期时间字段

**Phase to address:**
Phase 3 (私密分享功能)

---

### Pitfall 4: 数据库连接未释放

**What goes wrong:**
随着使用时间增长，数据库连接数达到上限，新请求全部失败。

**Why it happens:**
- TypeORM 连接未正确配置池
- 事务未提交或回滚
- 错误处理中忘记释放连接

**How to avoid:**
- 配置连接池大小和超时
- 使用 try-finally 确保连接释放
- 监控连接池状态

**Warning signs:**
- 运行一段时间后开始报 "Too many connections"
- 重启服务器后恢复正常
- 数据库 SHOW PROCESSLIST 显示大量 Sleep 连接

**Phase to address:**
Phase 1 (数据库初始化)

---

### Pitfall 5: 前端状态丢失

**What goes wrong:**
用户刷新页面后，主题设置、筛选条件丢失，体验不连贯。

**Why it happens:**
Vue SPA 的状态存储在内存中，刷新后重置。

**How to avoid:**
- 使用 Pinia 持久化插件（pinia-plugin-persistedstate）
- 重要设置存 localStorage
- URL 参数记录筛选状态

**Warning signs:**
- 刷新后主题重置
- 分页跳转后筛选条件丢失
- 用户抱怨需要重复操作

**Phase to address:**
Phase 2 (前端状态管理)

---

### Pitfall 6: 文件名冲突

**What goes wrong:**
上传同名文件时，新文件覆盖旧文件，导致数据丢失。

**Why it happens:**
直接使用原始文件名存储，未做唯一性处理。

**How to avoid:**
- 使用 UUID 或时间戳重命名文件
- 保留原始文件名在数据库中
- 检查文件是否存在

**Warning signs:**
- 文件名直接使用 req.file.originalname
- 上传目录中出现同名文件
- 历史图片被替换

**Phase to address:**
Phase 1 (文件上传)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 跳过图片缩略图 | 快速完成上传功能 | 列表页加载慢，带宽浪费 | 原型阶段，立即重构 |
| 硬编码管理员密码 | 跳过认证实现 | 安全风险，难以修改 | 仅本地开发测试 |
| 前端直接存 JWT | 快速实现认证 | XSS 攻击风险 | 永远不可接受 |
| 不做错误边界 | 代码简单 | 一个组件错误导致整页崩溃 | 永远不可接受 |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Redis | 不设置连接超时和重试 | 配置 retryStrategy 和 maxRetries |
| MySQL | 使用 root 账户连接 | 创建专用用户，限制权限 |
| TypeORM | 同步模式 (synchronize: true) 用于生产 | 使用迁移脚本，关闭同步 |
| Multer | 不限制文件类型 | 使用 fileFilter 验证 MIME 类型 |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 单张图片加载 | 画廊页面加载慢 | 懒加载 + 缩略图 | > 20 张图片 |
| 同步统计更新 | Redis 写入阻塞 | 批量写入或消息队列 | > 100 QPS |
| 全量数据查询 | 分页失效，内存溢出 | 分页 + 索引 | > 1000 条记录 |
| 无缓存的重复查询 | 数据库连接池耗尽 | Redis 缓存热点数据 | > 50 并发 |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| 私密链接 token 可预测 | 任意作品可被访问 | 使用加密安全的随机 token |
| 文件上传无类型检查 | 恶意文件上传 | 验证 MIME 类型，限制扩展名 |
| 路径遍历攻击 | 服务器文件泄露 | 验证路径，使用白名单 |
| 无访问日志 | 无法追踪异常行为 | 记录所有管理操作和私密链接访问 |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 上传无进度指示 | 用户不确定是否成功 | 显示进度条和预计时间 |
| 图片加载无占位 | 布局跳动，体验差 | 使用骨架屏或占位图 |
| 无筛选重置按钮 | 用户被困在筛选结果 | 提供明显的重置/清空选项 |
| 移动端点击区域小 | 难以操作，误触 | 最小 44px 点击区域 |
| 深色模式对比度不足 | 文字难以辨认 | 确保文字与背景对比度 > 4.5 |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **文件上传:** 往往缺少类型验证 — 验证 MIME 类型、文件大小限制
- [ ] **私密链接:** 往往缺少过期机制 — 检查 token TTL 设置
- [ ] **图片展示:** 往往缺少懒加载 — 检查长列表页面性能
- [ ] **错误处理:** 往往缺少用户友好提示 — 验证错误页面和 toast 提示
- [ ] **统计功能:** 往往缺少数据持久化 — 验证 Redis 数据是否同步到 MySQL

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 文件名冲突 | HIGH | 从备份恢复，或检查数据库记录重建 |
| 连接池耗尽 | MEDIUM | 重启服务，调整池大小，检查连接泄漏 |
| Token 泄露 | LOW | 使旧 token 失效，重新生成 |
| 内存溢出 | MEDIUM | 重启服务，检查大文件处理逻辑 |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 大文件上传超时 | Phase 1 | 上传测试 50MB+ 文件 |
| 图片处理阻塞 | Phase 1 | 并发上传测试，监控 CPU |
| 私密链接安全 | Phase 3 | Token 安全性审计 |
| 数据库连接泄漏 | Phase 1 | 长时间运行压力测试 |
| 前端状态丢失 | Phase 2 | 刷新页面测试 |
| 文件名冲突 | Phase 1 | 上传同名文件测试 |

## Sources

- Node.js 最佳实践 — 错误处理、性能优化
- Sharp 文档 — 图片处理性能建议
- OWASP — 文件上传安全
- 个人经验 — 摄影平台开发中的实际问题

---
*Pitfalls research for: Photography Studio Portfolio Platform*
*Researched: 2026-03-24*