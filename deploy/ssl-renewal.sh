#!/bin/bash
# SSL Certificate Renewal Script
# Add to crontab: 0 3 * * * /var/www/photo-show/deploy/ssl-renewal.sh

certbot renew --quiet --post-hook "systemctl reload nginx"