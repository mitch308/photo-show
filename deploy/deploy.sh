#!/bin/bash
# Deployment Script for Photo Show

set -e

echo "=== Photo Show Deployment ==="

# Pull latest code
git pull origin main

# Backend
echo "Building backend..."
cd backend
npm install --production
npm run build

# Frontend
echo "Building frontend..."
cd ../frontend
npm install
npm run build

# Restart services
echo "Restarting services..."
cd ..
pm2 reload photo-show-api

# Reload Nginx
sudo systemctl reload nginx

echo "=== Deployment complete ==="