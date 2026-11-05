const express = require('express');
const router = express.Router();
const cafeController = require('../controllers/cafe.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, cafeController.listCafes);
router.get('/favorites', authenticateToken, cafeController.getFavorites);
router.get('/:id', optionalAuth, cafeController.getCafeById);
router.get('/:id/menu', cafeController.getCafeMenu);
router.post('/:id/favorite', authenticateToken, cafeController.toggleFavorite);

// Business updates, menus and image upload persistence (Requires Authentication & Ownership Check)
router.put('/:id', authenticateToken, cafeController.updateCafe);
router.put('/:id/menu', authenticateToken, cafeController.updateCafeMenu);
router.post('/:id/menu/items', authenticateToken, cafeController.addMenuItem);
router.post('/:id/image', authenticateToken, cafeController.uploadCafeImage);

module.exports = router;

