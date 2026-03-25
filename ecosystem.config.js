module.exports = {
  apps: [{
    name: 'photo-show-api',
    script: 'dist/index.js',
    cwd: '/var/www/photo-show/backend',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/photo-show/error.log',
    out_file: '/var/log/photo-show/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    log_rotate: true,
    log_rotate_size: '10M',
    log_rotate_count: 30
  }]
}