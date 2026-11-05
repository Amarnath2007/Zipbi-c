import 'package:flutter/material.dart';
import '../data/models/order_model.dart';
import '../data/services/api_service.dart';
import 'cart_provider.dart';

class OrderProvider extends ChangeNotifier {
  final List<OrderModel> _orders = [];
  bool _isLoading = false;
  String? _errorMessage;
  OrderModel? _activeOrder;

  List<OrderModel> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  OrderModel? get activeOrder => _activeOrder;

  Future<OrderModel?> placeOrder({
    required CartProvider cart,
  }) async {
    if (cart.currentCafe == null || cart.isEmpty) {
      _errorMessage = 'Cart is empty.';
      notifyListeners();
      return null;
    }

    if (cart.tableNumber.trim().isEmpty) {
      _errorMessage = 'Please enter your table number.';
      notifyListeners();
      return null;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final itemsPayload = cart.items
          .map((i) => {
                'menuItemId': i.item.id,
                'quantity': i.quantity,
              })
          .toList();

      final order = await ApiService.placeOrder(
        cafeId: cart.currentCafe!.id,
        tableNumber: cart.tableNumber,
        items: itemsPayload,
        specialNotes: cart.specialNotes,
      );

      _activeOrder = order;
      _orders.insert(0, order);
      cart.clearCart();

      _isLoading = false;
      notifyListeners();
      return order;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return null;
    }
  }

  void setActiveOrder(OrderModel order) {
    _activeOrder = order;
    notifyListeners();
  }
}
