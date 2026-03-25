#!/bin/bash
# PM2 Setup Script for Photo Show

set -e

echo "=== Setting up PM2 ==="

# Install PM2 globally
npm install -g pm2

# Create log directory
sudo mkdir -p /var/log/photo-show
sudo chown $USER:$USER /var/log/photo-show

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup

echo "=== PM2 setup complete ==="
echo "Run 'pm2 status' to check application status"