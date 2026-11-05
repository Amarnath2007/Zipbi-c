class OrderItemModel {
  final String menuItemId;
  final String itemName;
  final double pricePerUnit;
  final int quantity;
  final double subtotal;

  OrderItemModel({
    required this.menuItemId,
    required this.itemName,
    required this.pricePerUnit,
    required this.quantity,
    required this.subtotal,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      menuItemId: json['menuItemId']?.toString() ?? json['menu_item_id']?.toString() ?? '',
      itemName: json['itemName']?.toString() ?? json['item_name']?.toString() ?? '',
      pricePerUnit: (json['pricePerUnit'] ?? json['price_per_unit'] as num?)?.toDouble() ?? 0.0,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'menuItemId': menuItemId,
      'itemName': itemName,
      'pricePerUnit': pricePerUnit,
      'quantity': quantity,
      'subtotal': subtotal,
    };
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String customerId;
  final String cafeId;
  final String cafeName;
  final String tableNumber;
  final String status; // PENDING, ACCEPTED, PREPARING, READY, COMPLETED, CANCELLED
  final List<OrderItemModel> items;
  final double totalAmount;
  final String paymentMethod;
  final String paymentStatus;
  final String? specialNotes;
  final DateTime createdAt;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    required this.cafeId,
    required this.cafeName,
    required this.tableNumber,
    required this.status,
    required this.items,
    required this.totalAmount,
    this.paymentMethod = 'CASH_OR_UPI_AT_COUNTER',
    this.paymentStatus = 'PENDING',
    this.specialNotes,
    required this.createdAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final rawItems = (json['items'] as List<dynamic>? ?? []);
    return OrderModel(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? json['order_number']?.toString() ?? 'ZPB-ORD',
      customerId: json['customerId']?.toString() ?? json['customer_id']?.toString() ?? '',
      cafeId: json['cafeId']?.toString() ?? json['cafe_id']?.toString() ?? '',
      cafeName: json['cafeName']?.toString() ?? json['cafe_name']?.toString() ?? 'ZipBi Café',
      tableNumber: json['tableNumber']?.toString() ?? json['table_number']?.toString() ?? '1',
      status: json['status']?.toString() ?? 'PENDING',
      items: rawItems.map((i) => OrderItemModel.fromJson(i as Map<String, dynamic>)).toList(),
      totalAmount: (json['totalAmount'] ?? json['total_amount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['paymentMethod']?.toString() ?? json['payment_method']?.toString() ?? 'CASH_OR_UPI_AT_COUNTER',
      paymentStatus: json['paymentStatus']?.toString() ?? json['payment_status']?.toString() ?? 'PENDING',
      specialNotes: json['specialNotes']?.toString() ?? json['special_notes']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

