import 'package:flutter_test/flutter_test.dart';
import 'package:zipbi_customer/data/models/cafe_model.dart';
import 'package:zipbi_customer/data/models/menu_model.dart';
import 'package:zipbi_customer/providers/cart_provider.dart';

void main() {
  group('Cart Provider Unit Tests', () {
    late CartProvider cart;
    late CafeModel dummyCafe;
    late MenuItemModel pastaItem;
    late MenuItemModel nachosItem;

    setUp(() {
      cart = CartProvider();
      dummyCafe = CafeModel(
        id: 'cafe-test',
        name: 'The German Cafe',
        slug: 'the-german-cafe',
        coverImage: 'assets/images/cafes/german_cafe.jpg',
        category: 'Café',
        cuisineTags: ['Café', 'Italian'],
        address: 'SITRA, Coimbatore',
        area: 'SITRA',
        latitude: 11.0358,
        longitude: 77.0355,
        verificationStatus: 'ACTIVE_PARTNER',
        isOrderingEnabled: true,
      );

      pastaItem = MenuItemModel(
        id: 'item-1',
        name: 'Pink Sauce Penne',
        description: 'Creamy pink sauce pasta',
        price: 180.0,
        isVeg: true,
        isAvailable: true,
      );

      nachosItem = MenuItemModel(
        id: 'item-2',
        name: 'Veg Loaded Nachos',
        description: 'Tortilla chips with toppings',
        price: 200.0,
        isVeg: true,
        isAvailable: true,
      );
    });

    test('Initial cart is empty', () {
      expect(cart.isEmpty, true);
      expect(cart.totalItemCount, 0);
      expect(cart.subtotal, 0.0);
    });

    test('Adding items updates quantities and totals correctly', () {
      cart.addItem(dummyCafe, pastaItem);
      expect(cart.totalItemCount, 1);
      expect(cart.subtotal, 180.0);

      // Add second item of same kind
      cart.addItem(dummyCafe, pastaItem);
      expect(cart.totalItemCount, 2);
      expect(cart.getItemQuantity('item-1'), 2);
      expect(cart.subtotal, 360.0);

      // Add nachos
      cart.addItem(dummyCafe, nachosItem);
      expect(cart.totalItemCount, 3);
      expect(cart.subtotal, 560.0);

      // Verify 5% GST tax and grand total
      expect(cart.taxes, 560.0 * 0.05);
      expect(cart.grandTotal, 560.0 + (560.0 * 0.05));
    });

    test('Decreasing item removes item when quantity reaches zero', () {
      cart.addItem(dummyCafe, pastaItem);
      expect(cart.getItemQuantity('item-1'), 1);

      cart.removeOne(pastaItem);
      expect(cart.getItemQuantity('item-1'), 0);
      expect(cart.isEmpty, true);
    });

    test('Setting table number and special instructions', () {
      cart.addItem(dummyCafe, pastaItem);
      cart.setTableNumber('7');
      cart.setSpecialNotes('Extra napkins please');

      expect(cart.tableNumber, '7');
      expect(cart.specialNotes, 'Extra napkins please');

      cart.clearCart();
      expect(cart.isEmpty, true);
      expect(cart.tableNumber, '');
    });
  });
}

