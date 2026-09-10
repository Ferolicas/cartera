module.exports = {
  apps: [
    {
      name: "cartera",
      cwd: "/var/www/cartera",
      script: "pnpm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "4004",
      },
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "512M",
    },
  ],
};
