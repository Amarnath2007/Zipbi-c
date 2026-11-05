/**
 * ZipBi Standard Menu JSON Validator
 * Validates external AI-extracted structured menu JSON against ZipBi specifications.
 */

function normalizeString(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeFoodType(type) {
  if (!type) return 'unknown';
  const clean = type.toString().toLowerCase().trim().replace(/[-_\s]/g, '');
  if (clean === 'veg' || clean === 'vegetarian') return 'vegetarian';
  if (clean === 'nonveg' || clean === 'nonvegetarian') return 'non_vegetarian';
  if (clean === 'egg') return 'egg';
  if (clean === 'vegan') return 'vegan';
  return 'unknown';
}

/**
 * Validates raw JSON string or parsed object against ZipBi menu schema
 * @param {string|object} input - Raw JSON string or parsed JavaScript object
 * @param {string} [targetCafeName] - Expected name of currently selected cafe
 */
function validateMenuJson(input, targetCafeName = '') {
  const errors = [];
  const warnings = [];
  let parsed = null;

  // 1. JSON Parsing
  if (typeof input === 'string') {
    if (!input.trim()) {
      return {
        valid: false,
        errors: ['JSON input is empty. Please paste your structured menu JSON.'],
        warnings: [],
        nameMismatch: false,
        pastedCafeName: null,
        categoriesCount: 0,
        itemsCount: 0,
        summary: { totalCategories: 0, totalItems: 0 },
        sanitizedMenu: null,
      };
    }
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      return {
        valid: false,
        errors: [`Invalid JSON syntax: ${err.message}. Please check brackets and quotes.`],
        warnings: [],
        nameMismatch: false,
        pastedCafeName: null,
        categoriesCount: 0,
        itemsCount: 0,
        summary: { totalCategories: 0, totalItems: 0 },
        sanitizedMenu: null,
      };
    }
  } else if (typeof input === 'object' && input !== null) {
    parsed = input;
  } else {
    return {
      valid: false,
      errors: ['Input must be a valid JSON string or object.'],
      warnings: [],
      nameMismatch: false,
      pastedCafeName: null,
      categoriesCount: 0,
      itemsCount: 0,
      summary: { totalCategories: 0, totalItems: 0 },
      sanitizedMenu: null,
    };
  }

  // 2. Root Structure Validation
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      errors: ['Menu data must be a JSON object containing a "categories" list.'],
      warnings: [],
      nameMismatch: false,
      pastedCafeName: null,
      categoriesCount: 0,
      itemsCount: 0,
      summary: { totalCategories: 0, totalItems: 0 },
      sanitizedMenu: null,
    };
  }

  const pastedCafeName = (parsed.cafe_name || parsed.cafeName || '').toString().trim() || null;
  let nameMismatch = false;

  // 3. Café Name Match Check
  if (targetCafeName && targetCafeName.trim()) {
    if (pastedCafeName) {
      const normTarget = normalizeString(targetCafeName);
      const normPasted = normalizeString(pastedCafeName);
      if (normTarget !== normPasted && !normTarget.includes(normPasted) && !normPasted.includes(normTarget)) {
        nameMismatch = true;
        warnings.push(`Pasted menu specifies "${pastedCafeName}", but currently selected café is "${targetCafeName}". Please confirm before importing.`);
      }
    } else {
      warnings.push(`No "cafe_name" specified in pasted JSON. It will be assigned to currently selected café "${targetCafeName}".`);
    }
  }

  // 4. Categories Array Validation
  const rawCategories = parsed.categories || parsed.menu_categories || parsed.menuCategories;
  if (!Array.isArray(rawCategories)) {
    errors.push('The "categories" array is required.');
    return {
      valid: false,
      errors,
      warnings,
      nameMismatch,
      pastedCafeName,
      categoriesCount: 0,
      itemsCount: 0,
      summary: { totalCategories: 0, totalItems: 0 },
      sanitizedMenu: null,
    };
  }

  if (rawCategories.length === 0) {
    errors.push('At least one category is required in the "categories" array.');
  }

  const sanitizedCategories = [];
  const categoryNamesSet = new Set();
  let totalItemsCount = 0;
  let totalPricedItems = 0;
  let totalUnpricedItems = 0;

  // 5. Category and Item Iteration
  rawCategories.forEach((rawCat, catIndex) => {
    const catNumber = catIndex + 1;
    if (!rawCat || typeof rawCat !== 'object' || Array.isArray(rawCat)) {
      errors.push(`Category #${catNumber} is not a valid JSON object.`);
      return;
    }

    const catName = (rawCat.name || rawCat.category_name || rawCat.category || '').toString().trim();
    if (!catName) {
      errors.push(`Category #${catNumber} name is required.`);
      return;
    }

    const catKey = catName.toLowerCase();
    if (categoryNamesSet.has(catKey)) {
      errors.push(`Duplicate category name detected: "${catName}".`);
    } else {
      categoryNamesSet.add(catKey);
    }

    const rawItems = rawCat.items || rawCat.menu_items || rawCat.menuItems || [];
    if (!Array.isArray(rawItems)) {
      errors.push(`Category "${catName}" has an invalid "items" list (must be an array).`);
      return;
    }

    const sanitizedItems = [];
    const itemNamesSet = new Set();

    rawItems.forEach((rawItem, itemIndex) => {
      const itemNumber = itemIndex + 1;
      if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
        errors.push(`Category "${catName}" -> Item #${itemNumber} is not a valid JSON object.`);
        return;
      }

      const itemName = (rawItem.name || rawItem.item_name || '').toString().trim();
      if (!itemName) {
        errors.push(`Item name is required for item #${itemNumber} in category "${catName}".`);
        return;
      }

      const itemKey = itemName.toLowerCase();
      if (itemNamesSet.has(itemKey)) {
        errors.push(`Duplicate item name "${itemName}" detected inside category "${catName}".`);
      } else {
        itemNamesSet.add(itemKey);
      }

      // Price Validation
      let price = null;
      if (rawItem.price !== undefined && rawItem.price !== null && rawItem.price !== '') {
        const numPrice = typeof rawItem.price === 'number' ? rawItem.price : parseFloat(rawItem.price.toString().replace(/[^0-9.]/g, ''));
        if (isNaN(numPrice) || numPrice < 0) {
          errors.push(`Price cannot be negative or invalid for item "${itemName}" in category "${catName}".`);
        } else {
          price = Math.round(numPrice); // Integer INR
          totalPricedItems++;
        }
      } else {
        totalUnpricedItems++;
      }

      const description = rawItem.description ? rawItem.description.toString().trim() : null;
      const foodType = normalizeFoodType(rawItem.food_type || rawItem.foodType);

      sanitizedItems.push({
        name: itemName,
        description: description || null,
        price,
        food_type: foodType,
        is_veg: foodType === 'vegetarian' || foodType === 'vegan',
      });
      totalItemsCount++;
    });

    sanitizedCategories.push({
      name: catName,
      items: sanitizedItems,
    });
  });

  const isValid = errors.length === 0;

  return {
    valid: isValid,
    errors,
    warnings,
    nameMismatch,
    pastedCafeName,
    categoriesCount: sanitizedCategories.length,
    itemsCount: totalItemsCount,
    summary: {
      totalCategories: sanitizedCategories.length,
      totalItems: totalItemsCount,
      totalPricedItems,
      totalUnpricedItems,
    },
    sanitizedMenu: isValid
      ? {
          cafe_name: pastedCafeName || targetCafeName || '',
          currency: (parsed.currency || 'INR').toUpperCase(),
          categories: sanitizedCategories,
        }
      : null,
  };
}

const SAMPLE_MENU_JSON = {
  cafe_name: 'The German Cafe',
  currency: 'INR',
  categories: [
    {
      name: 'Pasta',
      items: [
        {
          name: 'Pink Sauce Penne',
          description: 'Creamy pink sauce pasta',
          price: 180,
          food_type: 'unknown',
        },
        {
          name: 'White Sauce Pasta',
          description: null,
          price: 170,
          food_type: 'unknown',
        },
      ],
    },
    {
      name: 'Snacks',
      items: [
        {
          name: 'Crispy Corn',
          description: null,
          price: 120,
          food_type: 'vegetarian',
        },
      ],
    },
  ],
};

module.exports = {
  validateMenuJson,
  normalizeFoodType,
  SAMPLE_MENU_JSON,
};
