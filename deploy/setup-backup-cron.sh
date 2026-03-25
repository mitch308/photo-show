#!/bin/bash
# Setup Backup Cron Jobs for Photo Show

set -e

echo "=== Setting up backup cron jobs ==="

# Create backup directories
sudo mkdir -p /var/backups/photo-show/mysql
sudo mkdir -p /var/backups/photo-show/uploads
sudo chown -R $USER:$USER /var/backups/photo-show

# Make scripts executable
chmod +x deploy/backup-mysql.sh
chmod +x deploy/backup-uploads.sh

# Add cron jobs (daily at 3:30 AM)
(crontab -l 2>/dev/null | grep -v "backup-mysql.sh"; echo "30 3 * * * $(pwd)/deploy/backup-mysql.sh >> /var/log/photo-show/backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null | grep -v "backup-uploads.sh"; echo "35 3 * * * $(pwd)/deploy/backup-uploads.sh >> /var/log/photo-show/backup.log 2>&1") | crontab -

echo "=== Backup cron jobs configured ==="
crontab -l