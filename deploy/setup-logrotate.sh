#!/bin/bash
# Setup Log Rotation for Photo Show

set -e

echo "=== Setting up log rotation ==="

# Copy logrotate config
sudo cp deploy/logrotate/photo-show /etc/logrotate.d/photo-show

# Set permissions
sudo chmod 644 /etc/logrotate.d/photo-show

# Test configuration
sudo logrotate -d /etc/logrotate.d/photo-show

echo "=== Log rotation configured ==="