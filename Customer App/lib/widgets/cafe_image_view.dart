import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../core/constants/app_constants.dart';
import 'category_image_placeholder.dart';

class CafeImageView extends StatelessWidget {
  final String? imagePath;
  final String category;
  final double? width;
  final double? height;
  final BoxFit fit;

  const CafeImageView({
    super.key,
    required this.imagePath,
    required this.category,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    final cleanPath = imagePath?.trim();

    if (cleanPath == null || cleanPath.isEmpty) {
      return CategoryImagePlaceholder(
        category: category,
        width: width,
        height: height,
      );
    }

    // 1. Full HTTP/HTTPS Network URL
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return SizedBox(
        width: width,
        height: height,
        child: Image.network(
          cleanPath,
          fit: fit,
          errorBuilder: (context, error, stackTrace) {
            return CategoryImagePlaceholder(
              category: category,
              width: width,
              height: height,
            );
          },
        ),
      );
    }

    // 2. Uploaded image path (/uploads/...)
    if (cleanPath.startsWith('/uploads/') || cleanPath.startsWith('uploads/')) {
      final subPath = cleanPath.startsWith('/') ? cleanPath : '/$cleanPath';
      final networkUrl = '${AppConstants.apiBaseUrl.replaceAll('/api/v1', '')}$subPath';

      return SizedBox(
        width: width,
        height: height,
        child: Image.network(
          networkUrl,
          fit: fit,
          errorBuilder: (context, error, stackTrace) {
            return CategoryImagePlaceholder(
              category: category,
              width: width,
              height: height,
            );
          },
        ),
      );
    }

    // 3. Bundled Asset Image
    String assetPath = cleanPath;
    if (assetPath.startsWith('/')) {
      assetPath = assetPath.substring(1);
    }
    if (!assetPath.startsWith('assets/')) {
      assetPath = 'assets/$assetPath';
    }

    return SizedBox(
      width: width,
      height: height,
      child: Image.asset(
        assetPath,
        fit: fit,
        errorBuilder: (context, error, stackTrace) {
          final fallbackNetworkUrl = '/$assetPath';
          return Image.network(
            fallbackNetworkUrl,
            fit: fit,
            errorBuilder: (context, error, stackTrace) => CategoryImagePlaceholder(
              category: category,
              width: width,
              height: height,
            ),
          );
        },
      ),
    );
  }
}

