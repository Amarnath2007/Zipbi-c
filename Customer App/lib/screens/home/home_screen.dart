import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/cafe_provider.dart';
import '../../providers/location_provider.dart';
import '../../widgets/loading_indicator.dart';
import '../explore/cafes_list_screen.dart';
import '../search/search_screen.dart';
import 'widgets/cafe_card.dart';
import 'widgets/category_chip.dart';
import 'widgets/location_header.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  final List<Map<String, dynamic>> _categories = const [
    {'name': 'Cafés', 'icon': Icons.local_cafe_rounded},
    {'name': 'Restaurants', 'icon': Icons.restaurant_rounded},
    {'name': 'Tea Shops', 'icon': Icons.emoji_food_beverage_rounded},
    {'name': 'Bakeries', 'icon': Icons.cake_rounded},
    {'name': 'More', 'icon': Icons.more_horiz_rounded},
  ];

  @override
  Widget build(BuildContext context) {
    final cafeProvider = context.watch<CafeProvider>();
    final loc = context.watch<LocationProvider>().currentLocation;

    if (!cafeProvider.hasFetched &&
        !cafeProvider.isLoading &&
        cafeProvider.errorMessage == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        cafeProvider.fetchCafes(lat: loc.latitude, lon: loc.longitude);
      });
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () =>
              cafeProvider.fetchCafes(lat: loc.latitude, lon: loc.longitude),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Location Selector & Notification Bell
                const LocationHeader(),
                const SizedBox(height: 16),

                // 2. Search Bar
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SearchScreen()),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.search_rounded,
                            color: AppColors.textMuted, size: 20),
                        SizedBox(width: 10),
                        Text(
                          'Search cafés, food or area...',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // 3. Category Shortcuts
                SizedBox(
                  height: 38,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    separatorBuilder: (context, index) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected =
                          cafeProvider.selectedCategory == cat['name'];
                      return CategoryChip(
                        label: cat['name'] as String,
                        icon: cat['icon'] as IconData,
                        isSelected: isSelected,
                        onTap: () {
                          cafeProvider.selectCategory(
                            cat['name'] as String,
                            lat: loc.latitude,
                            lon: loc.longitude,
                          );
                        },
                      );
                    },
                  ),
                ),
                const SizedBox(height: 24),

                if (cafeProvider.isLoading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: LoadingIndicator(message: 'Finding cafés near you...'),
                  )
                else if (cafeProvider.errorMessage != null)
                  Container(
                    margin: const EdgeInsets.symmetric(vertical: 36),
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: const BoxDecoration(
                            color: Color(0xFFFEE2E2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.wifi_off_rounded,
                            color: Color(0xFFDC2626),
                            size: 32,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Unable to Load Listings',
                          style: AppTypography.heading2,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Please check your connection and try again.',
                          style: AppTypography.subtitle,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: () => cafeProvider.fetchCafes(
                            lat: loc.latitude,
                            lon: loc.longitude,
                          ),
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          label: const Text('Retry'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                else if (cafeProvider.allCafes.isEmpty)
                  Container(
                    margin: const EdgeInsets.symmetric(vertical: 36),
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: const BoxDecoration(
                            color: AppColors.primaryLight,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.storefront_outlined,
                            color: AppColors.primary,
                            size: 32,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          cafeProvider.selectedCategory != 'Cafés'
                              ? 'No ${cafeProvider.selectedCategory} Found'
                              : 'No Cafés in this Range',
                          style: AppTypography.heading2,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Try increasing the distance slider or selecting another category.',
                          style: AppTypography.subtitle,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          alignment: WrapAlignment.center,
                          children: [
                            if (cafeProvider.selectedCategory != 'Cafés')
                              OutlinedButton.icon(
                                onPressed: () => cafeProvider.selectCategory(
                                  'Cafés',
                                  lat: loc.latitude,
                                  lon: loc.longitude,
                                ),
                                icon: const Icon(Icons.local_cafe_rounded, size: 16),
                                label: const Text('View Cafés'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.primary,
                                  side: const BorderSide(color: AppColors.primary),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ElevatedButton.icon(
                              onPressed: () => cafeProvider.fetchCafes(
                                lat: loc.latitude,
                                lon: loc.longitude,
                              ),
                              icon: const Icon(Icons.refresh_rounded, size: 18),
                              label: const Text('Refresh Listings'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 12,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                else ...[
                  // 4. "Featured Near You" Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Featured Near You',
                        style: AppTypography.heading2,
                      ),
                      GestureDetector(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const CafesListScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'See All',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (cafeProvider.featuredCafes.isNotEmpty)
                    CafeCard(
                      cafe: cafeProvider.featuredCafes.first,
                      style: CafeCardStyle.featured,
                    )
                  else if (cafeProvider.allCafes.isNotEmpty)
                    CafeCard(
                      cafe: cafeProvider.allCafes.first,
                      style: CafeCardStyle.featured,
                    ),

                  const SizedBox(height: 24),

                  // 5. "Popular Nearby" Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Popular Nearby',
                        style: AppTypography.heading2,
                      ),
                      GestureDetector(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const CafesListScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'See All',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Compact Horizontal List of Nearby Cafes
                  SizedBox(
                    height: 175,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: cafeProvider.popularNearby.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        return CafeCard(
                          cafe: cafeProvider.popularNearby[index],
                          style: CafeCardStyle.compact,
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 24),

                  // 6. Recently Added / Exploration section
                  if (cafeProvider.allCafes.length > 3) ...[
                    const Text(
                      'Explore More Places',
                      style: AppTypography.heading2,
                    ),
                    const SizedBox(height: 12),
                    ...cafeProvider.allCafes
                        .skip(1)
                        .take(4)
                        .map((c) => CafeCard(
                              cafe: c,
                              style: CafeCardStyle.listTile,
                            )),
                  ],
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
