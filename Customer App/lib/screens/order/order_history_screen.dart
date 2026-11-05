import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/models/order_model.dart';
import '../../providers/order_provider.dart';
import '../../widgets/empty_state_view.dart';
import 'order_tracking_screen.dart';

class OrderHistoryScreen extends StatelessWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final orders = orderProvider.orders;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Order History', style: AppTypography.heading2),
      ),
      body: SafeArea(
        child: orders.isEmpty
            ? const EmptyStateView(
                icon: Icons.receipt_long_rounded,
                title: 'No Orders Yet',
                message:
                    'Your past orders will appear here once you start ordering.',
              )
            : ListView.separated(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 16),
                itemCount: orders.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  return _buildOrderCard(context, orders[index]);
                },
              ),
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, OrderModel order) {
    final formattedDate =
        DateFormat('dd MMM yyyy, hh:mm a').format(order.createdAt);

    return GestureDetector(
      onTap: () {
        context.read<OrderProvider>().setActiveOrder(order);
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => OrderTrackingScreen(order: order),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: AppColors.shadow,
              blurRadius: 8,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    order.cafeName,
                    style: AppTypography.heading3,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                _buildStatusBadge(order.status),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Table ${order.tableNumber} · $formattedDate',
              style: AppTypography.caption,
            ),
            const Divider(height: 20),

            // Items Preview
            ...order.items.take(3).map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 4.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${item.quantity}x ${item.itemName}',
                        style: AppTypography.bodySmall,
                      ),
                      Text(
                        '₹${item.subtotal.toStringAsFixed(0)}',
                        style: AppTypography.bodySmall
                            .copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                )),
            if (order.items.length > 3)
              Text(
                '+ ${order.items.length - 3} more items',
                style: AppTypography.caption.copyWith(color: AppColors.primary),
              ),

            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Pay at Counter (Cash/UPI)',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  'Total: ₹${order.totalAmount.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg = AppColors.primaryLight;
    Color fg = AppColors.primary;

    if (status == 'PENDING') {
      bg = const Color(0xFFFEF3C7);
      fg = const Color(0xFFD97706);
    } else if (status == 'PREPARING') {
      bg = const Color(0xFFDBEAFE);
      fg = const Color(0xFF2563EB);
    } else if (status == 'READY') {
      bg = AppColors.openGreenLight;
      fg = AppColors.openGreen;
    } else if (status == 'COMPLETED') {
      bg = AppColors.surfaceLight;
      fg = AppColors.textSecondary;
    } else if (status == 'CANCELLED') {
      bg = AppColors.closedRedLight;
      fg = AppColors.closedRed;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}
