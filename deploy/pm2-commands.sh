#!/bin/bash
# Common PM2 commands for Photo Show

case "$1" in
  start)
    pm2 start ecosystem.config.js --env production
    ;;
  stop)
    pm2 stop photo-show-api
    ;;
  restart)
    pm2 restart photo-show-api
    ;;
  reload)
    pm2 reload photo-show-api
    ;;
  logs)
    pm2 logs photo-show-api
    ;;
  status)
    pm2 status
    ;;
  monit)
    pm2 monit
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|reload|logs|status|monit}"
    exit 1
esac