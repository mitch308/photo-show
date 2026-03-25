#!/bin/bash
# Full Setup Script for Photo Show

set -e

echo "=== Photo Show Full Setup ==="

# Create directories
sudo mkdir -p /var/www/photo-show
sudo mkdir -p /var/log/photo-show
sudo mkdir -p /var/backups/photo-show/{mysql,uploads}
sudo chown -R $USER:$USER /var/www/photo-show
sudo chown -R $USER:$USER /var/log/photo-show
sudo chown -R $USER:$USER /var/backups/photo-show

# Setup PM2
./deploy/pm2-setup.sh

# Setup Nginx
./deploy/nginx-setup.sh

# Setup backups
./deploy/setup-backup-cron.sh

# Setup log rotation
./deploy/setup-logrotate.sh

echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "1. Copy backend/.env from backend/.env.example and fill in values"
echo "2. Run migrations: cd backend && npm run typeorm migration:run"
echo "3. Create admin user"
echo "4. Obtain SSL certificate: sudo certbot --nginx -d your-domain.com"