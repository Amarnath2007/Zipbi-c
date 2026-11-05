import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/models/order_model.dart';
import '../main_navigation_screen.dart';

class OrderTrackingScreen extends StatefulWidget {
  final OrderModel order;

  const OrderTrackingScreen({super.key, required this.order});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  late String _currentStatus;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.order.status;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
              (route) => false,
            );
          },
        ),
        title: const Text('Order Tracking', style: AppTypography.heading2),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cafe & Table Banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.order.cafeName,
                          style: AppTypography.heading2.copyWith(fontSize: 18),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Order #${widget.order.orderNumber}',
                          style: AppTypography.caption.copyWith(color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'Table ${widget.order.tableNumber}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Status Progress Steps
              const Text('Live Preparation Status', style: AppTypography.heading3),
              const SizedBox(height: 16),
              _buildStepItem(
                stepIndex: 1,
                title: 'Order Placed',
                subtitle: 'Order received by ZipBi backend',
                isCompleted: true,
                isActive: false,
              ),
              _buildStepItem(
                stepIndex: 2,
                title: 'Kitchen Accepted',
                subtitle: 'The chef has confirmed your ticket',
                isCompleted: _currentStatus != 'PENDING',
                isActive: _currentStatus == 'PENDING',
              ),
              _buildStepItem(
                stepIndex: 3,
                title: 'Preparing Food',
                subtitle: 'Freshly cooking your selected dishes',
                isCompleted: _currentStatus == 'READY' || _currentStatus == 'COMPLETED',
                isActive: _currentStatus == 'PREPARING' || _currentStatus == 'ACCEPTED',
              ),
              _buildStepItem(
                stepIndex: 4,
                title: 'Ready to Serve',
                subtitle: 'Items served to Table ${widget.order.tableNumber}',
                isCompleted: _currentStatus == 'COMPLETED',
                isActive: _currentStatus == 'READY',
                isLast: true,
              ),
              const SizedBox(height: 24),

              // Order Items Summary
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Order Details', style: AppTypography.heading3),
                    const SizedBox(height: 12),
                    ...widget.order.items.map((i) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('${i.quantity}x ${i.itemName}', style: AppTypography.bodySmall),
                              Text('₹${i.subtotal.toStringAsFixed(0)}', style: AppTypography.bodySmall),
                            ],
                          ),
                        )),
                    const Divider(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Amount Payable at Counter',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                        Text(
                          '₹${widget.order.totalAmount.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepItem({
    required int stepIndex,
    required String title,
    required String subtitle,
    required bool isCompleted,
    required bool isActive,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isCompleted
                    ? AppColors.primary
                    : isActive
                        ? AppColors.primaryLight
                        : AppColors.surfaceLight,
                shape: BoxShape.circle,
                border: Border.all(
                  color: (isCompleted || isActive) ? AppColors.primary : AppColors.border,
                  width: 2,
                ),
              ),
              child: Center(
                child: isCompleted
                    ? const Icon(Icons.check, size: 18, color: Colors.white)
                    : Text(
                        '$stepIndex',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          color: isActive ? AppColors.primary : AppColors.textMuted,
                        ),
                      ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: isCompleted ? AppColors.primary : AppColors.border,
              ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isCompleted || isActive ? AppColors.textPrimary : AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 2),
              Text(subtitle, style: AppTypography.caption),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ],
    );
  }
}

