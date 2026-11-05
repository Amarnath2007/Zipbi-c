const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

// Public Admin Login endpoint (checks admin role)
router.post('/login', adminController.adminLogin);

// All routes below strictly require Administrator authentication
router.use(requireAdmin);

// Overview Stats
router.get('/stats', adminController.getStats);

// Business Management CRUD
router.get('/cafes', adminController.listCafes);
router.get('/cafes/:id', adminController.getCafe);
router.post('/cafes', adminController.createCafe);
router.put('/cafes/:id', adminController.updateCafe);
router.delete('/cafes/:id', adminController.deleteCafe);
router.patch('/cafes/:id/status', adminController.toggleStatus);

// Image Import & Upload
router.post('/import-drive-image', adminController.importDriveImage);
router.post('/upload-image', adminController.uploadImage);

// Menu Management
router.get('/cafes/:id/menu', adminController.getCafeMenu);
router.put('/cafes/:id/menu', adminController.updateMenu);
router.patch('/cafes/:id/menu/status', adminController.updateMenuStatus);
router.post('/cafes/:id/menu/categories', adminController.addCategory);
router.put('/cafes/:id/menu/categories/:categoryName', adminController.renameCategory);
router.delete('/cafes/:id/menu/categories/:categoryName', adminController.deleteCategory);
router.put('/cafes/:id/menu/categories-order', adminController.reorderCategories);
router.post('/cafes/:id/menu/items', adminController.addMenuItem);
router.put('/cafes/:id/menu/items/:itemId', adminController.updateMenuItem);
router.delete('/cafes/:id/menu/items/:itemId', adminController.deleteMenuItem);
router.patch('/cafes/:id/menu/items/:itemId/availability', adminController.toggleMenuItemAvailability);

// Location & Google Maps Resolver
router.post('/resolve-maps-url', adminController.resolveMapsUrl);
router.post('/geocode-coordinates', adminController.geocodeCoordinates);

// Directory Reset (Development / Admin)
router.post('/reset-directory', adminController.resetDirectory);

// Customer Users & Merchant Partners
router.get('/users', adminController.listUsers);
router.get('/partners', adminController.listPartners);

// Financials & Subscriptions (privacy-compliant aggregated cafe revenue)
router.get('/revenue', adminController.getRevenue);
router.get('/subscriptions', adminController.getSubscriptions);

// Audit & Settings
router.get('/activity-logs', adminController.getActivityLogs);
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;

