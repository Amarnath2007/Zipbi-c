const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { isSuperAdmin } = require('../middleware/auth.middleware');
const { importImageFromGoogleDrive } = require('../utils/googleDrive');
const { resolveGoogleMapsUrl, reverseGeocodeCoordinates } = require('../utils/googleMapsResolver');
const { parseMenuText, SAMPLE_MENU_TEXT, AI_EXTRACTION_PROMPT } = require('../utils/menuTextParser');
const { validateMenuJson, SAMPLE_MENU_JSON } = require('../utils/menuJsonValidator');
const path = require('path');
const fs = require('fs');

/**
 * Dedicated Admin Login - Strictly blocks non-admin users
 */
async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin email and password are required.',
      });
    }

    const user = db.findUserByIdentifier(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Administrator not found.',
      });
    }

    const isSuper = isSuperAdmin(user);
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && !isSuper) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account does not have administrator privileges.',
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
        isSuperAdmin: isSuper,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: isSuper ? 'SUPER_ADMIN' : user.role,
        isSuperAdmin: isSuper,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Admin Overview Statistics
 */
async function getStats(req, res, next) {
  try {
    const stats = db.getAdminStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List all businesses for Admin (including inactive)
 */
async function listCafes(req, res, next) {
  try {
    const { q, category, includeDeleted } = req.query;
    const cafes = db.getAllCafes({
      includeInactive: true,
      includeDeleted: includeDeleted === 'true',
      q,
      category,
    });

    return res.status(200).json({
      success: true,
      count: cafes.length,
      cafes,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single business by ID or slug
 */
async function getCafe(req, res, next) {
  try {
    const { id } = req.params;
    const cafe = db.getCafeById(id);
    if (!cafe) {
      return res.status(404).json({
        success: false,
        message: `Business with ID '${id}' not found.`,
      });
    }
    return res.status(200).json({
      success: true,
      cafe,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new business
 */
async function createCafe(req, res, next) {
  try {
    const { name, category, specified_business_type, address, latitude, longitude } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required.',
      });
    }

    const validCategories = ['Cafés', 'Café', 'Restaurants', 'Tea Shops', 'Bakeries', 'Others'];
    if (category && !validCategories.some(c => c.toLowerCase() === category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.filter(c => c !== 'Café').join(', ')}`,
      });
    }

    const isOthers = category && (category.toLowerCase() === 'others' || category.toLowerCase() === 'other');
    if (isOthers && (!specified_business_type || !specified_business_type.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Specify Business Type is required when Others category is selected (e.g. Juice Shop, Ice Cream Parlour, Dessert Shop, Fast Food Outlet).',
      });
    }

    if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Valid geographical coordinates (latitude and longitude) are required.',
      });
    }

    const created = db.createCafe(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Business created successfully.',
      cafe: created,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update business details
 */
async function updateCafe(req, res, next) {
  try {
    const { id } = req.params;

    const validCategories = ['Cafés', 'Café', 'Restaurants', 'Tea Shops', 'Bakeries', 'Others'];
    if (req.body.category && !validCategories.some(c => c.toLowerCase() === req.body.category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.filter(c => c !== 'Café').join(', ')}`,
      });
    }

    const isOthers = req.body.category && (req.body.category.toLowerCase() === 'others' || req.body.category.toLowerCase() === 'other');
    if (isOthers) {
      const existing = db.getCafeById(id);
      const specifiedType = req.body.specified_business_type || (existing && existing.specified_business_type);
      if (!specifiedType || !specifiedType.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Specify Business Type is required when Others category is selected.',
        });
      }
    }

    const updated = db.updateCafe(id, req.body, req.user);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Business '${id}' not found.`,
      });
    }
    if (updated.forbidden) {
      return res.status(403).json({
        success: false,
        message: updated.message || 'Access denied: This record is protected by the Platform Owner and cannot be modified by other users.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Business updated successfully.',
      cafe: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete business (Safe Soft-Deletion by default)
 */
async function deleteCafe(req, res, next) {
  try {
    const { id } = req.params;
    const purge = req.query.purge === 'true';
    const result = db.deleteCafe(id, req.user, { purge });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Business '${id}' not found.`,
      });
    }
    if (result.forbidden) {
      return res.status(403).json({
        success: false,
        message: result.message || 'Access denied: This record is protected by the Platform Owner and cannot be deleted by other users.',
      });
    }
    return res.status(200).json({
      success: true,
      message: purge
        ? `Business '${id}' permanently purged from database.`
        : `Business '${id}' archived (soft-deleted) successfully.`,
      softDeleted: !purge,
      soft_deleted: !purge,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Restore archived / soft-deleted business (Super Admin only)
 */
async function restoreCafe(req, res, next) {
  try {
    const { id } = req.params;
    const restored = db.restoreCafe(id, req.user);
    if (!restored) {
      return res.status(404).json({
        success: false,
        message: `Business '${id}' not found.`,
      });
    }
    if (restored.forbidden) {
      return res.status(403).json({
        success: false,
        message: restored.message || 'Access denied. Platform Owner privileges required to restore archived records.',
      });
    }
    return res.status(200).json({
      success: true,
      message: `Business '${restored.name}' restored successfully.`,
      cafe: restored,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Permanently purge business (Super Admin only with confirmation)
 */
async function purgeCafe(req, res, next) {
  try {
    const { id } = req.params;
    const result = db.purgeCafe(id, req.user, { confirmed: true });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Business '${id}' not found.`,
      });
    }
    if (result.forbidden) {
      return res.status(403).json({
        success: false,
        message: result.message || 'Access denied. Platform Owner privileges required to purge records.',
      });
    }
    return res.status(200).json({
      success: true,
      message: `Business '${id}' permanently purged from database.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggle Active / Inactive status
 */
async function toggleStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = db.toggleCafeStatus(id, isActive, req.user);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Business '${id}' not found.`,
      });
    }
    if (updated.forbidden) {
      return res.status(403).json({
        success: false,
        message: updated.message,
      });
    }
    return res.status(200).json({
      success: true,
      message: `Business '${id}' is now ${updated.is_active ? 'Active' : 'Inactive'}.`,
      cafe: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Import image from Google Drive link
 */
async function importDriveImage(req, res, next) {
  try {
    const driveUrl = req.body.driveUrl || req.body.url || req.body.link;
    const slug = req.body.slug || 'cafe';

    if (!driveUrl || typeof driveUrl !== 'string' || !driveUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive sharing link is required.',
      });
    }

    const result = await importImageFromGoogleDrive(driveUrl.trim(), slug);
    return res.status(200).json({
      success: true,
      message: 'Image successfully downloaded and stored permanently.',
      imageUrl: result.permanentUrl,
      ...result,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to import image from Google Drive.',
    });
  }
}

/**
 * Direct file / base64 image upload
 */
async function uploadImage(req, res, next) {
  try {
    const { base64Data, filename, prefix } = req.body;
    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: 'Base64 image data is required.',
      });
    }

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = filename || `${prefix || 'upload'}_${Date.now()}.jpg`;

    const uploadsDir = path.resolve(__dirname, '../../uploads/cafes');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const targetPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(targetPath, buffer);

    // Also mirror to assets
    try {
      const assetsDir = path.resolve(__dirname, '../../../assets/images/cafes');
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(path.join(assetsDir, safeName), buffer);

      const buildDir = path.resolve(__dirname, '../../../build/web/assets/images/cafes');
      if (fs.existsSync(buildDir)) {
        fs.writeFileSync(path.join(buildDir, safeName), buffer);
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      fileName: safeName,
      imageUrl: `/uploads/cafes/${safeName}`,
      permanentUrl: `/uploads/cafes/${safeName}`,
      assetPath: `assets/images/cafes/${safeName}`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get full cafe menu with verification status
 */
async function getCafeMenu(req, res, next) {
  try {
    const { id } = req.params;
    const menuData = db.getCafeMenu(id);
    if (!menuData) {
      return res.status(404).json({
        success: false,
        message: `Business '${id}' not found.`,
      });
    }
    return res.status(200).json({
      success: true,
      ...menuData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update full menu
 */
async function updateMenu(req, res, next) {
  try {
    const { id } = req.params;
    const { categories, menu_status, menuStatus, menu_status_notes, menuStatusNotes } = req.body;
    const updated = db.updateCafeMenu(
      id,
      categories,
      menu_status || menuStatus,
      menu_status_notes !== undefined ? menu_status_notes : menuStatusNotes
    );
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Business '${id}' not found.`,
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Menu updated successfully.',
      categories: updated.menu_categories,
      menu_status: updated.menu_status,
      cafe: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Menu Verification Status
 */
async function updateMenuStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, menu_status, menuStatus, notes } = req.body;
    const targetStatus = status || menu_status || menuStatus;

    const allowed = ['Verified Menu', 'Partially Verified', 'Awaiting Merchant Confirmation', 'Menu Not Available'];
    if (!targetStatus || !allowed.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid menu status. Allowed values: ${allowed.join(', ')}`,
      });
    }

    const updated = db.updateMenuStatus(id, targetStatus, notes, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Business '${id}' not found.` });
    }
    if (updated.forbidden) {
      return res.status(403).json({ success: false, message: updated.message });
    }

    return res.status(200).json({
      success: true,
      message: `Menu verification status updated to '${targetStatus}'.`,
      menu_status: updated.menu_status,
      cafe: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Add category (accepts both 'name' and 'categoryName')
 */
async function addCategory(req, res, next) {
  try {
    const { id } = req.params;
    const name = (req.body.name || req.body.categoryName || '').trim();
    const description = (req.body.description || '').trim();
    const is_enabled = req.body.is_enabled !== undefined ? req.body.is_enabled : true;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const categories = db.addMenuCategory(id, { name, description, is_enabled }, req.user);
    if (categories && categories.forbidden) {
      return res.status(403).json({ success: false, message: categories.message });
    }
    const cafe = db.getCafeById(id);

    return res.status(200).json({
      success: true,
      message: `Category '${name}' created successfully.`,
      categories,
      cafe,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Rename / update category
 */
async function renameCategory(req, res, next) {
  try {
    const { id, categoryName } = req.params;
    const { newName, name, description, is_enabled, isEnabled } = req.body;
    const targetNewName = (newName || name || '').trim();

    const categories = db.renameMenuCategory(
      id,
      categoryName,
      targetNewName || categoryName,
      description,
      is_enabled !== undefined ? is_enabled : isEnabled,
      req.user
    );

    if (!categories) {
      return res.status(404).json({ success: false, message: `Category '${categoryName}' not found.` });
    }
    if (categories.forbidden) {
      return res.status(403).json({ success: false, message: categories.message });
    }

    const cafe = db.getCafeById(id);
    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      categories,
      cafe,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete category
 */
async function deleteCategory(req, res, next) {
  try {
    const { id, categoryName } = req.params;
    const { moveItemsTo } = req.body || {};
    const categories = db.deleteMenuCategory(id, categoryName, { moveItemsTo }, req.user);
    if (categories && categories.forbidden) {
      return res.status(403).json({ success: false, message: categories.message });
    }
    const cafe = db.getCafeById(id);

    return res.status(200).json({
      success: true,
      message: `Category '${categoryName}' deleted successfully.${moveItemsTo ? ` Items moved to '${moveItemsTo}'.` : ''}`,
      categories,
      cafe,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reorder categories
 */
async function reorderCategories(req, res, next) {
  try {
    const { id } = req.params;
    const { categoryNames } = req.body;
    if (!Array.isArray(categoryNames)) {
      return res.status(400).json({ success: false, message: 'categoryNames array is required.' });
    }
    const categories = db.reorderMenuCategories(id, categoryNames, req.user);
    if (categories && categories.forbidden) {
      return res.status(403).json({ success: false, message: categories.message });
    }
    const cafe = db.getCafeById(id);
    return res.status(200).json({
      success: true,
      message: 'Categories reordered successfully.',
      categories,
      cafe,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Add menu item with strict validation
 */
async function addMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const categoryName = (req.body.categoryName || req.body.category || '').trim();
    const item = req.body.item || req.body;

    if (!item || !item.name || !item.name.trim()) {
      return res.status(400).json({ success: false, message: 'Item name is required.' });
    }

    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
    }

    const result = db.addMenuItem(id, categoryName, item, req.user);
    if (!result) {
      return res.status(404).json({ success: false, message: `Business '${id}' not found.` });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, message: result.message });
    }

    return res.status(201).json({
      success: true,
      message: `Item '${item.name}' added successfully.`,
      item: result.item,
      categories: result.categories,
      cafe: result.cafe,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update menu item (supports moving categories, updating price and availability)
 */
async function updateMenuItem(req, res, next) {
  try {
    const { id, itemId } = req.params;
    const categoryName = req.body.categoryName || req.body.category || null;
    const newCategoryName = req.body.newCategoryName || req.body.newCategory || null;
    const updates = req.body.updates || req.body;

    if (updates.price !== undefined) {
      const p = parseFloat(updates.price);
      if (isNaN(p) || p < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
      }
    }

    const result = db.updateMenuItem(id, categoryName, itemId, updates, newCategoryName, req.user);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully.',
      item: result.item,
      categories: result.categories,
      cafe: result.cafe,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete menu item
 */
async function deleteMenuItem(req, res, next) {
  try {
    const { id, itemId } = req.params;
    const result = db.deleteMenuItem(id, itemId, req.user);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, message: result.message });
    }

    const cafe = db.getCafeById(id);
    return res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully.',
      categories: cafe ? cafe.menu_categories : [],
      cafe,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggle menu item availability
 */
async function toggleMenuItemAvailability(req, res, next) {
  try {
    const { id, itemId } = req.params;
    const { is_available, isAvailable } = req.body;
    const targetAvailability = is_available !== undefined ? is_available : isAvailable;

    const item = db.toggleMenuItemAvailability(id, itemId, targetAvailability);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Item availability updated to ${item.is_available ? 'Available' : 'Out of Stock'}.`,
      item,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List Customer Users
 */
async function listUsers(req, res, next) {
  try {
    const users = db.getAllUsers();
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List Merchant Partners
 */
async function listPartners(req, res, next) {
  try {
    const partners = db.getMerchantPartners();
    return res.status(200).json({
      success: true,
      count: partners.length,
      partners,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Aggregated Café Revenue (privacy preserved)
 */
async function getRevenue(req, res, next) {
  try {
    const revenue = db.getRevenueOverview();
    return res.status(200).json({
      success: true,
      revenue,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Subscriptions
 */
async function getSubscriptions(req, res, next) {
  try {
    const data = db.getSubscriptions();
    return res.status(200).json({
      success: true,
      subscriptions: data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Activity Logs
 */
async function getActivityLogs(req, res, next) {
  try {
    const logs = db.getActivityLogs();
    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Admin Settings
 */
async function getSettings(req, res, next) {
  try {
    const ref = db.getReferencePoint();
    return res.status(200).json({
      success: true,
      settings: {
        appName: 'ZipBi Customer App',
        targetCity: 'Coimbatore, Tamil Nadu',
        discoveryRadiusKm: 5.0,
        referencePoint: ref,
        supportEmail: 'contact@zipbi.com',
        supportPhone: '+91 99760 18088',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Admin Settings
 */
async function updateSettings(req, res, next) {
  try {
    db.logActivity('SETTINGS_UPDATE', 'System configuration updated by Administrator', req.user ? req.user.fullName : 'Admin');
    return res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Resolve Google Maps Location Link (coordinates, place name, address)
 */
async function resolveMapsUrl(req, res, next) {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Google Maps location URL is required.',
      });
    }

    const result = await resolveGoogleMapsUrl(url.trim());
    if (!result.success && !result.resolvedUrl) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Reverse Geocode Latitude and Longitude Coordinates
 */
async function geocodeCoordinates(req, res, next) {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Numeric latitude and longitude are required.',
      });
    }

    const result = await reverseGeocodeCoordinates(latitude, longitude);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Reset Café Directory to 0 - Super Admin Multi-Step Safety Protocol
 */
async function resetDirectory(req, res, next) {
  try {
    // 1. Strict Super Admin Authorization Check
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the Platform Owner (Super Admin) can perform a directory reset.',
      });
    }

    // 2. Administrator Re-Authentication
    const { password, confirmationPhrase } = req.body || {};
    if (!password) {
      return res.status(401).json({
        success: false,
        message: 'Re-authentication required. Please provide your administrator password.',
      });
    }

    const adminUser = db.findUserByIdentifier(req.user.email || req.user.id);
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Administrator account not found for re-authentication.',
      });
    }

    const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Re-authentication failed. Incorrect administrator password.',
      });
    }

    // 3. Strict Phrase Verification
    if (confirmationPhrase !== 'RESET DIRECTORY') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation phrase must be exactly "RESET DIRECTORY" (uppercase).',
      });
    }

    // 4. Execute Automated Pre-Reset Backup & Directory Wipe
    const { resetCafeDirectory } = require('../../../scripts/reset_cafe_directory');
    const resetResult = resetCafeDirectory();
    db.reloadCafes();

    // 5. Immutable Activity Log
    db.logActivity(
      'SUPER_ADMIN_DIRECTORY_RESET',
      `Super Administrator ${adminUser.fullName || 'Admin'} performed verified café directory reset (${resetResult.totalBackedUp || 0} cafés backed up).`,
      adminUser.fullName || 'Super Administrator'
    );

    return res.status(200).json({
      success: true,
      message: 'Café directory successfully reset to 0.',
      ...resetResult,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Sample Menu plain-English format and AI extraction prompt
 */
function getSampleMenuFormat(req, res) {
  return res.status(200).json({
    success: true,
    sample: SAMPLE_MENU_JSON,
    sample_text: SAMPLE_MENU_TEXT,
    ai_extraction_prompt: AI_EXTRACTION_PROMPT,
    ai_prompt_suggestion: AI_EXTRACTION_PROMPT,
  });
}

/**
 * Validate pasted plain-English menu against schema and target cafe
 */
async function validateMenuTextHandler(req, res, next) {
  try {
    const { id } = req.params;
    const cafe = db.getCafeById(id);
    if (!cafe) {
      return res.status(404).json({ success: false, message: `Café '${id}' not found.` });
    }

    const rawInput = req.body.raw_text !== undefined
      ? req.body.raw_text
      : (req.body.text !== undefined
        ? req.body.text
        : (req.body.menu_text !== undefined
          ? req.body.menu_text
          : (req.body.raw_json !== undefined ? req.body.raw_json : '')));

    let result;
    if (typeof rawInput === 'string' && rawInput.trim().startsWith('{')) {
      // Legacy JSON fallback if passed
      result = validateMenuJson(rawInput, cafe.name);
    } else {
      result = parseMenuText(rawInput, cafe.name);
    }

    return res.status(200).json({
      success: true,
      cafeId: cafe.id,
      cafeName: cafe.name,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Import validated structured menu into cafe database records
 */
async function importStructuredMenuHandler(req, res, next) {
  try {
    const { id } = req.params;
    const cafe = db.getCafeById(id);
    if (!cafe) {
      return res.status(404).json({ success: false, message: `Café '${id}' not found.` });
    }

    const { menu, raw_text, text, raw_json, mode, menu_status, allow_name_mismatch } = req.body;
    let menuToImport = null;

    if (menu && typeof menu === 'object' && Array.isArray(menu.categories)) {
      // Validate structured menu object from editable preview
      const catErrors = [];
      if (menu.categories.length === 0) {
        catErrors.push('At least one category is required.');
      }
      menu.categories.forEach((cat, cIdx) => {
        if (!cat.name || !cat.name.trim()) {
          catErrors.push(`Category #${cIdx + 1} name is required.`);
        }
        (cat.items || []).forEach((item, iIdx) => {
          if (!item.name || !item.name.trim()) {
            catErrors.push(`Item #${iIdx + 1} in category "${cat.name}" has an empty name.`);
          }
          if (item.price !== null && item.price !== undefined && (isNaN(Number(item.price)) || Number(item.price) < 0)) {
            catErrors.push(`Item "${item.name}" has an invalid price.`);
          }
        });
      });

      if (catErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Menu validation failed.',
          errors: catErrors,
        });
      }
      menuToImport = menu;
    } else {
      const textInput = raw_text !== undefined ? raw_text : (text !== undefined ? text : raw_json);
      if (!textInput) {
        return res.status(400).json({ success: false, message: 'Menu data or raw_text is required.' });
      }

      let validation;
      if (typeof textInput === 'string' && textInput.trim().startsWith('{')) {
        validation = validateMenuJson(textInput, cafe.name);
      } else {
        validation = parseMenuText(textInput, cafe.name);
      }

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Menu validation failed.',
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      if (validation.nameMismatch && allow_name_mismatch !== true) {
        return res.status(409).json({
          success: false,
          nameMismatch: true,
          message: `Pasted menu is labeled for "${validation.pastedCafeName}", but current café is "${cafe.name}". Please confirm import.`,
          warnings: validation.warnings,
        });
      }
      menuToImport = validation.sanitizedMenu;
    }

    const adminName = req.user && req.user.fullName ? req.user.fullName : 'ZipBi Administrator';
    const importResult = db.importStructuredMenu(id, menuToImport, {
      mode: mode === 'merge' ? 'merge' : 'replace',
      status: menu_status || 'Verified Menu',
      adminName,
      requestingUser: req.user,
    });

    if (importResult && importResult.forbidden) {
      return res.status(403).json({
        success: false,
        message: importResult.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Menu successfully imported into database (${importResult.importedItemsCount} items across ${importResult.importedCategoriesCount} categories).`,
      mode: mode === 'merge' ? 'merge' : 'replace',
      ...importResult,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  adminLogin,
  getStats,
  listCafes,
  getCafe,
  createCafe,
  updateCafe,
  deleteCafe,
  restoreCafe,
  purgeCafe,
  toggleStatus,
  importDriveImage,
  uploadImage,
  getCafeMenu,
  updateMenu,
  updateMenuStatus,
  addCategory,
  renameCategory,
  deleteCategory,
  reorderCategories,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  getSampleMenuFormat,
  getSampleMenuJson: getSampleMenuFormat,
  validateMenuText: validateMenuTextHandler,
  validateMenuJson: validateMenuTextHandler,
  importStructuredMenu: importStructuredMenuHandler,
  listUsers,
  listPartners,
  getRevenue,
  getSubscriptions,
  getActivityLogs,
  getSettings,
  updateSettings,
  resolveMapsUrl,
  geocodeCoordinates,
  resetDirectory,
};

