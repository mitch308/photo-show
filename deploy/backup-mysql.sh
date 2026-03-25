#!/bin/bash
# MySQL Backup Script for Photo Show

set -e

# Configuration
DB_NAME="photo_show"
DB_USER="root"
BACKUP_DIR="/var/backups/photo-show/mysql"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
mysqldump -u "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

# Remove old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "MySQL backup completed: ${DB_NAME}_${DATE}.sql.gz"