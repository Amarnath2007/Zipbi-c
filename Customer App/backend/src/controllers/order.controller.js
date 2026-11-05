const db = require('../db');

/**
 * Place a new table order for dine-in
 */
async function createOrder(req, res, next) {
  try {
    const { cafeId, tableNumber, items, specialNotes, paymentMethod } = req.body;

    if (!cafeId) {
      return res.status(400).json({
        success: false,
        message: 'Café ID is required.',
      });
    }

    if (!tableNumber || String(tableNumber).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Table number is required for dine-in ordering.',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one menu item.',
      });
    }

    const cafe = db.getCafeById(cafeId);
    if (!cafe) {
      return res.status(404).json({
        success: false,
        message: `Café with id '${cafeId}' not found.`,
      });
    }

    // STRICT BUSINESS RULE:
    // Only Active Partner cafés with ordering enabled may accept customer orders
    if (!cafe.is_ordering_enabled || cafe.verification_status !== 'ACTIVE_PARTNER') {
      return res.status(403).json({
        success: false,
        message: `Online ordering is currently unavailable for ${cafe.name}. This café is not an active ZipBi ordering partner.`,
      });
    }

    // Validate items and calculate total amount
    let totalAmount = 0;
    const validatedItems = [];

    // Flatten all items across all categories for this cafe
    const availableMenuItems = new Map();
    if (cafe.menu_categories) {
      for (const cat of cafe.menu_categories) {
        for (const item of cat.items) {
          availableMenuItems.set(item.id, item);
        }
      }
    }

    for (const orderItem of items) {
      const menuItem = availableMenuItems.get(orderItem.menuItemId);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item with id '${orderItem.menuItemId}' does not exist at this café.`,
        });
      }

      if (!menuItem.is_available) {
        return res.status(400).json({
          success: false,
          message: `Item '${menuItem.name}' is currently unavailable.`,
        });
      }

      const qty = parseInt(orderItem.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for item '${menuItem.name}'.`,
        });
      }

      const itemSubtotal = menuItem.price * qty;
      totalAmount += itemSubtotal;

      validatedItems.push({
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        pricePerUnit: menuItem.price,
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    const order = db.createOrder({
      customerId: req.user.id,
      cafeId: cafe.id,
      cafeName: cafe.name,
      tableNumber: String(tableNumber).trim(),
      items: validatedItems,
      totalAmount,
      paymentMethod: paymentMethod || 'CASH_OR_UPI_AT_COUNTER',
      specialNotes: specialNotes ? specialNotes.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! Please pay at the counter via cash or UPI.',
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get customer's order history
 */
async function getMyOrders(req, res, next) {
  try {
    const orders = db.getCustomerOrders(req.user.id);
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get details & tracking of a specific order
 */
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const order = db.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order '${id}' not found.`,
      });
    }

    // Security check: Customer can only view their own orders
    if (order.customerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You may only view your own orders.',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Simulate merchant order status update (for testing order tracking)
 */
async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = db.updateOrderStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Order '${id}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updated,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateStatus,
};

