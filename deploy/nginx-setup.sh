#!/bin/bash
# Nginx Setup Script for Photo Show

set -e

echo "=== Setting up Nginx ==="

# Install Nginx and Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Copy site configuration
sudo cp deploy/nginx/photo-show.conf /etc/nginx/sites-available/photo-show

# Enable site
sudo ln -sf /etc/nginx/sites-available/photo-show /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

echo "=== Nginx setup complete ==="
echo "To obtain SSL certificate, run:"
echo "  sudo certbot --nginx -d your-domain.com"