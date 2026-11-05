import 'package:flutter/material.dart';
import '../data/models/cafe_model.dart';
import '../data/models/menu_model.dart';

class CartItem {
  final MenuItemModel item;
  int quantity;

  CartItem({
    required this.item,
    this.quantity = 1,
  });

  double get subtotal => item.price * quantity;
}

class CartProvider extends ChangeNotifier {
  CafeModel? _currentCafe;
  final Map<String, CartItem> _items = {};
  String _tableNumber = '';
  String _specialNotes = '';

  CafeModel? get currentCafe => _currentCafe;
  List<CartItem> get items => _items.values.toList();
  String get tableNumber => _tableNumber;
  String get specialNotes => _specialNotes;

  int get totalItemCount =>
      _items.values.fold(0, (sum, i) => sum + i.quantity);

  double get subtotal =>
      _items.values.fold(0.0, (sum, i) => sum + i.subtotal);

  // 5% standard food GST
  double get taxes => subtotal * 0.05;

  double get grandTotal => subtotal + taxes;

  bool get isEmpty => _items.isEmpty;

  void setTableNumber(String table) {
    _tableNumber = table;
    notifyListeners();
  }

  void setSpecialNotes(String notes) {
    _specialNotes = notes;
    notifyListeners();
  }

  void addItem(CafeModel cafe, MenuItemModel item) {
    // If adding item from a different cafe, reset cart to new cafe
    if (_currentCafe != null && _currentCafe!.id != cafe.id) {
      _items.clear();
      _tableNumber = '';
    }

    _currentCafe = cafe;

    if (_items.containsKey(item.id)) {
      _items[item.id]!.quantity += 1;
    } else {
      _items[item.id] = CartItem(item: item, quantity: 1);
    }
    notifyListeners();
  }

  void removeOne(MenuItemModel item) {
    if (!_items.containsKey(item.id)) return;

    if (_items[item.id]!.quantity > 1) {
      _items[item.id]!.quantity -= 1;
    } else {
      _items.remove(item.id);
    }

    if (_items.isEmpty) {
      _currentCafe = null;
    }
    notifyListeners();
  }

  int getItemQuantity(String itemId) {
    return _items[itemId]?.quantity ?? 0;
  }

  void clearCart() {
    _items.clear();
    _currentCafe = null;
    _tableNumber = '';
    _specialNotes = '';
    notifyListeners();
  }
}

