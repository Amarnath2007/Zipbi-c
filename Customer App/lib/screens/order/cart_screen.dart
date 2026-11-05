import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/empty_state_view.dart';
import 'order_confirmation_screen.dart';
import 'table_selection_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _notesController.text = context.read<CartProvider>().specialNotes;
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _onProceedToOrder(BuildContext context, CartProvider cart) async {
    if (cart.tableNumber.trim().isEmpty) {
      final selectedTable = await Navigator.of(context).push<String>(
        MaterialPageRoute(builder: (_) => const TableSelectionScreen()),
      );
      if (selectedTable == null || selectedTable.trim().isEmpty) {
        return;
      }
      cart.setTableNumber(selectedTable);
    }

    cart.setSpecialNotes(_notesController.text.trim());

    if (!context.mounted) return;
    final order = await context.read<OrderProvider>().placeOrder(cart: cart);

    if (order != null && context.mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => OrderConfirmationScreen(order: order),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final orderProvider = context.watch<OrderProvider>();

    if (cart.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Your Cart', style: AppTypography.heading2)),
        body: const EmptyStateView(
          icon: Icons.shopping_bag_outlined,
          title: 'Your Cart is Empty',
          message: 'Explore the verified menu and add delicious items to dine in.',
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Your Cart', style: AppTypography.heading2),
            Text(
              cart.currentCafe?.name ?? 'ZipBi Partner Café',
              style: AppTypography.caption,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => cart.clearCart(),
            child: const Text('Clear', style: TextStyle(color: AppColors.closedRed)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Table Number Card (Manual entry supported)
                    GestureDetector(
                      onTap: () async {
                        final selected = await Navigator.of(context).push<String>(
                          MaterialPageRoute(builder: (_) => const TableSelectionScreen()),
                        );
                        if (selected != null) cart.setTableNumber(selected);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryLight,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.table_restaurant_rounded,
                                      color: AppColors.primary, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Dine-In Table Number',
                                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    const SizedBox(height: 2),
                                    Text(
                                      cart.tableNumber.isNotEmpty
                                          ? 'Table ${cart.tableNumber}'
                                          : 'Tap to select or enter table',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: cart.tableNumber.isNotEmpty
                                            ? AppColors.textPrimary
                                            : AppColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Items List
                    const Text('Selected Items', style: AppTypography.heading3),
                    const SizedBox(height: 12),
                    ...cart.items.map((cartItem) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    cartItem.item.name,
                                    style: AppTypography.heading3.copyWith(fontSize: 14),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '₹${cartItem.item.price.toStringAsFixed(0)} each',
                                    style: AppTypography.caption,
                                  ),
                                ],
                              ),
                            ),
                            // Stepper
                            Container(
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppColors.surfaceLight,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove, size: 14, color: AppColors.textPrimary),
                                    padding: const EdgeInsets.symmetric(horizontal: 4),
                                    constraints: const BoxConstraints(),
                                    onPressed: () => cart.removeOne(cartItem.item),
                                  ),
                                  Text(
                                    '${cartItem.quantity}',
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add, size: 14, color: AppColors.primary),
                                    padding: const EdgeInsets.symmetric(horizontal: 4),
                                    constraints: const BoxConstraints(),
                                    onPressed: () => cart.addItem(cart.currentCafe!, cartItem.item),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            SizedBox(
                              width: 60,
                              child: Text(
                                '₹${cartItem.subtotal.toStringAsFixed(0)}',
                                textAlign: TextAlign.right,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    const Divider(height: 24),

                    // Cooking Instructions
                    CustomTextField(
                      controller: _notesController,
                      hintText: 'Special cooking requests (e.g. less spicy)...',
                      prefixIcon: Icons.edit_note_rounded,
                    ),
                    const SizedBox(height: 20),

                    // Bill Summary
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Bill Summary', style: AppTypography.heading3),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Item Total', style: AppTypography.bodySmall),
                              Text('₹${cart.subtotal.toStringAsFixed(0)}', style: AppTypography.bodySmall),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Taxes & Charges (5% GST)', style: AppTypography.bodySmall),
                              Text('₹${cart.taxes.toStringAsFixed(0)}', style: AppTypography.bodySmall),
                            ],
                          ),
                          const Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Grand Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                              Text(
                                '₹${cart.grandTotal.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Counter payment notice
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.point_of_sale_rounded, color: AppColors.primary, size: 20),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Payment is made directly at the café counter via Cash or UPI after ordering.',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: AppColors.primaryDark,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Confirm Order Button
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: CustomButton(
                text: 'Confirm & Place Table Order (₹${cart.grandTotal.toStringAsFixed(0)})',
                isLoading: orderProvider.isLoading,
                onPressed: () => _onProceedToOrder(context, cart),
                height: 52,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

