import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

enum ToastType { info, success, error }

class AppToast {
  static void show(
    BuildContext context,
    String message, {
    ToastType type = ToastType.info,
    Duration duration = const Duration(milliseconds: 2400),
  }) {
    ScaffoldMessenger.of(context).removeCurrentSnackBar();

    Color bgColor = AppColors.textPrimary;
    IconData icon = Icons.info_outline_rounded;

    if (type == ToastType.success) {
      bgColor = AppColors.primary;
      icon = Icons.check_circle_outline_rounded;
    } else if (type == ToastType.error) {
      bgColor = Colors.red.shade700;
      icon = Icons.error_outline_rounded;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                message,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        behavior: SnackBarBehavior.floating,
        backgroundColor: bgColor,
        elevation: 6,
        // Floats safely above the bottom navigation bar (height ~60)
        margin: const EdgeInsets.only(bottom: 80, left: 24, right: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: duration,
      ),
    );
  }

  static void info(BuildContext context, String message) =>
      show(context, message, type: ToastType.info);

  static void success(BuildContext context, String message) =>
      show(context, message, type: ToastType.success);

  static void error(BuildContext context, String message) =>
      show(context, message, type: ToastType.error);
}

