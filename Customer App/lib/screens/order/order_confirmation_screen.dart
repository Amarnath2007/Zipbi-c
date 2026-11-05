import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/models/order_model.dart';
import '../../widgets/custom_button.dart';
import '../main_navigation_screen.dart';
import 'order_tracking_screen.dart';

class OrderConfirmationScreen extends StatelessWidget {
  final OrderModel order;

  const OrderConfirmationScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),

              // Green Check Circle
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  size: 64,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'Order Placed!',
                style: AppTypography.heading1,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              Text(
                'Your order #${order.orderNumber} is sent to the ${order.cafeName} kitchen for Table ${order.tableNumber}.',
                style: AppTypography.subtitle,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // Summary Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Amount', style: AppTypography.bodySmall),
                        Text(
                          '₹${order.totalAmount.toStringAsFixed(0)}',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Payment Method', style: AppTypography.bodySmall),
                        Text('Counter (Cash/UPI)', style: AppTypography.bodySmall),
                      ],
                    ),
                  ],
                ),
              ),

              const Spacer(),

              CustomButton(
                text: 'Track Order Status',
                onPressed: () {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) => OrderTrackingScreen(order: order),
                    ),
                  );
                },
                height: 52,
              ),
              const SizedBox(height: 12),

              TextButton(
                onPressed: () {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
                    (route) => false,
                  );
                },
                child: const Text(
                  'Back to Home',
                  style: TextStyle(
                    fontSize: 15,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

