module.exports = {
  apps: [
    {
      name: 'fastify-app',
      script: './dist/server.js',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      env_file: '.env.production',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
        LOG_LEVEL: 'info',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}
