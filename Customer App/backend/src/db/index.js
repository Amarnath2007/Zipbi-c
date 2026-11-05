const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { calculateHaversineDistance } = require('../utils/haversine');
const config = require('../config');

// Helper to resolve data files across local workspace or deployed standalone backend
function resolveDataFilePath(fileName) {
  const candidates = [
    path.resolve(__dirname, '../../../data', fileName),
    path.resolve(__dirname, '../../data', fileName),
    path.resolve(__dirname, '../data', fileName),
    path.resolve(process.cwd(), 'data', fileName),
    path.resolve(process.cwd(), '../data', fileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  // Default to backend/data/
  const fallback = path.resolve(__dirname, '../../data', fileName);
  fs.mkdirSync(path.dirname(fallback), { recursive: true });
  return fallback;
}

const dataFilePath = resolveDataFilePath('cafes.json');
const usersFilePath = resolveDataFilePath('users.json');

// In-memory runtime stores
let cafesData = [];
let referencePoint = config.defaultLocation;
const users = new Map();
const orders = new Map();
const favorites = new Map(); // customerId -> Set of cafeIds

/**
 * Immutable identity check for the Platform Owner (Super Admin)
 */
function isSuperAdminUser(user) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const ownerEmail = (config.superAdminEmail || 'admin@zipbi.com').toLowerCase().trim();
  if (email === ownerEmail) return true;
  if (user.role === 'SUPER_ADMIN' || user.isSuperAdmin === true || user.isOwner === true) return true;
  return false;
}

/**
 * Automated backup helper invoked before any destructive or bulk operation
 */
function createAutomatedBackup(reason = 'operation') {
  try {
    const backupDir = path.resolve(path.dirname(dataFilePath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const safeReason = String(reason).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const backupPath = path.join(backupDir, `cafes_auto_backup_${safeReason}_${ts}.json`);

    const payload = {
      backup_timestamp: new Date().toISOString(),
      backup_reason: reason,
      total_cafes: cafesData.length,
      reference_point: referencePoint,
      cafes: cafesData,
    };

    fs.writeFileSync(backupPath, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[Backup] Automated snapshot saved: ${backupPath}`);
    return backupPath;
  } catch (err) {
    console.warn('[Backup] Failed to create automated snapshot:', err.message);
    return null;
  }
}

/**
 * Helper to calculate current time in India (Asia/Kolkata)
 */
function getIndiaTime() {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);
  let weekday = '';
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === 'weekday') weekday = p.value.toLowerCase();
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'minute') minute = parseInt(p.value, 10);
  }
  return { weekday, hour, minute, totalMinutes: hour * 60 + minute };
}

/**
 * Dynamically computes if a business is open right now in Asia/Kolkata timezone
 */
function computeIsOpenNow(cafe) {
  if (cafe.is_active === false) return false;

  const inTime = getIndiaTime();

  if (cafe.schedule) {
    const dayMap = {
      mon: 'monday', tue: 'tuesday', wed: 'wednesday',
      thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday'
    };
    const dayKey = dayMap[inTime.weekday];
    const daySchedule = cafe.schedule[dayKey];
    if (daySchedule) {
      if (daySchedule.isClosed) return false;
      if (daySchedule.open && daySchedule.close) {
        const [openH, openM] = daySchedule.open.split(':').map(Number);
        const [closeH, closeM] = daySchedule.close.split(':').map(Number);
        const openMin = openH * 60 + openM;
        const closeMin = closeH * 60 + closeM;

        if (closeMin > openMin) {
          return inTime.totalMinutes >= openMin && inTime.totalMinutes <= closeMin;
        } else {
          // Overnight timings, e.g. 17:00 to 02:00
          return inTime.totalMinutes >= openMin || inTime.totalMinutes <= closeMin;
        }
      }
    }
  }

  if (cafe.opening_hours) {
    const oh = cafe.opening_hours.toLowerCase();
    if (oh.includes('24 hour') || oh.includes('24 hrs') || oh.includes('24x7') || oh.includes('open 24')) return true;
    if (oh.includes('closed')) return false;
    return true;
  }

  return true;
}

/**
 * Load cafes dataset from file
 */
function loadData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      cafesData = parsed.cafes || [];
      if (parsed.reference_point) {
        referencePoint = {
          name: parsed.reference_point.name,
          area: parsed.reference_point.area,
          latitude: parsed.reference_point.latitude,
          longitude: parsed.reference_point.longitude,
        };
      }
      console.log(`[DB] Successfully loaded ${cafesData.length} cafés from ${dataFilePath}`);
    } else {
      cafesData = [];
      console.warn(`[DB] Warning: ${dataFilePath} not found, initializing empty.`);
    }
  } catch (err) {
    console.error('[DB] Error loading cafes dataset:', err);
    cafesData = [];
  }
}

/**
 * Load users dataset from file or seed defaults
 */
function loadUsers() {
  try {
    if (fs.existsSync(usersFilePath)) {
      const raw = fs.readFileSync(usersFilePath, 'utf-8');
      const list = JSON.parse(raw);
      for (const u of list) {
        users.set(u.id, u);
      }
    }
  } catch (err) {
    console.warn('[DB] Could not load users.json, seeding defaults.');
  }

  // Ensure Admin account exists
  const adminExists = Array.from(users.values()).some((u) => u.email === 'admin@zipbi.com' || u.role === 'ADMIN');
  if (!adminExists) {
    const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@ZipBi2026', 10);
    const adminUser = {
      id: 'usr-admin-1',
      fullName: 'ZipBi Administrator',
      phone: '+919876500000',
      email: 'admin@zipbi.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    };
    users.set('usr-admin-1', adminUser);
  }

  // Ensure Demo customers exist
  const customerSeeds = [
    { id: 'usr-demo-1', fullName: 'Amarnath B', phone: '+919876543210', email: 'amarnath.b@example.com' },
    { id: 'usr-cust-2', fullName: 'Kaviya Ramesh', phone: '+919842101234', email: 'kaviya.r@example.com' },
    { id: 'usr-cust-3', fullName: 'Siddharth Venkat', phone: '+919842205678', email: 'sid.venkat@example.com' },
    { id: 'usr-cust-4', fullName: 'Divya Balasubramanian', phone: '+919842309012', email: 'divya.b@example.com' },
    { id: 'usr-cust-5', fullName: 'Praveen Kumar', phone: '+919842403456', email: 'praveen.k@example.com' },
    { id: 'usr-cust-6', fullName: 'Ananya Sundaram', phone: '+919842507890', email: 'ananya.s@example.com' },
    { id: 'usr-cust-7', fullName: 'Karthik Selvam', phone: '+919842601234', email: 'karthik.s@example.com' },
    { id: 'usr-cust-8', fullName: 'Meera Chandran', phone: '+919842705678', email: 'meera.c@example.com' },
  ];
  const demoPasswordHash = bcrypt.hashSync('Password123', 10);
  for (const cust of customerSeeds) {
    if (!users.has(cust.id)) {
      users.set(cust.id, {
        ...cust,
        passwordHash: demoPasswordHash,
        role: 'CUSTOMER',
        createdAt: '2026-10-15T09:30:00.000Z',
      });
    }
  }

  saveUsers();
}

function saveUsers() {
  try {
    const list = Array.from(users.values());
    fs.mkdirSync(path.dirname(usersFilePath), { recursive: true });
    fs.writeFileSync(usersFilePath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Error saving users to disk:', e);
  }
}

function matchesCategory(target, query) {
  if (!target || !query) return false;
  if (query.toLowerCase() === 'all' || query.toLowerCase() === 'more') return true;
  const clean = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const t = clean(target);
  const q = clean(query);
  if (t === q || t.includes(q) || q.includes(t)) return true;
  if (t.startsWith('cafe') && q.startsWith('cafe')) return true;
  if (t.startsWith('tea') && q.startsWith('tea')) return true;
  if (t.startsWith('baker') && q.startsWith('baker')) return true;
  if (t.startsWith('restaur') && q.startsWith('restaur')) return true;
  if (t.startsWith('other') && q.startsWith('other')) return true;
  return false;
}

const activityLogs = [
  { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), action: 'SEED_SYNC', details: 'Imported 15 verified cafés around SITRA and PSG CAS into directory', admin: 'System' },
  { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), action: 'LOCATION_CONFIG', details: 'Configured default discovery anchor: PSG CAS Main Gate (11.0326883, 77.0345773)', admin: 'ZipBi Administrator' },
  { id: 'log-3', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), action: 'SECURITY_CHECK', details: 'Verified Administrator role guard on /api/v1/admin endpoints', admin: 'ZipBi Administrator' },
  { id: 'log-4', timestamp: new Date(Date.now() - 1800000).toISOString(), action: 'AUTH_LOGIN', details: 'Super Administrator authenticated successfully', admin: 'ZipBi Administrator' },
];

// Initial load
loadData();
loadUsers();

module.exports = {
  reloadCafes: loadData,
  getReferencePoint: () => referencePoint,

  // Users
  createUser: (userData) => {
    const id = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const user = {
      id,
      ...userData,
      // Security: ensure role is CUSTOMER unless explicitly set by existing admin context
      role: userData.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
      createdAt: new Date().toISOString(),
    };
    users.set(id, user);
    saveUsers();
    return user;
  },

  findUserById: (id) => users.get(id) || null,

  findUserByIdentifier: (identifier) => {
    if (!identifier) return null;
    const cleanId = identifier.trim().toLowerCase();
    for (const u of users.values()) {
      if (
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.phone && u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, ''))
      ) {
        return u;
      }
    }
    return null;
  },

  // Customer Cafés Query (active only, distance calculated from user lat/lon)
  getAllCafes: (options = {}) => {
    const userLat = typeof options.lat === 'number' ? options.lat : referencePoint.latitude;
    const userLon = typeof options.lon === 'number' ? options.lon : referencePoint.longitude;

    // Filter out soft-deleted businesses unless explicitly requested (Super Admin audit)
    let list = options.includeDeleted === true ? cafesData : cafesData.filter((c) => c.is_deleted !== true);

    // Filter out inactive businesses for customers unless includeInactive requested (admin)
    list = options.includeInactive === true ? list : list.filter((c) => c.is_active !== false);

    let result = list.map((cafe) => {
      const dist = calculateHaversineDistance(userLat, userLon, cafe.latitude, cafe.longitude);
      const isOpen = computeIsOpenNow(cafe);
      const finalDist = dist !== null ? dist : (cafe.distance_psg_cas_km || 0.0);
      const distText = finalDist < 1 ? `${Math.round(finalDist * 1000)} m` : `${finalDist.toFixed(1)} km`;
      return {
        ...cafe,
        calculated_distance_km: finalDist,
        distance_km: finalDist,
        distance_text: distText,
        is_open_now: isOpen,
      };
    });

    // 1. Text Search query
    if (options.q && options.q.trim()) {
      const q = options.q.trim().toLowerCase();
      result = result.filter((c) => {
        const inName = c.name.toLowerCase().includes(q);
        const inArea = c.area ? c.area.toLowerCase().includes(q) : false;
        const inDesc = c.description ? c.description.toLowerCase().includes(q) : false;
        const inTags = c.cuisine_tags ? c.cuisine_tags.some((t) => t.toLowerCase().includes(q)) : false;
        const inMenu = c.menu_categories
          ? c.menu_categories.some((cat) =>
              cat.items.some(
                (item) => item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q))
              )
            )
          : false;
        return inName || inArea || inDesc || inTags || inMenu;
      });
    }

    // 2. Category filter
    if (options.category && options.category.toLowerCase() !== 'all' && options.category.toLowerCase() !== 'more') {
      result = result.filter((c) => {
        if (matchesCategory(c.category, options.category)) return true;
        if (c.specified_business_type && matchesCategory(c.specified_business_type, options.category)) return true;
        if (c.cuisine_tags && c.cuisine_tags.some((t) => matchesCategory(t, options.category))) return true;
        return false;
      });
    }

    // 3. Distance filter
    if (typeof options.maxDistance === 'number' && options.maxDistance > 0) {
      result = result.filter((c) => c.calculated_distance_km <= options.maxDistance);
    }

    // 4. Rating filter
    if (typeof options.minRating === 'number' && options.minRating > 0) {
      result = result.filter((c) => c.rating && c.rating >= options.minRating);
    }

    // 5. Open Now filter
    if (options.openNow === true) {
      result = result.filter((c) => c.is_open_now === true);
    }

    // 6. Has Menu filter
    if (options.hasMenu === true) {
      result = result.filter((c) => c.has_published_menu === true);
    }

    // 7. Sort by distance ascending by default
    result.sort((a, b) => a.calculated_distance_km - b.calculated_distance_km);

    return result;
  },

  getCafeById: (id, options = {}) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return null;
    if (cafe.is_deleted === true && options.includeDeleted !== true) return null;
    return {
      ...cafe,
      is_open_now: computeIsOpenNow(cafe),
    };
  },

  // Admin CRUD for Businesses
  createCafe: (cafeData, requestingUser = null) => {
    const slug = (cafeData.slug || cafeData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    const id = cafeData.id || `cafe-${slug}`;

    const isOthers = (cafeData.category || '').toLowerCase() === 'others' || (cafeData.category || '').toLowerCase() === 'other';
    const category = isOthers ? 'Others' : (cafeData.category || 'Cafés');
    const specified_business_type = isOthers && cafeData.specified_business_type ? cafeData.specified_business_type.trim() : null;

    const userEmail = requestingUser ? (requestingUser.email || requestingUser.id || 'admin@zipbi.com') : 'admin@zipbi.com';
    const isSuper = isSuperAdminUser(requestingUser);

    const newCafe = {
      id,
      name: cafeData.name,
      slug,
      description: cafeData.description || '',
      category,
      specified_business_type,
      cuisine_tags: Array.isArray(cafeData.cuisine_tags) && cafeData.cuisine_tags.length > 0
        ? cafeData.cuisine_tags
        : [specified_business_type || category],
      address: cafeData.address || cafeData.formatted_address || '',
      area: (cafeData.area || cafeData.locality || '').trim() || 'Coimbatore',
      city: (cafeData.city || 'Coimbatore').trim(),
      district: (cafeData.district || cafeData.city || 'Coimbatore').trim(),
      state: (cafeData.state || 'Tamil Nadu').trim(),
      pincode: (cafeData.pincode || cafeData.postalCode || cafeData.postal_code || '').trim(),
      location_meta: cafeData.location_meta || null,
      latitude: parseFloat(cafeData.latitude !== undefined ? cafeData.latitude : 11.0326883),
      longitude: parseFloat(cafeData.longitude !== undefined ? cafeData.longitude : 77.0345773),
      google_maps_url: cafeData.google_maps_url || null,
      google_place_id: cafeData.google_place_id || null,
      formatted_address: cafeData.formatted_address || cafeData.address || null,
      location_verification_status: cafeData.location_verification_status || (cafeData.google_maps_url ? 'GOOGLE_MAPS_VERIFIED' : 'UNCLAIMED'),
      verified_at: cafeData.verified_at || new Date().toISOString(),
      website: cafeData.website || null,
      merchant_owner_id: cafeData.merchant_owner_id || null,
      phone: cafeData.phone || '',
      email: cafeData.email || '',
      cost_for_two: cafeData.cost_for_two ? parseInt(cafeData.cost_for_two, 10) : null,
      cover_image: cafeData.cover_image || 'assets/images/placeholder_cafe.png',
      cover_image_url: cafeData.cover_image_url || cafeData.cover_image || null,
      gallery_images: Array.isArray(cafeData.gallery_images) ? cafeData.gallery_images : [],
      opening_hours: cafeData.opening_hours || '10:00 AM - 10:00 PM',
      schedule: cafeData.schedule || null,
      rating: cafeData.rating ? parseFloat(cafeData.rating) : null,
      review_count: cafeData.review_count ? parseInt(cafeData.review_count, 10) : 0,
      verification_status: cafeData.verification_status || 'UNCLAIMED',
      is_active: cafeData.is_active !== false,
      is_ordering_enabled: cafeData.is_ordering_enabled === true,
      has_published_menu: Array.isArray(cafeData.menu_categories) && cafeData.menu_categories.length > 0,
      menu_categories: Array.isArray(cafeData.menu_categories) ? cafeData.menu_categories : [],
      // Ownership & Protection Metadata
      created_by: userEmail,
      created_at: new Date().toISOString(),
      last_modified_by: userEmail,
      last_modified_at: new Date().toISOString(),
      record_ownership: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
      is_protected: isSuper || cafeData.is_protected === true,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
    };

    cafesData.push(newCafe);
    module.exports.saveData();
    return newCafe;
  },

  updateCafe: (id, updates, requestingUser = null) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return null;

    // Strict Ownership Enforcement: Protected records can ONLY be modified by Super Admin
    if ((cafe.is_protected === true || cafe.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This business listing is protected by the Platform Owner and cannot be modified by other users.',
      };
    }

    // Preserve immutable ownership metadata
    const safeUpdates = { ...updates };
    delete safeUpdates.is_protected;
    delete safeUpdates.record_ownership;
    delete safeUpdates.created_by;
    delete safeUpdates.created_at;

    const userEmail = requestingUser ? (requestingUser.email || requestingUser.id || 'admin@zipbi.com') : 'admin@zipbi.com';
    safeUpdates.last_modified_by = userEmail;
    safeUpdates.last_modified_at = new Date().toISOString();

    if (safeUpdates.category !== undefined) {
      const isOthers = safeUpdates.category.toLowerCase() === 'others' || safeUpdates.category.toLowerCase() === 'other';
      safeUpdates.category = isOthers ? 'Others' : safeUpdates.category;
      if (isOthers) {
        safeUpdates.specified_business_type = safeUpdates.specified_business_type
          ? safeUpdates.specified_business_type.trim()
          : (cafe.specified_business_type || 'Other Food Business');
      } else {
        safeUpdates.specified_business_type = null;
      }
    } else if (safeUpdates.specified_business_type !== undefined && cafe.category === 'Others') {
      safeUpdates.specified_business_type = safeUpdates.specified_business_type ? safeUpdates.specified_business_type.trim() : cafe.specified_business_type;
    }

    Object.assign(cafe, safeUpdates, { updated_at: new Date().toISOString() });
    if (safeUpdates.latitude !== undefined || safeUpdates.longitude !== undefined) {
      cafe.calculated_distance_km = calculateHaversineDistance(
        referencePoint.latitude,
        referencePoint.longitude,
        cafe.latitude,
        cafe.longitude
      );
    }
    module.exports.saveData();
    return cafe;
  },

  deleteCafe: (id, requestingUser = null, options = {}) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return false;

    // Strict Ownership Enforcement: Protected records can ONLY be deleted by Super Admin
    if ((cafe.is_protected === true || cafe.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This business listing is protected by the Platform Owner and cannot be deleted by other users.',
      };
    }

    const userEmail = requestingUser ? (requestingUser.email || requestingUser.id || 'admin@zipbi.com') : 'admin@zipbi.com';

    // Automatic backup before any deletion
    createAutomatedBackup(`delete_${options.purge ? 'purge' : 'soft'}_${cafe.slug}`);

    // If permanent purge requested by Super Admin with explicit confirmation
    if (options.purge === true && isSuperAdminUser(requestingUser)) {
      const index = cafesData.findIndex((c) => c.id === id || c.slug === id);
      if (index !== -1) {
        const removed = cafesData.splice(index, 1)[0];
        for (const [userId, favSet] of favorites.entries()) {
          favSet.delete(removed.id);
        }
        module.exports.saveData();
        return { success: true, purged: true, cafe: removed };
      }
      return false;
    }

    // Safe Soft-Deletion / Archival by default:
    cafe.is_deleted = true;
    cafe.is_active = false;
    cafe.deleted_at = new Date().toISOString();
    cafe.deleted_by = userEmail;
    cafe.updated_at = new Date().toISOString();
    cafe.last_modified_by = userEmail;
    cafe.last_modified_at = new Date().toISOString();

    module.exports.saveData();
    return { success: true, softDeleted: true, cafe };
  },

  restoreCafe: (id, requestingUser = null) => {
    if (!isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: Only the Platform Owner (Super Admin) can restore archived records.',
      };
    }

    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return null;

    cafe.is_deleted = false;
    cafe.deleted_at = null;
    cafe.deleted_by = null;
    cafe.is_active = true;
    cafe.updated_at = new Date().toISOString();
    cafe.last_modified_by = requestingUser ? (requestingUser.email || 'admin@zipbi.com') : 'admin@zipbi.com';
    cafe.last_modified_at = new Date().toISOString();

    createAutomatedBackup(`restore_${cafe.slug}`);
    module.exports.saveData();
    return cafe;
  },

  purgeCafe: (id, requestingUser = null, options = {}) => {
    return module.exports.deleteCafe(id, requestingUser, { ...options, purge: true });
  },

  clearAllCafes: () => {
    cafesData = [];
    favorites.clear();
    module.exports.saveData();
    return true;
  },

  toggleCafeStatus: (id, isActive, requestingUser = null) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return null;

    if (cafe.is_protected && requestingUser && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Platform Owner protected listing. Only Super Admin can change status of this business.',
      };
    }

    cafe.is_active = Boolean(isActive);
    cafe.last_modified_by = requestingUser ? (requestingUser.email || requestingUser.id || 'SUPER_ADMIN') : 'SUPER_ADMIN';
    cafe.last_modified_at = new Date().toISOString();
    cafe.updated_at = new Date().toISOString();
    module.exports.saveData();
    return cafe;
  },

  // Admin Overview Statistics
  getAdminStats: () => {
    const total = cafesData.length;
    let verifiedCount = 0;
    let partnerCount = 0;
    let activeSubscriptions = 0;
    let cafesCount = 0;
    let restaurantsCount = 0;
    let teaShopsCount = 0;
    let bakeriesCount = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    let totalMenuItems = 0;
    let estimatedMonthlyRevenue = 0;

    for (const c of cafesData) {
      if (c.is_active !== false) activeCount++;
      else inactiveCount++;

      if (c.verification_status === 'ACTIVE_PARTNER' || c.verification_status === 'VERIFIED') {
        verifiedCount++;
      }
      if (c.verification_status === 'ACTIVE_PARTNER') {
        partnerCount++;
        activeSubscriptions++;
      }

      // Aggregated café-level monthly volume estimate based on average cost for two
      const avgOrder = Math.max(120, (c.cost_for_two || 350) / 2);
      const dailyOrders = c.verification_status === 'ACTIVE_PARTNER' ? 45 : 20;
      estimatedMonthlyRevenue += Math.round(avgOrder * dailyOrders * 30);

      const cat = (c.category || '').toLowerCase();
      if (cat.includes('cafe') || cat.includes('café')) cafesCount++;
      else if (cat.includes('restaur')) restaurantsCount++;
      else if (cat.includes('tea')) teaShopsCount++;
      else if (cat.includes('baker')) bakeriesCount++;

      if (Array.isArray(c.menu_categories)) {
        for (const mc of c.menu_categories) {
          if (Array.isArray(mc.items)) {
            totalMenuItems += mc.items.length;
          }
        }
      }
    }

    let customerUsersCount = 0;
    for (const u of users.values()) {
      if (u.role === 'CUSTOMER') customerUsersCount++;
    }

    return {
      totalCafes: total,
      verifiedCafes: verifiedCount,
      merchantPartners: partnerCount,
      customerUsers: customerUsersCount,
      activeSubscriptions: activeSubscriptions,
      monthlyCafeRevenue: estimatedMonthlyRevenue,
      formattedRevenue: '₹' + estimatedMonthlyRevenue.toLocaleString('en-IN'),
      totalBusinesses: total,
      cafes: cafesCount,
      restaurants: restaurantsCount,
      teaShops: teaShopsCount,
      bakeries: bakeriesCount,
      activeBusinesses: activeCount,
      inactiveBusinesses: inactiveCount,
      totalMenuItems,
    };
  },

  // Customer App Users (password stripped)
  getAllUsers: () => {
    const list = [];
    for (const u of users.values()) {
      if (u.role === 'CUSTOMER') {
        list.push({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          role: u.role,
          createdAt: u.createdAt,
          ordersCount: Array.from(orders.values()).filter((o) => o.customerId === u.id).length,
        });
      }
    }
    return list;
  },

  // Merchant Partners overview
  getMerchantPartners: () => {
    return cafesData
      .filter((c) => c.verification_status === 'ACTIVE_PARTNER' || c.is_ordering_enabled)
      .map((c) => ({
        id: c.id,
        name: c.name,
        area: c.area,
        phone: c.phone || 'Pending',
        tier: 'Gold Partner',
        commissionRate: '8.0%',
        onboardingDate: c.verified_at || '2026-11-04',
        status: 'Active',
      }));
  },

  // Aggregated Café Revenue (privacy preserved: no individual transactions or expenses)
  getRevenueOverview: () => {
    let totalAggregatedVolume = 0;
    let totalPlatformEarnings = 0;

    const breakdown = cafesData
      .filter((c) => c.verification_status === 'ACTIVE_PARTNER')
      .map((c) => {
        const avgOrder = Math.max(150, (c.cost_for_two || 350) / 2);
        const orders = 950 + (c.review_count || 10) * 12;
        const volume = Math.round(orders * avgOrder);
        const platformFee = Math.round(volume * 0.08);

        totalAggregatedVolume += volume;
        totalPlatformEarnings += platformFee;

        return {
          id: c.id,
          name: c.name,
          category: c.category,
          monthlyVolume: volume,
          formattedVolume: '₹' + volume.toLocaleString('en-IN'),
          estimatedOrders: orders,
          commissionRate: '8.0%',
          platformFee: platformFee,
          formattedFee: '₹' + platformFee.toLocaleString('en-IN'),
        };
      });

    return {
      privacyNote: 'In accordance with consumer privacy guidelines, customer basket contents and individual customer transactions are strictly excluded from this report.',
      totalAggregatedVolume,
      formattedTotalVolume: '₹' + totalAggregatedVolume.toLocaleString('en-IN'),
      totalPlatformEarnings,
      formattedTotalEarnings: '₹' + totalPlatformEarnings.toLocaleString('en-IN'),
      cafes: breakdown,
    };
  },

  // Subscriptions overview
  getSubscriptions: () => {
    const plans = [
      { id: 'plan-free', name: 'Starter Directory', price: '₹0 / mo', description: 'Listing, location & menu discovery', features: ['Address & Map Anchor', 'Search Indexing', 'Text Menu Display'] },
      { id: 'plan-growth', name: 'Growth Merchant', price: '₹999 / mo', description: 'Priority discovery badge & direct ordering', features: ['Table Orders', 'Priority Nearby Ranking', 'Customer Analytics'] },
      { id: 'plan-pro', name: 'Enterprise Pro', price: '₹2,499 / mo', description: 'Full ordering, real-time analytics & multi-branch', features: ['Instant SMS & Webhooks', 'Custom Branding', 'Dedicated Account Mgr'] },
    ];

    const subscribers = cafesData
      .filter((c) => c.verification_status === 'ACTIVE_PARTNER')
      .map((c, i) => ({
        id: `sub-${c.id}`,
        cafeName: c.name,
        plan: i % 2 === 0 ? 'Enterprise Pro' : 'Growth Merchant',
        price: i % 2 === 0 ? '₹2,499 / mo' : '₹999 / mo',
        billingCycle: 'Monthly (Active)',
        renewalDate: '2026-12-04',
        status: 'Active',
      }));

    return { plans, subscribers };
  },

  // Activity Logs
  getActivityLogs: () => activityLogs,

  logActivity: (action, details, admin = 'ZipBi Administrator') => {
    const entry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      admin,
    };
    activityLogs.unshift(entry);
    if (activityLogs.length > 50) activityLogs.pop();
    return entry;
  },

  // Menu Management
  getCafeMenu: (id) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return null;
    const status = cafe.menu_status || (cafe.has_published_menu ? 'Partially Verified' : 'Awaiting Merchant Confirmation');
    const notes = cafe.menu_status_notes || null;
    const categories = Array.isArray(cafe.menu_categories) ? cafe.menu_categories : [];

    let totalItems = 0;
    let availableItems = 0;
    let unavailableItems = 0;

    categories.forEach((cat, cIdx) => {
      if (!cat.id) {
        cat.id = `cat-${Date.now()}-${cIdx}-${Math.floor(Math.random() * 1000)}`;
      }
      if (!Array.isArray(cat.items)) cat.items = [];
      cat.items.forEach((it, iIdx) => {
        if (!it.id) {
          it.id = `item-${Date.now()}-${cIdx}-${iIdx}-${Math.floor(Math.random() * 1000)}`;
        }
        totalItems++;
        if (it.is_available !== false) {
          availableItems++;
        } else {
          unavailableItems++;
        }
      });
    });

    return {
      cafeId: cafe.id,
      cafeName: cafe.name,
      menuStatus: status,
      menu_status: status,
      menuStatusNotes: notes,
      menu_status_notes: notes,
      hasPublishedMenu: cafe.has_published_menu || false,
      isOrderingEnabled: cafe.is_ordering_enabled || false,
      totalCategories: categories.length,
      totalItems,
      availableItems,
      unavailableItems,
      categories,
    };
  },

  updateCafeMenu: (id, categories, menuStatus, menuStatusNotes) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return null;

    cafe.menu_categories = Array.isArray(categories) ? categories : [];
    cafe.has_published_menu = cafe.menu_categories.some((c) => Array.isArray(c.items) && c.items.length > 0);
    if (menuStatus) cafe.menu_status = menuStatus;
    if (menuStatusNotes !== undefined) cafe.menu_status_notes = menuStatusNotes;
    cafe.updated_at = new Date().toISOString();
    module.exports.saveData();
    return cafe;
  },

  updateMenuStatus: (id, menuStatus, menuStatusNotes, requestingUser = null) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return null;

    if ((cafe.is_protected === true || cafe.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This business menu is protected by the Platform Owner and cannot be modified by other users.',
      };
    }

    cafe.menu_status = menuStatus;
    if (menuStatusNotes !== undefined) cafe.menu_status_notes = menuStatusNotes;
    cafe.last_modified_by = requestingUser ? (requestingUser.email || requestingUser.id || 'SUPER_ADMIN') : 'SUPER_ADMIN';
    cafe.last_modified_at = new Date().toISOString();
    cafe.updated_at = new Date().toISOString();
    module.exports.saveData();
    return cafe;
  },

  addMenuCategory: (id, categoryData, requestingUser = null) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return null;

    if ((cafe.is_protected === true || cafe.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This business menu is protected by the Platform Owner and cannot be modified by other users.',
      };
    }

    if (!Array.isArray(cafe.menu_categories)) cafe.menu_categories = [];
    const catName = typeof categoryData === 'string' ? categoryData.trim() : ((categoryData && categoryData.name) || '').trim();
    if (!catName) return cafe.menu_categories;

    const userEmail = requestingUser ? (requestingUser.email || requestingUser.id || 'admin@zipbi.com') : 'admin@zipbi.com';
    const isSuper = isSuperAdminUser(requestingUser);

    const exists = cafe.menu_categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (!exists) {
      const newCat = {
        id: (categoryData && categoryData.id) || `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: catName,
        description: (categoryData && categoryData.description) || '',
        is_enabled: categoryData && categoryData.is_enabled !== undefined ? categoryData.is_enabled : true,
        display_order: cafe.menu_categories.length + 1,
        items: [],
        created_by: userEmail,
        record_ownership: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
        is_protected: isSuper,
      };
      cafe.menu_categories.push(newCat);
      cafe.updated_at = new Date().toISOString();
      cafe.last_modified_by = userEmail;
      cafe.last_modified_at = new Date().toISOString();
      module.exports.saveData();
    }
    return cafe.menu_categories;
  },

  renameMenuCategory: (id, oldName, newName, description, isEnabled, requestingUser = null) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe || !Array.isArray(cafe.menu_categories)) return null;

    if ((cafe.is_protected === true || cafe.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This business menu is protected by the Platform Owner and cannot be modified by other users.',
      };
    }

    const cat = cafe.menu_categories.find(
      (c) => c.name.toLowerCase() === oldName.trim().toLowerCase() || c.id === oldName
    );
    if (!cat) return null;

    if (newName && newName.trim()) {
      cat.name = newName.trim();
    }
    if (description !== undefined) {
      cat.description = description;
    }
    if (isEnabled !== undefined) {
      cat.is_enabled = Boolean(isEnabled);
    }
    const userEmail = requestingUser ? (requestingUser.email || requestingUser.id || 'admin@zipbi.com') : 'admin@zipbi.com';
    cat.last_modified_by = userEmail;
    cat.last_modified_at = new Date().toISOString();
    cafe.updated_at = new Date().toISOString();
    cafe.last_modified_by = userEmail;
    cafe.last_modified_at = new Date().toISOString();
    module.exports.saveData();
    return cafe.menu_categories;
  },

  deleteMenuCategory: (id, categoryName, options = {}, requestingUser = null) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe || !Array.isArray(cafe.menu_categories)) return null;

    if ((cafe.is_protected === true || cafe.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This business menu is protected by the Platform Owner and cannot be deleted by other users.',
      };
    }

    const targetCat = cafe.menu_categories.find(
      (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase() || c.id === categoryName
    );
    if (!targetCat) return cafe.menu_categories;

    createAutomatedBackup(`delete_cat_${cafe.slug}_${categoryName}`);

    // If options.moveItemsTo is provided, move items to the destination category
    if (options && options.moveItemsTo && Array.isArray(targetCat.items) && targetCat.items.length > 0) {
      const destCatName = options.moveItemsTo.trim().toLowerCase();
      let destCat = cafe.menu_categories.find(
        (c) => (c.name.toLowerCase() === destCatName || c.id === options.moveItemsTo) && c !== targetCat
      );
      if (!destCat) {
        destCat = {
          id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: options.moveItemsTo.trim(),
          description: '',
          is_enabled: true,
          display_order: cafe.menu_categories.length + 1,
          items: [],
          created_by: requestingUser ? requestingUser.email : 'admin@zipbi.com',
          record_ownership: isSuperAdminUser(requestingUser) ? 'SUPER_ADMIN' : 'ADMIN',
          is_protected: isSuperAdminUser(requestingUser),
        };
        cafe.menu_categories.push(destCat);
      }
      destCat.items.push(...targetCat.items);
    }

    cafe.menu_categories = cafe.menu_categories.filter((c) => c !== targetCat);
    cafe.has_published_menu = cafe.menu_categories.some((c) => Array.isArray(c.items) && c.items.length > 0);
    cafe.updated_at = new Date().toISOString();
    module.exports.saveData();
    return cafe.menu_categories;
  },

  reorderMenuCategories: (id, categoryNames, requestingUser = null) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe || !Array.isArray(cafe.menu_categories) || !Array.isArray(categoryNames)) return null;

    if ((cafe.is_protected === true || cafe.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This business menu is protected by the Platform Owner and cannot be modified by other users.',
      };
    }
    if (!cafe || !Array.isArray(cafe.menu_categories) || !Array.isArray(categoryNames)) return null;

    const ordered = [];
    for (const name of categoryNames) {
      const match = cafe.menu_categories.find(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase() || c.id === name
      );
      if (match) ordered.push(match);
    }
    for (const remaining of cafe.menu_categories) {
      if (!ordered.includes(remaining)) ordered.push(remaining);
    }
    cafe.menu_categories = ordered;
    cafe.updated_at = new Date().toISOString();
    module.exports.saveData();
    return cafe.menu_categories;
  },

  addMenuItem: (id, categoryName, itemData, requestingUser = null) => {
    const cafe = cafesData.find((c) => c.id === id || c.slug === id);
    if (!cafe) return null;

    if ((cafe.is_protected === true || cafe.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This business menu is protected by the Platform Owner and cannot be modified by other users.',
      };
    }

    const userEmail = requestingUser ? (requestingUser.email || requestingUser.id || 'admin@zipbi.com') : 'admin@zipbi.com';
    const isSuper = isSuperAdminUser(requestingUser);

    if (!Array.isArray(cafe.menu_categories)) cafe.menu_categories = [];
    const targetCatName = (categoryName || 'General').trim();
    let cat = cafe.menu_categories.find((c) => c.name.toLowerCase() === targetCatName.toLowerCase());
    if (!cat) {
      cat = {
        id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: targetCatName,
        description: '',
        is_enabled: true,
        display_order: cafe.menu_categories.length + 1,
        items: [],
        created_by: userEmail,
        record_ownership: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
        is_protected: isSuper,
      };
      cafe.menu_categories.push(cat);
    }

    const priceNum = typeof itemData.price === 'number' ? itemData.price : parseFloat(itemData.price || 0);
    const foodType = (itemData.food_type || itemData.foodType || (itemData.is_veg === false ? 'NON_VEG' : 'VEG')).toUpperCase();
    const isVeg = foodType === 'VEG' || foodType === 'VEGAN';

    const newItem = {
      id: itemData.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: (itemData.name || '').trim(),
      description: (itemData.description || '').trim(),
      price: isNaN(priceNum) || priceNum < 0 ? 0 : priceNum,
      food_type: foodType,
      is_veg: isVeg,
      is_available: itemData.is_available !== false && itemData.isAvailable !== false,
      is_enabled: itemData.is_enabled !== false && itemData.isEnabled !== false,
      source: itemData.source || 'Admin Upload',
      verified_date: new Date().toISOString().split('T')[0],
      variants: Array.isArray(itemData.variants) ? itemData.variants : [],
      created_by: userEmail,
      record_ownership: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
      is_protected: isSuper,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
    };

    cat.items.push(newItem);
    cafe.has_published_menu = true;
    cafe.updated_at = new Date().toISOString();
    cafe.last_modified_by = userEmail;
    cafe.last_modified_at = new Date().toISOString();
    module.exports.saveData();
    return { cafe, item: newItem, categories: cafe.menu_categories };
  },

  updateMenuItem: (cafeId, categoryName, itemId, updates, newCategoryName, requestingUser = null) => {
    const cafe = cafesData.find((c) => c.id === cafeId || c.slug === cafeId);
    if (!cafe || !Array.isArray(cafe.menu_categories)) return null;

    let targetItem = null;
    let currentCat = null;
    const strId = String(itemId).trim().toLowerCase();
    const matchItem = (i) => i && (String(i.id).toLowerCase() === strId || (i.name && String(i.name).trim().toLowerCase() === strId));

    // Find the item across categories
    for (const cat of cafe.menu_categories) {
      if (categoryName && cat.name.toLowerCase() !== categoryName.toLowerCase() && cat.id !== categoryName) {
        continue;
      }
      const item = (cat.items || []).find(matchItem);
      if (item) {
        targetItem = item;
        currentCat = cat;
        break;
      }
    }

    if (!targetItem) {
      for (const cat of cafe.menu_categories) {
        const item = (cat.items || []).find(matchItem);
        if (item) {
          targetItem = item;
          currentCat = cat;
          break;
        }
      }
    }

    if (!targetItem) return null;

    // Strict Ownership Enforcement: Protected items can ONLY be modified by Super Admin
    if ((targetItem.is_protected === true || cafe.is_protected === true || targetItem.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This menu item is protected by the Platform Owner and cannot be modified by other users.',
      };
    }

    const userEmail = requestingUser ? (requestingUser.email || requestingUser.id || 'admin@zipbi.com') : 'admin@zipbi.com';

    // Apply updates
    if (updates.name !== undefined && String(updates.name).trim()) targetItem.name = String(updates.name).trim();
    if (updates.description !== undefined) targetItem.description = String(updates.description).trim();
    if (updates.price !== undefined) {
      const p = parseFloat(updates.price);
      if (!isNaN(p) && p >= 0) targetItem.price = p;
    }
    if (updates.food_type || updates.foodType) {
      targetItem.food_type = (updates.food_type || updates.foodType).toUpperCase();
      targetItem.is_veg = targetItem.food_type === 'VEG' || targetItem.food_type === 'VEGAN';
    } else if (updates.is_veg !== undefined || updates.isVeg !== undefined) {
      targetItem.is_veg = updates.is_veg !== false && updates.isVeg !== false;
      targetItem.food_type = targetItem.is_veg ? 'VEG' : 'NON_VEG';
    }
    if (updates.is_available !== undefined || updates.isAvailable !== undefined) {
      targetItem.is_available = updates.is_available !== false && updates.isAvailable !== false;
    }
    if (updates.is_enabled !== undefined || updates.isEnabled !== undefined) {
      targetItem.is_enabled = updates.is_enabled !== false && updates.isEnabled !== false;
    }

    targetItem.last_modified_by = userEmail;
    targetItem.last_modified_at = new Date().toISOString();

    // Move to new category if requested
    const destCatName = (newCategoryName || '').trim();
    if (destCatName && currentCat && currentCat.name.toLowerCase() !== destCatName.toLowerCase() && currentCat.id !== destCatName) {
      currentCat.items = currentCat.items.filter((i) => i !== targetItem);
      let destCat = cafe.menu_categories.find((c) => c.name.toLowerCase() === destCatName.toLowerCase() || c.id === destCatName);
      if (!destCat) {
        destCat = {
          id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: destCatName,
          description: '',
          is_enabled: true,
          display_order: cafe.menu_categories.length + 1,
          items: [],
          created_by: userEmail,
          record_ownership: isSuperAdminUser(requestingUser) ? 'SUPER_ADMIN' : 'ADMIN',
          is_protected: isSuperAdminUser(requestingUser),
        };
        cafe.menu_categories.push(destCat);
      }
      destCat.items.push(targetItem);
    }

    cafe.updated_at = new Date().toISOString();
    cafe.last_modified_by = userEmail;
    cafe.last_modified_at = new Date().toISOString();
    module.exports.saveData();
    return { item: targetItem, categories: cafe.menu_categories, cafe };
  },

  deleteMenuItem: (cafeId, itemId, requestingUser = null, options = {}) => {
    const cafe = cafesData.find((c) => c.id === cafeId || c.slug === cafeId);
    if (!cafe || !Array.isArray(cafe.menu_categories)) return false;

    const strId = String(itemId).trim().toLowerCase();
    const matchItem = (i) => i && (String(i.id).toLowerCase() === strId || (i.name && String(i.name).trim().toLowerCase() === strId));

    let targetItem = null;
    let targetCat = null;
    let targetIdx = -1;

    for (const cat of cafe.menu_categories) {
      const idx = (cat.items || []).findIndex(matchItem);
      if (idx !== -1) {
        targetItem = cat.items[idx];
        targetCat = cat;
        targetIdx = idx;
        break;
      }
    }

    if (!targetItem) return false;

    // Strict Ownership Enforcement: Protected items can ONLY be deleted by Super Admin
    if ((targetItem.is_protected === true || cafe.is_protected === true || targetItem.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This menu item is protected by the Platform Owner and cannot be deleted by other users.',
      };
    }

    createAutomatedBackup(`delete_item_${cafe.slug}_${targetItem.id}`);
    const userEmail = requestingUser ? (requestingUser.email || requestingUser.id || 'admin@zipbi.com') : 'admin@zipbi.com';

    targetCat.items.splice(targetIdx, 1);
    cafe.has_published_menu = cafe.menu_categories.some((c) => Array.isArray(c.items) && c.items.length > 0);
    cafe.updated_at = new Date().toISOString();
    cafe.last_modified_by = userEmail;
    cafe.last_modified_at = new Date().toISOString();
    module.exports.saveData();
    return true;
  },

  toggleMenuItemAvailability: (cafeId, itemId, isAvailable) => {
    const cafe = cafesData.find((c) => c.id === cafeId || c.slug === cafeId);
    if (!cafe || !Array.isArray(cafe.menu_categories)) return null;

    const strId = String(itemId).trim().toLowerCase();
    const matchItem = (i) => i && (String(i.id).toLowerCase() === strId || (i.name && String(i.name).trim().toLowerCase() === strId));

    let targetItem = null;
    for (const cat of cafe.menu_categories) {
      const item = (cat.items || []).find(matchItem);
      if (item) {
        item.is_available = isAvailable !== undefined ? Boolean(isAvailable) : !item.is_available;
        targetItem = item;
        break;
      }
    }

    if (targetItem) {
      cafe.updated_at = new Date().toISOString();
      module.exports.saveData();
    }
    return targetItem;
  },

  importStructuredMenu: (cafeId, parsedData, options = {}) => {
    const cafe = cafesData.find((c) => c.id === cafeId || c.slug === cafeId);
    if (!cafe) return null;

    const requestingUser = options.requestingUser || null;
    if ((cafe.is_protected === true || cafe.record_ownership === 'SUPER_ADMIN') && !isSuperAdminUser(requestingUser)) {
      return {
        forbidden: true,
        message: 'Access denied: This business menu is protected by the Platform Owner and cannot be modified or imported by other users.',
      };
    }

    createAutomatedBackup(`menu_import_${options.mode || 'replace'}_${cafe.slug}`);
    const userEmail = requestingUser ? (requestingUser.email || requestingUser.id || 'admin@zipbi.com') : 'admin@zipbi.com';
    const isSuper = isSuperAdminUser(requestingUser);

    const mode = options.mode || 'replace'; // 'replace' or 'merge'
    const adminName = options.adminName || 'ZipBi Administrator';
    const menuStatus = options.menuStatus || 'Verified Menu';

    if (!Array.isArray(cafe.menu_categories)) {
      cafe.menu_categories = [];
    }

    const incomingCategories = Array.isArray(parsedData.categories) ? parsedData.categories : [];
    let importedCategoriesCount = 0;
    let importedItemsCount = 0;

    const buildItem = (rawItem, catIdx, itemIdx) => {
      const priceNum = rawItem.price !== null && rawItem.price !== undefined && !isNaN(Number(rawItem.price))
        ? Math.round(Number(rawItem.price))
        : null;
      const rawFt = (rawItem.food_type || rawItem.foodType || 'unknown').toString().toLowerCase();
      let foodType = 'UNKNOWN';
      if (rawFt.includes('non') || rawFt.includes('meat') || rawFt.includes('chicken') || rawFt.includes('fish')) {
        foodType = 'NON_VEG';
      } else if (rawFt.includes('egg')) {
        foodType = 'EGG';
      } else if (rawFt.includes('vegan')) {
        foodType = 'VEGAN';
      } else if (rawFt.includes('veg')) {
        foodType = 'VEG';
      }

      return {
        id: `item-${Date.now()}-${catIdx}-${itemIdx}-${Math.floor(Math.random() * 1000)}`,
        name: (rawItem.name || '').trim(),
        description: rawItem.description ? rawItem.description.toString().trim() : '',
        price: priceNum,
        currency: 'INR',
        food_type: foodType,
        is_veg: foodType === 'VEG' || foodType === 'VEGAN',
        is_available: true,
        is_enabled: true,
        source: 'AI Structured Paste',
        verified_date: new Date().toISOString().split('T')[0],
        variants: [],
        created_by: userEmail,
        record_ownership: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
        is_protected: isSuper,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      };
    };

    if (mode === 'replace') {
      const newCategories = [];
      incomingCategories.forEach((rawCat, catIdx) => {
        const catName = (rawCat.name || `Category ${catIdx + 1}`).trim();
        const items = [];
        (rawCat.items || []).forEach((rawItem, itemIdx) => {
          items.push(buildItem(rawItem, catIdx, itemIdx));
          importedItemsCount++;
        });
        newCategories.push({
          id: `cat-${Date.now()}-${catIdx}-${Math.floor(Math.random() * 1000)}`,
          name: catName,
          description: rawCat.description || '',
          is_enabled: true,
          display_order: catIdx + 1,
          items,
          created_by: userEmail,
          record_ownership: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
          is_protected: isSuper,
        });
        importedCategoriesCount++;
      });
      cafe.menu_categories = newCategories;
    } else {
      // Merge mode
      incomingCategories.forEach((rawCat, catIdx) => {
        const catName = (rawCat.name || '').trim();
        let existingCat = cafe.menu_categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
        if (!existingCat) {
          existingCat = {
            id: `cat-${Date.now()}-${catIdx}-${Math.floor(Math.random() * 1000)}`,
            name: catName,
            description: rawCat.description || '',
            is_enabled: true,
            display_order: cafe.menu_categories.length + 1,
            items: [],
            created_by: userEmail,
            record_ownership: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
            is_protected: isSuper,
          };
          cafe.menu_categories.push(existingCat);
          importedCategoriesCount++;
        }
        (rawCat.items || []).forEach((rawItem, itemIdx) => {
          const itemName = (rawItem.name || '').trim().toLowerCase();
          const existingItem = existingCat.items.find((i) => i.name.toLowerCase() === itemName);
          if (existingItem) {
            // Update existing item details
            if (rawItem.price !== null && rawItem.price !== undefined) {
              existingItem.price = Math.round(Number(rawItem.price));
            }
            if (rawItem.description) existingItem.description = rawItem.description.trim();
            if (rawItem.food_type) {
              const b = buildItem(rawItem, catIdx, itemIdx);
              existingItem.food_type = b.food_type;
              existingItem.is_veg = b.is_veg;
            }
            existingItem.last_modified_by = userEmail;
            existingItem.last_modified_at = new Date().toISOString();
          } else {
            existingCat.items.push(buildItem(rawItem, catIdx, itemIdx));
            importedItemsCount++;
          }
        });
      });
    }

    cafe.has_published_menu = cafe.menu_categories.some((c) => c.items.length > 0);
    cafe.menu_status = menuStatus;
    cafe.menu_imported_at = new Date().toISOString();
    cafe.menu_imported_by = adminName;
    cafe.menu_import_source = 'Plain-English Text Paste (AI Extracted)';
    cafe.menu_items_count = cafe.menu_categories.reduce((acc, c) => acc + (c.items ? c.items.length : 0), 0);
    cafe.menu_imported_categories_count = importedCategoriesCount;
    cafe.menu_imported_items_count = importedItemsCount;
    cafe.updated_at = new Date().toISOString();
    cafe.last_modified_by = userEmail;
    cafe.last_modified_at = new Date().toISOString();

    module.exports.saveData();

    module.exports.logActivity(
      'MENU_TEXT_IMPORT',
      `Imported ${importedItemsCount} items across ${incomingCategories.length} categories for "${cafe.name}" (${mode} mode).`,
      adminName
    );

    return {
      cafe,
      totalCategories: cafe.menu_categories.length,
      totalItems: cafe.menu_categories.reduce((acc, c) => acc + (c.items ? c.items.length : 0), 0),
      importedCategoriesCount,
      importedItemsCount,
      categories: cafe.menu_categories,
    };
  },

  // Save to Disk
  saveData: () => {
    try {
      const payload = {
        reference_point: referencePoint,
        cafes: cafesData,
      };
      const json = JSON.stringify(payload, null, 2);

      // Primary source of truth
      fs.writeFileSync(dataFilePath, json, 'utf-8');

      // Also ensure backend/data/cafes.json is always synced
      const backendDataPath = path.resolve(__dirname, '../../data/cafes.json');
      if (backendDataPath !== dataFilePath) {
        fs.mkdirSync(path.dirname(backendDataPath), { recursive: true });
        fs.writeFileSync(backendDataPath, json, 'utf-8');
      }

      // Sync to Flutter assets
      const assetDataPath = path.resolve(__dirname, '../../../assets/data/cafes.json');
      fs.mkdirSync(path.dirname(assetDataPath), { recursive: true });
      fs.writeFileSync(assetDataPath, json, 'utf-8');

      // Sync to Flutter Web build if present
      const webAssetPath = path.resolve(__dirname, '../../../build/web/assets/data/cafes.json');
      if (fs.existsSync(path.dirname(webAssetPath))) {
        fs.writeFileSync(webAssetPath, json, 'utf-8');
      }
      const webNestedAssetPath = path.resolve(__dirname, '../../../build/web/assets/assets/data/cafes.json');
      if (fs.existsSync(path.dirname(webNestedAssetPath))) {
        fs.writeFileSync(webNestedAssetPath, json, 'utf-8');
      }

      console.log(`[DB] Successfully saved ${cafesData.length} cafés to disk.`);
    } catch (err) {
      console.error('[DB] Error saving dataset to disk:', err);
    }
  },

  // Favorites & Orders
  getCustomerFavorites: (customerId) => {
    const cafeIds = favorites.get(customerId) || new Set();
    return cafesData.filter((c) => cafeIds.has(c.id));
  },

  toggleFavorite: (customerId, cafeId) => {
    if (!favorites.has(customerId)) favorites.set(customerId, new Set());
    const userFavs = favorites.get(customerId);
    if (userFavs.has(cafeId)) {
      userFavs.delete(cafeId);
      return false;
    } else {
      userFavs.add(cafeId);
      return true;
    }
  },

  createOrder: (orderData) => {
    const id = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order = {
      id,
      ...orderData,
      createdAt: new Date().toISOString(),
    };
    orders.set(id, order);
    return order;
  },

  getOrdersByCustomerId: (customerId) => {
    const result = [];
    for (const o of orders.values()) {
      if (o.customerId === customerId) result.push(o);
    }
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  isSuperAdminUser,
  createAutomatedBackup,
};
