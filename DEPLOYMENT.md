# Photo Show Deployment Guide

## Prerequisites

- Ubuntu 22.04 or similar Linux distribution
- Node.js 20 LTS
- MySQL 8.0
- Redis 7.2
- Domain name pointing to server IP

## Quick Start

1. Clone repository:
   ```bash
   git clone <repo-url> /var/www/photo-show
   cd /var/www/photo-show
   ```

2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Configure environment:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   ```

4. Run full setup:
   ```bash
   chmod +x deploy/*.sh
   ./deploy/setup.sh
   ```

5. Initialize database:
   ```bash
   cd backend
   npm run typeorm migration:run
   ```

6. Create admin user (via API or script)

7. Obtain SSL certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## Configuration Files

| File | Purpose |
|------|---------|
| `ecosystem.config.js` | PM2 process configuration |
| `deploy/nginx/photo-show.conf` | Nginx site configuration |
| `backend/.env` | Environment variables |

## Common Operations

### Restart Application
```bash
pm2 restart photo-show-api
```

### View Logs
```bash
pm2 logs photo-show-api
# or
tail -f /var/log/photo-show/out.log
```

### Backup Database
```bash
./deploy/backup-mysql.sh
```

### Deploy Updates
```bash
./deploy/deploy.sh
```

### Health Check
```bash
./deploy/health-check.sh
```

## Troubleshooting

### Port already in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Nginx 502 Bad Gateway
- Check if backend is running: `pm2 status`
- Check Nginx error log: `tail -f /var/log/nginx/error.log`

### SSL Certificate Issues
```bash
sudo certbot renew --dry-run
```

### Database Connection Failed
- Check MySQL status: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`

## Security Checklist

- [ ] Change default JWT secret in `.env`
- [ ] Set strong database password
- [ ] Configure firewall (ufw)
- [ ] Enable SSL/HTTPS
- [ ] Set up automatic backups
- [ ] Configure fail2ban (optional)

## Firewall Setup

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```