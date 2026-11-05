const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  🚀 ZipBi Unified Backend API is running!`);
  console.log(`  📍 Environment : ${config.nodeEnv}`);
  console.log(`  🌐 Port        : ${config.port}`);
  console.log(`  🔗 Health Check: http://localhost:${config.port}/api/v1/health`);
  console.log(`  ☕ Cafes API   : http://localhost:${config.port}/api/v1/cafes`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
});

module.exports = server;

