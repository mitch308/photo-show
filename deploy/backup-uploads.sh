#!/bin/bash
# Uploads Backup Script for Photo Show

set -e

# Configuration
UPLOADS_DIR="/var/www/photo-show/uploads"
BACKUP_DIR="/var/backups/photo-show/uploads"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" -C "$(dirname $UPLOADS_DIR)" "$(basename $UPLOADS_DIR)"

# Remove old backups
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Uploads backup completed: uploads_${DATE}.tar.gz"