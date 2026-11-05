import 'package:flutter/material.dart';

class CategoryImagePlaceholder extends StatelessWidget {
  final String category;
  final double? width;
  final double? height;
  final double iconSize;

  const CategoryImagePlaceholder({
    super.key,
    required this.category,
    this.width,
    this.height,
    this.iconSize = 36,
  });

  @override
  Widget build(BuildContext context) {
    final cat = category.toLowerCase().replaceAll('é', 'e');

    LinearGradient gradient;
    IconData icon;
    String label;

    if (cat.contains('tea')) {
      gradient = const LinearGradient(
        colors: [Color(0xFF065F46), Color(0xFF047857), Color(0xFF10B981)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      icon = Icons.emoji_food_beverage_rounded;
      label = 'Tea & Beverages';
    } else if (cat.contains('baker') || cat.contains('cake') || cat.contains('dessert')) {
      gradient = const LinearGradient(
        colors: [Color(0xFF831843), Color(0xFF9D174D), Color(0xFFBE185D)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      icon = Icons.cake_rounded;
      label = 'Bakery & Sweets';
    } else if (cat.contains('restaur')) {
      gradient = const LinearGradient(
        colors: [Color(0xFF1E293B), Color(0xFF334155), Color(0xFF475569)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      icon = Icons.restaurant_rounded;
      label = 'Restaurant & Dining';
    } else if (cat.contains('juice') || cat.contains('beverag')) {
      gradient = const LinearGradient(
        colors: [Color(0xFF064E3B), Color(0xFF0F766E), Color(0xFF0D9488)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      icon = Icons.local_bar_rounded;
      label = 'Fresh Beverages';
    } else {
      // Default: Café / Coffee
      gradient = const LinearGradient(
        colors: [Color(0xFF1C1917), Color(0xFF292524), Color(0xFF44403C)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      icon = Icons.coffee_rounded;
      label = 'Café & Bites';
    }

    return Container(
      width: width ?? double.infinity,
      height: height ?? double.infinity,
      decoration: BoxDecoration(gradient: gradient),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: iconSize, color: Colors.white.withValues(alpha: 0.85)),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: iconSize * 0.32,
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.8),
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

