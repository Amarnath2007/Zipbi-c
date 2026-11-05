const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// Disable ETags to ensure fresh API responses (prevents 304 without payload)
app.set('etag', false);

// Security and utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Never cache API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Static assets serving (uploaded and bundled cafe images)
app.use('/assets', express.static(path.resolve(__dirname, '../../assets')));
app.use('/assets', express.static(path.resolve(__dirname, '../assets')));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use(express.static(path.resolve(__dirname, '../public')));

// Private Admin Dashboard Web App
const adminStaticDir = path.resolve(__dirname, '../public/admin');
app.use('/admin', express.static(adminStaticDir));
app.get('/admin*', (req, res, next) => {
  if (path.extname(req.path)) {
    return next();
  }
  res.sendFile(path.join(adminStaticDir, 'index.html'));
});

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes mounting
app.use('/api/v1', routes);

// 404 & Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

