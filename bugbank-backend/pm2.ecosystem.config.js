module.exports = {
  apps: [
    {
      name: 'bugbanks-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
