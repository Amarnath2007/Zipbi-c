class MenuItemModel {
  final String id;
  final String name;
  final String? description;
  final double price;
  final bool isVeg;
  final bool isAvailable;
  final String? source;
  final String? verifiedDate;
  final List<String> variants;

  MenuItemModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.isVeg = true,
    this.isAvailable = true,
    this.source,
    this.verifiedDate,
    this.variants = const [],
  });

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    final rawVariants = (json['variants'] as List<dynamic>?) ?? [];
    return MenuItemModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      isVeg: json['is_veg'] == true || json['isVeg'] == true,
      isAvailable: json['is_available'] != false && json['isAvailable'] != false,
      source: json['source']?.toString(),
      verifiedDate: json['verified_date']?.toString() ?? json['verifiedDate']?.toString(),
      variants: rawVariants.map((v) => v.toString()).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'is_veg': isVeg,
      'is_available': isAvailable,
      'source': source,
      'verified_date': verifiedDate,
      'variants': variants,
    };
  }
}

class MenuCategoryModel {
  final String name;
  final List<MenuItemModel> items;

  MenuCategoryModel({
    required this.name,
    required this.items,
  });

  int get itemCount => items.length;

  factory MenuCategoryModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return MenuCategoryModel(
      name: json['name']?.toString() ?? '',
      items: rawItems
          .map((i) => MenuItemModel.fromJson(i as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'items': items.map((i) => i.toJson()).toList(),
    };
  }
}
