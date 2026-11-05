const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/', authenticateToken, orderController.createOrder);
router.get('/my-orders', authenticateToken, orderController.getMyOrders);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.patch('/:id/status', authenticateToken, orderController.updateStatus);

module.exports = router;

