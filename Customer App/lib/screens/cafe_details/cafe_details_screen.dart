import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/haversine.dart';
import '../../core/utils/map_launcher.dart';
import '../../data/models/cafe_model.dart';
import '../../data/models/menu_model.dart';
import '../../providers/cafe_provider.dart';
import '../../widgets/cafe_image_view.dart';
import '../../widgets/app_toast.dart';
import 'menu_items_screen.dart';
import 'menu_categories_screen.dart';

class CafeDetailsScreen extends StatefulWidget {
  final CafeModel cafe;

  const CafeDetailsScreen({super.key, required this.cafe});

  @override
  State<CafeDetailsScreen> createState() => _CafeDetailsScreenState();
}

class _CafeDetailsScreenState extends State<CafeDetailsScreen> {
  int _activeTab = 0; // 0 = Menu, 1 = About, 2 = Reviews

  @override
  Widget build(BuildContext context) {
    final cafe = widget.cafe;
    final isFavorite = context.select<CafeProvider, bool>(
      (p) => p.allCafes.firstWhere((c) => c.id == cafe.id, orElse: () => cafe).isFavorite,
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // 1. Hero Cover Image Sliver AppBar
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            backgroundColor: AppColors.background,
            leading: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.85),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            actions: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.85),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.share_outlined, color: AppColors.textPrimary, size: 20),
                  onPressed: () {
                    AppToast.info(context, 'Sharing ${cafe.name} via ZipBi.');
                  },
                ),
              ),
              Container(
                margin: const EdgeInsets.fromLTRB(8, 8, 16, 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.85),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: Icon(
                    isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                    color: isFavorite ? AppColors.heartRed : AppColors.textPrimary,
                    size: 20,
                  ),
                  onPressed: () {
                    context.read<CafeProvider>().toggleFavorite(cafe);
                  },
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CafeImageView(
                    imagePath: cafe.coverImage,
                    category: cafe.category,
                    width: double.infinity,
                    height: double.infinity,
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black38,
                          Colors.transparent,
                          Colors.black45,
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. Details Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title & Distance
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          cafe.name,
                          style: AppTypography.heading1.copyWith(fontSize: 22),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          MapLauncher.openDirections(
                            context: context,
                            latitude: cafe.latitude,
                            longitude: cafe.longitude,
                            address: cafe.address,
                            businessName: cafe.name,
                            googleMapsUrl: cafe.googleMapsUrl,
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.near_me_rounded, size: 12, color: AppColors.primary),
                              const SizedBox(width: 4),
                              Text(
                                Haversine.formatDistance(cafe.effectiveDistanceKm),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Rating & Hours
                  Row(
                    children: [
                      if (cafe.rating != null) ...[
                        const Icon(Icons.star_rounded, size: 16, color: AppColors.star),
                        const SizedBox(width: 4),
                        Text(
                          '${cafe.rating!.toStringAsFixed(1)} (${cafe.reviewCount != null ? "${cafe.reviewCount}+ reviews" : "verified"})',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
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
                            fontWeight: FontWeight.w700,
                            color: AppColors.openGreen,
                          ),
                        ),
                      ),
                      if (cafe.openingHours != null) ...[
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '· ${cafe.openingHours!}',
                            style: AppTypography.caption,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Categories & Cost for two
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Text(
                          cafe.displayCategory,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      if (cafe.costForTwo != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            '₹${cafe.costForTwo} for two',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Action Buttons: Directions, Call, Share
                  Row(
                    children: [
                      Expanded(
                        child: _buildActionButton(
                          icon: Icons.directions_rounded,
                          label: 'Directions',
                          onTap: () {
                            MapLauncher.openDirections(
                              context: context,
                              latitude: cafe.latitude,
                              longitude: cafe.longitude,
                              address: cafe.address,
                              businessName: cafe.name,
                              googleMapsUrl: cafe.googleMapsUrl,
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildActionButton(
                          icon: Icons.call_rounded,
                          label: 'Call',
                          onTap: () {
                            if (cafe.phone != null && cafe.phone!.isNotEmpty) {
                              AppToast.info(context, 'Calling ${cafe.name}: ${cafe.phone}');
                            } else {
                              AppToast.info(context, 'Phone number not available.');
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildActionButton(
                          icon: Icons.share_rounded,
                          label: 'Share',
                          onTap: () {
                            AppToast.success(context, 'Share link: https://zipbi.in/cafe/${cafe.slug}');
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Tabs: [Menu], [About], [Reviews]
                  Row(
                    children: [
                      _buildTabChip('Menu', 0),
                      const SizedBox(width: 8),
                      _buildTabChip('About', 1),
                      const SizedBox(width: 8),
                      _buildTabChip('Reviews', 2),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Tab Content
                  if (_activeTab == 0) _buildMenuTab(context, cafe),
                  if (_activeTab == 1) _buildAboutTab(context, cafe),
                  if (_activeTab == 2) _buildReviewsTab(context, cafe),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabChip(String label, int index) {
    final isSelected = _activeTab == index;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, size: 18, color: AppColors.textPrimary),
            const SizedBox(width: 0, height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Menu Tab
  Widget _buildMenuTab(BuildContext context, CafeModel cafe) {
    final hasItems = cafe.menuCategories.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (cafe.isOrderingEnabled)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.restaurant_rounded, color: AppColors.primary, size: 20),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Online Table Ordering is active for this café! Select dishes and enter your table number.',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryDark,
                    ),
                  ),
                ),
              ],
            ),
          ),

        if (hasItems) ...[
          // Safe category deduplication & Two-Column Grid Preview
          () {
            final Map<String, MenuCategoryModel> uniqueMap = {};
            for (final cat in cafe.menuCategories) {
              final key = cat.name.trim().toLowerCase();
              if (key.isEmpty) continue;
              if (!uniqueMap.containsKey(key)) {
                uniqueMap[key] = cat;
              } else {
                final existing = uniqueMap[key]!;
                final existingIds = existing.items.map((i) => i.id).toSet();
                final merged = List<MenuItemModel>.from(existing.items);
                for (final item in cat.items) {
                  if (!existingIds.contains(item.id)) {
                    merged.add(item);
                    existingIds.add(item.id);
                  }
                }
                uniqueMap[key] = MenuCategoryModel(
                  id: existing.id,
                  name: existing.name,
                  description: existing.description ?? cat.description,
                  items: merged,
                );
              }
            }
            final displayCats = uniqueMap.values.toList();

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Categories (${displayCats.length})',
                      style: AppTypography.heading3,
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => MenuCategoriesScreen(cafe: cafe),
                          ),
                        );
                      },
                      child: const Text(
                        'View All',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isNarrow = constraints.maxWidth < 340;
                    final crossAxisCount = isNarrow ? 1 : 2;
                    final childAspectRatio = isNarrow ? 3.2 : 1.55;

                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: displayCats.length,
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: crossAxisCount,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: childAspectRatio,
                      ),
                      itemBuilder: (context, index) {
                        final cat = displayCats[index];
                        return _buildCategoryGridCard(context, cafe, cat);
                      },
                    );
                  },
                ),
              ],
            );
          }(),
          const SizedBox(height: 16),

          // Button to Open Full Text-Only Menu
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.menu_book_rounded, size: 18),
              label: const Text('Explore Full Menu'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => MenuItemsScreen(cafe: cafe),
                  ),
                );
              },
            ),
          ),
        ] else ...[
          // Clean professional empty state
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                const Icon(Icons.menu_book_rounded, size: 36, color: AppColors.textMuted),
                const SizedBox(height: 12),
                const Text(
                  'Menu is being updated',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'The menu for ${cafe.name} is currently being updated. Please check back shortly or contact the café directly.',
                  style: AppTypography.bodySmall,
                  textAlign: TextAlign.center,
                ),
                if (cafe.phone != null && cafe.phone!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.phone_rounded, size: 16),
                    label: const Text('Call Café'),
                    onPressed: () {
                      AppToast.info(context, 'Calling ${cafe.name}: ${cafe.phone}');
                    },
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }

  // About Tab
  Widget _buildAboutTab(BuildContext context, CafeModel cafe) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('About', style: AppTypography.heading2),
        const SizedBox(height: 8),
        Text(
          cafe.description ??
              'A popular hangout spot in the SITRA / Civil Aerodrome corridor near PSG CAS.',
          style: AppTypography.body,
        ),
        const SizedBox(height: 16),

        // Address with direct click to open Google Maps Directions
        _buildInfoRow(
          Icons.location_on_outlined,
          'Address (Tap for Directions)',
          cafe.address,
          onTap: () {
            MapLauncher.openDirections(
              context: context,
              latitude: cafe.latitude,
              longitude: cafe.longitude,
              address: cafe.address,
              businessName: cafe.name,
              googleMapsUrl: cafe.googleMapsUrl,
            );
          },
        ),
        const SizedBox(height: 12),
        _buildInfoRow(
          Icons.access_time_rounded,
          'Opening Hours',
          cafe.openingHours ?? 'Regular business hours',
        ),
        if (cafe.phone != null && cafe.phone!.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildInfoRow(
            Icons.phone_outlined,
            'Phone Number',
            cafe.phone!,
          ),
        ],
        if (cafe.costForTwo != null) ...[
          const SizedBox(height: 12),
          _buildInfoRow(
            Icons.receipt_long_outlined,
            'Average Cost',
            '₹${cafe.costForTwo} for two people approx.',
          ),
        ],
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String title, String value, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    color: onTap != null ? AppColors.primary : AppColors.textPrimary,
                    fontWeight: onTap != null ? FontWeight.w500 : FontWeight.normal,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          if (onTap != null)
            const Icon(Icons.open_in_new_rounded, size: 16, color: AppColors.primary),
        ],
      ),
    );
  }

  // Reviews Tab
  Widget _buildReviewsTab(BuildContext context, CafeModel cafe) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Customer Ratings', style: AppTypography.heading2),
            if (cafe.rating != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 16, color: AppColors.star),
                    const SizedBox(width: 4),
                    Text(
                      '${cafe.rating!.toStringAsFixed(1)} / 5.0',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryDark,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.rate_review_outlined, size: 16, color: AppColors.primary),
                  SizedBox(width: 8),
                  Text(
                    'Verified Patron Reviews',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Based on ${cafe.reviewCount != null ? "${cafe.reviewCount}+ customer ratings" : "patron ratings"}. ZipBi shows authentic ratings to help you discover the best food experiences.',
                style: AppTypography.bodySmall,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryGridCard(BuildContext context, CafeModel cafe, MenuCategoryModel cat) {
    return Container(
      key: ValueKey(cat.id),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => MenuItemsScreen(cafe: cafe, initialCategory: cat.name),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 6,
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: AppColors.textMuted,
                    ),
                  ],
                ),
                Text(
                  cat.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    height: 1.2,
                  ),
                ),
                Text(
                  '${cat.itemCount} ${cat.itemCount == 1 ? 'item' : 'items'}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
