const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const cafeRoutes = require('./cafe.routes');
const orderRoutes = require('./order.routes');
const adminRoutes = require('./admin.routes');

// Health-check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ZipBi Unified API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mounted API routes
router.use('/auth', authRoutes);
router.use('/cafes', cafeRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

