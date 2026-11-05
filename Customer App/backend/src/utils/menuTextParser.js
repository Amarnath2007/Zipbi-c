/**
 * ZipBi Standard Menu Plain-English Text Parser
 * Validates and parses human-readable, plain-English structured menus.
 * Format:
 *   CAFE NAME: The German Cafe
 *
 *   CATEGORY: Pasta
 *   Pink Sauce Penne | Price: ₹180 | Description: Creamy pink sauce pasta | Type: Vegetarian
 */

const SAMPLE_MENU_TEXT = `CAFE NAME: The German Cafe

CATEGORY: Pasta
Pink Sauce Penne | Price: ₹180 | Description: Creamy pink sauce pasta | Type: Vegetarian
White Sauce Pasta | Price: ₹170 | Description: Not provided | Type: Unknown
Arrabbiata Pasta | Price: ₹160 | Description: Spicy tomato sauce pasta | Type: Vegetarian

CATEGORY: Snacks
Crispy Corn | Price: ₹120 | Description: Crispy fried corn | Type: Vegetarian
Veg Cheese Nachos | Price: ₹130 | Description: Not provided | Type: Vegetarian

CATEGORY: Beverages
Cold Coffee | Price: ₹100 | Description: Not provided | Type: Unknown`;

const AI_EXTRACTION_PROMPT = `Read the attached café menu photograph or PDF and extract every readable menu category and item.

Return the complete menu using this exact plain-English format:

CAFE NAME: [Café Name]

CATEGORY: [Category Name]
[Item Name] | Price: ₹[Price] | Description: [Description] | Type: [Vegetarian / Non-Vegetarian / Unknown]

CATEGORY: [Next Category]
[Item Name] | Price: ₹[Price] | Description: [Description] | Type: [Vegetarian / Non-Vegetarian / Unknown]

IMPORTANT:

1. Extract only information present in the menu.
2. Do not invent items or prices.
3. Use Price: Not listed when a price is missing or unreadable.
4. Use Description: Not provided when no description exists.
5. Use Type: Unknown when food type cannot be identified.
6. Include every readable item.
7. Preserve the original item names.
8. Organise items under their correct categories.
9. Return only the formatted menu, without JSON or additional explanations.`;

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
 * Parses and validates plain-English structured menu text
 * @param {string} rawText - Multi-line plain English menu text
 * @param {string} [targetCafeName] - Expected cafe name
 */
function parseMenuText(rawText, targetCafeName = '') {
  const errors = [];
  const warnings = [];

  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      valid: false,
      errors: ['Menu text is empty. Please paste your complete menu in the plain-English format.'],
      warnings: [],
      nameMismatch: false,
      pastedCafeName: null,
      categoriesCount: 0,
      itemsCount: 0,
      summary: { totalCategories: 0, totalItems: 0, totalPricedItems: 0, totalUnpricedItems: 0 },
      sanitizedMenu: null,
    };
  }

  const lines = rawText.split(/\r?\n/);
  let pastedCafeName = null;
  const categories = [];
  let currentCategory = null;
  const categoryNamesSet = new Set();
  const itemNamesMap = new Map();

  let totalItemsCount = 0;
  let totalPricedItems = 0;
  let totalUnpricedItems = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();

    // 1. Skip blank lines
    if (line === '') continue;

    // 2. Check for CAFE NAME:
    const cafeMatch = line.match(/^CAFE\s*NAME\s*:\s*(.*)$/i);
    if (cafeMatch) {
      const cName = cafeMatch[1].trim();
      if (!cName) {
        errors.push(`Line ${lineNumber}: "CAFE NAME:" line is missing the café name.`);
      } else {
        pastedCafeName = cName;
      }
      continue;
    }

    // 3. Check for CATEGORY:
    const catMatch = line.match(/^CATEGORY\s*:\s*(.*)$/i);
    if (catMatch) {
      const catName = catMatch[1].trim();
      if (!catName) {
        errors.push(`Line ${lineNumber}: "CATEGORY:" line is missing a category name.`);
        continue;
      }
      const catKey = catName.toLowerCase();
      if (categoryNamesSet.has(catKey)) {
        errors.push(`Line ${lineNumber}: Duplicate category name "${catName}" detected.`);
      } else {
        categoryNamesSet.add(catKey);
      }
      currentCategory = {
        name: catName,
        items: [],
      };
      categories.push(currentCategory);
      itemNamesMap.set(currentCategory, new Set());
      continue;
    }

    // 4. If neither CAFE NAME nor CATEGORY, it must be an item line
    if (!currentCategory) {
      errors.push(`Line ${lineNumber}: Menu item found before any "CATEGORY:" header. Please specify a category first (e.g. "CATEGORY: Pasta").`);
      continue;
    }

    // Parse item fields separated by '|'
    const rawParts = line.split('|').map((p) => p.trim()).filter((p) => p.length > 0);
    if (rawParts.length === 0) {
      errors.push(`Line ${lineNumber}: Empty item entry.`);
      continue;
    }

    // The first part is the item name
    const itemName = rawParts[0].replace(/^(?:Item\s*Name|Item)\s*:\s*/i, '').trim();
    if (!itemName) {
      errors.push(`Line ${lineNumber}: Item name is required. Format: Item Name | Price: ₹180 | Description: ... | Type: Vegetarian`);
      continue;
    }

    // Check duplicate item name within the current category
    const itemSet = itemNamesMap.get(currentCategory);
    const itemKey = itemName.toLowerCase();
    if (itemSet && itemSet.has(itemKey)) {
      errors.push(`Line ${lineNumber}: Duplicate item name "${itemName}" detected inside category "${currentCategory.name}".`);
    } else if (itemSet) {
      itemSet.add(itemKey);
    }

    let price = null;
    let description = null;
    let foodType = 'unknown';
    let hasPrice = false;

    // Parse remaining field parts
    const remainingParts = rawParts.slice(1);
    for (const part of remainingParts) {
      // Check Price field
      const priceMatch = part.match(/^(?:Price|₹)\s*:\s*(.*)$/i) || part.match(/^(₹\s*[0-9]+(?:\.[0-9]+)?)$/i);
      if (priceMatch) {
        hasPrice = true;
        const valStr = priceMatch[1] ? priceMatch[1].trim() : part.trim();
        if (/^(?:not\s*listed|not\s*provided|none|unlisted|n\/?a|-|null)$/i.test(valStr)) {
          price = null;
          totalUnpricedItems++;
        } else {
          const cleanNum = valStr.replace(/₹/g, '').replace(/,/g, '').trim();
          const num = parseFloat(cleanNum);
          if (isNaN(num) || num < 0) {
            errors.push(`Line ${lineNumber}: Invalid price "${valStr}" for item "${itemName}". Price must be a non-negative number (e.g. ₹180) or "Price: Not listed".`);
          } else {
            price = Math.round(num);
            totalPricedItems++;
          }
        }
        continue;
      }

      // Check Description field
      const descMatch = part.match(/^Description\s*:\s*(.*)$/i);
      if (descMatch) {
        const dStr = descMatch[1].trim();
        if (/^(?:not\s*provided|not\s*listed|none|n\/?a|-|null)$/i.test(dStr) || dStr === '') {
          description = null;
        } else {
          description = dStr;
        }
        continue;
      }

      // Check Type field
      const typeMatch = part.match(/^(?:Type|Food\s*Type)\s*:\s*(.*)$/i);
      if (typeMatch) {
        foodType = normalizeFoodType(typeMatch[1]);
        continue;
      }

      // Heuristic fallback for unlabelled tokens:
      // If it looks like standalone "Vegetarian" or "Non-Vegetarian"
      if (/^(?:vegetarian|non[-_\s]?vegetarian|egg|vegan|unknown)$/i.test(part)) {
        foodType = normalizeFoodType(part);
        continue;
      }

      // If it looks like standalone price e.g. "180" or "₹180"
      if (/^₹?\s*[0-9]+(?:\.[0-9]+)?$/.test(part)) {
        hasPrice = true;
        const num = parseFloat(part.replace(/₹/g, '').trim());
        if (!isNaN(num) && num >= 0) {
          price = Math.round(num);
          totalPricedItems++;
          continue;
        }
      }

      // If unrecognized, record actionable error
      errors.push(`Line ${lineNumber}: Unrecognized field "${part}" for item "${itemName}". Please use standard labels (e.g. "Price: ₹180", "Description: ...", "Type: Vegetarian").`);
    }

    if (!hasPrice) {
      totalUnpricedItems++;
    }

    const isVeg = (foodType === 'vegetarian' || foodType === 'vegan');

    currentCategory.items.push({
      name: itemName,
      description,
      price,
      food_type: foodType,
      is_veg: isVeg,
    });
    totalItemsCount++;
  }

  // 5. Post-validation checks
  if (categories.length === 0 && errors.length === 0) {
    errors.push('No categories found. Please specify at least one category using "CATEGORY: Category Name".');
  }

  // Warnings for empty categories
  categories.forEach((cat) => {
    if (cat.items.length === 0) {
      warnings.push(`Category "${cat.name}" has no items listed.`);
    }
  });

  // Café name mismatch check
  let nameMismatch = false;
  if (targetCafeName && targetCafeName.trim()) {
    if (pastedCafeName) {
      const normTarget = normalizeString(targetCafeName);
      const normPasted = normalizeString(pastedCafeName);
      if (normTarget !== normPasted && !normTarget.includes(normPasted) && !normPasted.includes(normTarget)) {
        nameMismatch = true;
        warnings.push(`Pasted menu specifies "${pastedCafeName}", but currently selected café is "${targetCafeName}". Please confirm before importing.`);
      }
    } else {
      warnings.push(`No "CAFE NAME:" line specified in pasted menu. It will be assigned to currently selected café "${targetCafeName}".`);
    }
  }

  const isValid = errors.length === 0;

  return {
    valid: isValid,
    errors,
    warnings,
    nameMismatch,
    pastedCafeName,
    categoriesCount: categories.length,
    itemsCount: totalItemsCount,
    summary: {
      totalCategories: categories.length,
      totalItems: totalItemsCount,
      totalPricedItems,
      totalUnpricedItems,
    },
    sanitizedMenu: isValid
      ? {
          cafe_name: pastedCafeName || targetCafeName || '',
          currency: 'INR',
          categories,
        }
      : null,
  };
}

module.exports = {
  SAMPLE_MENU_TEXT,
  AI_EXTRACTION_PROMPT,
  parseMenuText,
  normalizeFoodType,
};

