const db = require('../db');
const { isSuperAdmin } = require('../middleware/auth.middleware');

/**
 * List all cafes with distance sorting and filters
 */
async function listCafes(req, res, next) {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : undefined;
    const lon = req.query.lon ? parseFloat(req.query.lon) : undefined;
    const q = req.query.q;
    const category = req.query.category;
    const maxDistance = req.query.maxDistance ? parseFloat(req.query.maxDistance) : undefined;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : undefined;
    const openNow = req.query.openNow === 'true';
    const hasMenu = req.query.hasMenu === 'true';

    const cafes = db.getAllCafes({
      lat,
      lon,
      q,
      category,
      maxDistance,
      minRating,
      openNow,
      hasMenu,
    });

    const userFavs = req.user ? new Set(db.getCustomerFavorites(req.user.id).map((c) => c.id)) : new Set();

    const formatted = cafes.map((c) => ({
      ...c,
      isFavorite: userFavs.has(c.id),
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      referenceLocation: db.getReferencePoint(),
      cafes: formatted,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single cafe details by id or slug
 */
async function getCafeById(req, res, next) {
  try {
    const { id } = req.params;
    const cafe = db.getCafeById(id);

    if (!cafe) {
      return res.status(404).json({
        success: false,
        message: `Café with id '${id}' not found.`,
      });
    }

    const userFavs = req.user ? new Set(db.getCustomerFavorites(req.user.id).map((c) => c.id)) : new Set();

    return res.status(200).json({
      success: true,
      cafe: {
        ...cafe,
        isFavorite: userFavs.has(cafe.id),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get cafe menu categories and items (strictly text-only items)
 */
async function getCafeMenu(req, res, next) {
  try {
    const { id } = req.params;
    const cafe = db.getCafeById(id);

    if (!cafe) {
      return res.status(404).json({
        success: false,
        message: `Café with id '${id}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      cafeId: cafe.id,
      cafeName: cafe.name,
      isOrderingEnabled: cafe.is_ordering_enabled,
      verificationStatus: cafe.verification_status,
      hasPublishedMenu: cafe.has_published_menu,
      menuStatus: cafe.menu_status || 'Verified Menu',
      menu_status: cafe.menu_status || 'Verified Menu',
      categories: cafe.menu_categories || [],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggle favorite status of a cafe
 */
async function toggleFavorite(req, res, next) {
  try {
    const { id } = req.params;
    const cafe = db.getCafeById(id);

    if (!cafe) {
      return res.status(404).json({
        success: false,
        message: `Café with id '${id}' not found.`,
      });
    }

    const isFavorited = db.toggleFavorite(req.user.id, cafe.id);

    return res.status(200).json({
      success: true,
      cafeId: cafe.id,
      isFavorited,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get customer's saved favorite cafes
 */
async function getFavorites(req, res, next) {
  try {
    const favs = db.getCustomerFavorites(req.user.id);
    return res.status(200).json({
      success: true,
      count: favs.length,
      cafes: favs,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update cafe details (Strictly protected if record is Super Admin owned)
 */
async function updateCafe(req, res, next) {
  try {
    const { id } = req.params;
    const existing = db.getCafeById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Café '${id}' not found.` });
    }

    if ((existing.is_protected === true || existing.record_ownership === 'SUPER_ADMIN') && !isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This business listing is protected by the Platform Owner and cannot be modified by merchants.',
      });
    }

    const updated = db.updateCafe(id, req.body, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Café '${id}' not found.` });
    }
    if (updated.forbidden) {
      return res.status(403).json({ success: false, message: updated.message });
    }
    return res.status(200).json({ success: true, cafe: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * Update cafe full menu categories (Strictly protected if record is Super Admin owned)
 */
async function updateCafeMenu(req, res, next) {
  try {
    const { id } = req.params;
    const existing = db.getCafeById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Café '${id}' not found.` });
    }

    if ((existing.is_protected === true || existing.record_ownership === 'SUPER_ADMIN') && !isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This business menu is protected by the Platform Owner and cannot be modified by merchants.',
      });
    }

    const categories = req.body.categories || req.body.menu_categories;
    const updated = db.updateCafeMenu(id, categories);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Café '${id}' not found.` });
    }
    return res.status(200).json({ success: true, cafe: updated, categories: updated.menu_categories });
  } catch (err) {
    next(err);
  }
}

/**
 * Add single menu item to a cafe
 */
async function addMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = db.getCafeById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Café '${id}' not found.` });
    }

    if ((existing.is_protected === true || existing.record_ownership === 'SUPER_ADMIN') && !isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This business menu is protected by the Platform Owner and cannot be modified by merchants.',
      });
    }

    const { category, item } = req.body;
    if (!item || !item.name) {
      return res.status(400).json({ success: false, message: 'Item name is required.' });
    }
    const result = db.addMenuItem(id, category, item, req.user);
    if (!result) {
      return res.status(404).json({ success: false, message: `Café '${id}' not found.` });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, message: result.message });
    }
    return res.status(201).json({ success: true, item: result.item, cafe: result.cafe });
  } catch (err) {
    next(err);
  }
}

/**
 * Upload and save image for a cafe
 */
async function uploadCafeImage(req, res, next) {
  try {
    const { id } = req.params;
    const existing = db.getCafeById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Café '${id}' not found.` });
    }

    if ((existing.is_protected === true || existing.record_ownership === 'SUPER_ADMIN') && !isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This business listing is protected by the Platform Owner and photographs cannot be overwritten by merchants.',
      });
    }

    const { image, base64, filename, imageUrl } = req.body;

    if (imageUrl) {
      const updated = db.updateCafe(id, { cover_image: imageUrl, cover_image_url: imageUrl }, req.user);
      return res.status(200).json({ success: true, cafe: updated });
    }

    const dataToSave = image || base64;
    if (!dataToSave) {
      return res.status(400).json({ success: false, message: 'Image base64 data or imageUrl is required.' });
    }

    const updated = db.saveCafeImage(id, dataToSave, filename);
    if (!updated) {
      return res.status(500).json({ success: false, message: 'Failed to save cafe image.' });
    }
    return res.status(200).json({ success: true, cafe: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCafes,
  getCafeById,
  getCafeMenu,
  toggleFavorite,
  getFavorites,
  updateCafe,
  updateCafeMenu,
  addMenuItem,
  uploadCafeImage,
};

