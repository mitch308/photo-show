#!/bin/bash
# Health Check Script for Photo Show

echo "=== Health Check ==="

# Check backend
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Backend API is running"
else
    echo "⚠ Backend API health endpoint not available (may not be implemented)"
fi

# Check PM2
if pm2 status 2>/dev/null | grep -q "photo-show-api"; then
    echo "✓ PM2 process is running"
else
    echo "✗ PM2 process not found"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
else
    echo "✗ Nginx is not running"
fi

# Check MySQL
if mysqladmin ping -h localhost > /dev/null 2>&1; then
    echo "✓ MySQL is running"
else
    echo "✗ MySQL is not responding"
fi

# Check Redis
if redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "✓ Redis is running"
else
    echo "✗ Redis is not responding"
fi

# Check disk space
DISK_USAGE=$(df -h /var/www/photo-show 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//')
if [ -n "$DISK_USAGE" ]; then
    if [ "$DISK_USAGE" -lt 80 ]; then
        echo "✓ Disk usage: ${DISK_USAGE}%"
    else
        echo "⚠ Disk usage: ${DISK_USAGE}% (high)"
    fi
else
    echo "⚠ Could not check disk space (directory may not exist)"
fi

echo "=== Health check complete ==="