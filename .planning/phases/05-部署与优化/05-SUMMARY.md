---
phase: 05-部署与优化
status: complete
completed: 2026-03-25
---

# Phase 5: 部署与优化 - Summary

## Completed Plans

| Plan | Description | Status |
|------|-------------|--------|
| 05-01 | PM2 Process Manager Setup | ✓ |
| 05-02 | Nginx Configuration | ✓ |
| 05-03 | Database & Redis Backup | ✓ |
| 05-04 | Log Rotation & Scripts | ✓ |
| 05-05 | Documentation & Testing | ✓ |

## Created Files

### Configuration Files
- `ecosystem.config.js` — PM2 进程管理配置
- `deploy/nginx/photo-show.conf` — Nginx 反向代理配置

### Setup Scripts
- `deploy/pm2-setup.sh` — PM2 安装和配置
- `deploy/nginx-setup.sh` — Nginx 安装和配置
- `deploy/setup-logrotate.sh` — 日志轮转配置
- `deploy/setup.sh` — 完整安装脚本

### Management Scripts
- `deploy/pm2-commands.sh` — PM2 常用命令
- `deploy/deploy.sh` — 部署更新脚本
- `deploy/health-check.sh` — 健康检查脚本

### Backup Scripts
- `deploy/backup-mysql.sh` — MySQL 数据库备份
- `deploy/backup-uploads.sh` — 上传文件备份
- `deploy/setup-backup-cron.sh` — 备份定时任务

### Documentation
- `DEPLOYMENT.md` — 部署指南
- `deploy/redis-setup.md` — Redis 持久化配置
- `backend/.env.production.example` — 生产环境变量模板

## Deployment Architecture

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (SSL/443)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    /static/*         /api/*         /uploads/*
    (frontend)     (proxy:3000)     (files)
                           │
                    ┌──────┴──────┐
                    │   PM2       │
                    │  (cluster)  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  Node.js    │
                    │  Backend    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
        MySQL           Redis          Files
       (storage)       (cache)       (uploads)
```

## Key Configuration

### PM2
- Cluster mode with max instances
- 500M memory limit per instance
- Auto-restart on crash
- Log rotation built-in

### Nginx
- HTTPS with Let's Encrypt
- Gzip compression
- Static file caching (1 year for hashed assets)
- Security headers (HSTS, X-Frame-Options, etc.)

### Backups
- MySQL daily at 3:30 AM
- Uploads daily at 3:35 AM
- 7-day retention

### Log Rotation
- Daily rotation
- 30-day retention
- Automatic compression

## Next Steps for Production

1. Copy `.env.production.example` to `.env` and configure
2. Run database migrations
3. Create admin user
4. Obtain SSL certificate: `sudo certbot --nginx -d your-domain.com`
5. Verify health: `./deploy/health-check.sh`

## Notes

- 所有配置文件已创建，可在服务器上直接使用
- 部署前请修改 `.env` 中的敏感配置
- 建议先在测试环境验证部署流程