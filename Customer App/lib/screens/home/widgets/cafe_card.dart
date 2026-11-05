import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haversine.dart';
import '../../../data/models/cafe_model.dart';
import '../../../providers/cafe_provider.dart';
import '../../../widgets/cafe_image_view.dart';
import '../../cafe_details/cafe_details_screen.dart';

enum CafeCardStyle {
  featured, // Big horizontal card
  compact,  // Two-column or horizontal scroll card
  listTile, // Explore / Nearby list view
}

class CafeCard extends StatelessWidget {
  final CafeModel cafe;
  final CafeCardStyle style;

  const CafeCard({
    super.key,
    required this.cafe,
    this.style = CafeCardStyle.featured,
  });

  @override
  Widget build(BuildContext context) {
    if (style == CafeCardStyle.listTile) {
      return _buildListTile(context);
    } else if (style == CafeCardStyle.compact) {
      return _buildCompact(context);
    }
    return _buildFeatured(context);
  }

  // 1. Featured Big Card
  Widget _buildFeatured(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => CafeDetailsScreen(cafe: cafe),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: AppColors.shadow,
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover Image with Distance Badge and Heart Overlay
            Stack(
              children: [
                SizedBox(
                  height: 160,
                  width: double.infinity,
                  child: CafeImageView(
                    imagePath: cafe.coverImage,
                    category: cafe.category,
                    width: double.infinity,
                    height: 160,
                  ),
                ),

                // Distance Badge Overlay
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.near_me_rounded, size: 11, color: Colors.white),
                        const SizedBox(width: 4),
                        Text(
                          Haversine.formatDistance(cafe.effectiveDistanceKm),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Favorite Heart Button
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: () {
                      context.read<CafeProvider>().toggleFavorite(cafe);
                    },
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        cafe.isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        color: cafe.isFavorite ? AppColors.heartRed : AppColors.textPrimary,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Clean, Professional Information (Name, Rating, Categories, Hours)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          cafe.name,
                          style: AppTypography.heading3,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (cafe.rating != null) ...[
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, size: 16, color: AppColors.star),
                            const SizedBox(width: 2),
                            Text(
                              cafe.rating!.toStringAsFixed(1),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            if (cafe.reviewCount != null)
                              Text(
                                ' (${cafe.reviewCount}+)',
                                style: AppTypography.caption,
                              ),
                          ],
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),

                  // Cuisine Tags
                  Text(
                    cafe.cuisineTags.join(' · '),
                    style: AppTypography.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),

                  // Opening Status
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.openGreenLight,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Open',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.openGreen,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      if (cafe.openingHours != null)
                        Expanded(
                          child: Text(
                            cafe.openingHours!,
                            style: AppTypography.caption,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
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
    );
  }

  // 2. Compact Grid Card (for Popular Nearby)
  Widget _buildCompact(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => CafeDetailsScreen(cafe: cafe),
          ),
        );
      },
      child: Container(
        width: 160,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: AppColors.shadow,
              blurRadius: 8,
              offset: Offset(0, 3),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                SizedBox(
                  height: 105,
                  width: double.infinity,
                  child: CafeImageView(
                    imagePath: cafe.coverImage,
                    category: cafe.category,
                    width: double.infinity,
                    height: 105,
                  ),
                ),
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      Haversine.formatDistance(cafe.effectiveDistanceKm),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    cafe.name,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  if (cafe.rating != null) ...[
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, size: 13, color: AppColors.star),
                        const SizedBox(width: 2),
                        Text(
                          '${cafe.rating!.toStringAsFixed(1)}${cafe.reviewCount != null ? " (${cafe.reviewCount}+)" : ""}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    Text(
                      cafe.displayCategory,
                      style: AppTypography.caption,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 3. List Tile Card (for Cafes Near You screen)
  Widget _buildListTile(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => CafeDetailsScreen(cafe: cafe),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            // Thumbnail Image
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 82,
                height: 82,
                child: CafeImageView(
                  imagePath: cafe.coverImage,
                  category: cafe.category,
                  width: 82,
                  height: 82,
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          cafe.name,
                          style: AppTypography.heading3.copyWith(fontSize: 15),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          context.read<CafeProvider>().toggleFavorite(cafe);
                        },
                        child: Icon(
                          cafe.isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          color: cafe.isFavorite ? AppColors.heartRed : AppColors.textMuted,
                          size: 18,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),

                  // Distance & Status
                  Row(
                    children: [
                      Text(
                        '${Haversine.formatDistance(cafe.effectiveDistanceKm)} · ',
                        style: AppTypography.bodySmall.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                      Text(
                        'Open',
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.openGreen,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (cafe.rating != null) ...[
                        const Text(' · '),
                        const Icon(Icons.star_rounded, size: 13, color: AppColors.star),
                        const SizedBox(width: 2),
                        Text(
                          cafe.rating!.toStringAsFixed(1),
                          style: AppTypography.caption.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),

                  // Tags
                  Text(
                    cafe.cuisineTags.join(' · '),
                    style: AppTypography.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
