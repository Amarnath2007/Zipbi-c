import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/cafe_provider.dart';
import '../../providers/location_provider.dart';
import '../../widgets/empty_state_view.dart';
import '../../widgets/loading_indicator.dart';
import '../home/widgets/cafe_card.dart';
import '../search/filters_screen.dart';

class CafesListScreen extends StatelessWidget {
  final bool showBackButton;

  const CafesListScreen({super.key, this.showBackButton = true});

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
      appBar: AppBar(
        automaticallyImplyLeading: showBackButton,
        leading: showBackButton
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        title: const Text('Cafés Near You', style: AppTypography.heading2),
        actions: [
          IconButton(
            icon: const Icon(Icons.map_outlined, color: AppColors.primary),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Interactive Map view showing verified SITRA café coordinates.'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: AppColors.textPrimary),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const FiltersScreen()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter Pills Row
            SizedBox(
              height: 38,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 18),
                children: [
                  _buildQuickPill(
                    context,
                    label: 'Sort ▼',
                    onTap: () => _showSortModal(context),
                  ),
                  const SizedBox(width: 8),
                  _buildQuickPill(
                    context,
                    label: 'Distance (${cafeProvider.distanceRadius.toStringAsFixed(1)} km)',
                    isSelected: cafeProvider.distanceRadius < 5.0,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const FiltersScreen()),
                      );
                    },
                  ),
                  const SizedBox(width: 8),
                  _buildQuickPill(
                    context,
                    label: cafeProvider.minRating != null
                        ? '★ ${cafeProvider.minRating}+'
                        : 'Rating ▼',
                    isSelected: cafeProvider.minRating != null,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const FiltersScreen()),
                      );
                    },
                  ),
                  const SizedBox(width: 8),
                  _buildQuickPill(
                    context,
                    label: 'Open Now',
                    isSelected: cafeProvider.openNowFilter,
                    onTap: () {
                      cafeProvider.updateFilters(
                        openNow: !cafeProvider.openNowFilter,
                        lat: loc.latitude,
                        lon: loc.longitude,
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Cafes List
            Expanded(
              child: RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () => cafeProvider.fetchCafes(
                  lat: loc.latitude,
                  lon: loc.longitude,
                ),
                child: cafeProvider.isLoading
                    ? const LoadingIndicator(message: 'Updating café distances...')
                    : cafeProvider.errorMessage != null
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.wifi_off_rounded, size: 48, color: AppColors.textMuted),
                                  const SizedBox(height: 12),
                                  const Text('Unable to connect to café service', style: AppTypography.heading2),
                                  const SizedBox(height: 8),
                                  Text(cafeProvider.errorMessage!, style: AppTypography.caption, textAlign: TextAlign.center),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: () => cafeProvider.fetchCafes(lat: loc.latitude, lon: loc.longitude),
                                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                                    child: const Text('Retry', style: TextStyle(color: Colors.white)),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : cafeProvider.allCafes.isEmpty
                            ? const EmptyStateView(
                                icon: Icons.coffee_rounded,
                                title: 'No Cafés in this Range',
                                message: 'Try increasing the distance slider or clearing active filters.',
                              )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 18, vertical: 8),
                            itemCount: cafeProvider.allCafes.length,
                            itemBuilder: (context, index) {
                              return CafeCard(
                                cafe: cafeProvider.allCafes[index],
                                style: CafeCardStyle.listTile,
                              );
                            },
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickPill(
    BuildContext context, {
    required String label,
    bool isSelected = false,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              color: isSelected ? AppColors.primary : AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }

  void _showSortModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Sort Cafés By', style: AppTypography.heading2),
                const SizedBox(height: 12),
                ListTile(
                  leading: const Icon(Icons.near_me_rounded, color: AppColors.primary),
                  title: const Text('Distance: Closest to Farthest (Default)',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  trailing: const Icon(Icons.check, color: AppColors.primary),
                  onTap: () => Navigator.pop(ctx),
                ),
                ListTile(
                  leading: const Icon(Icons.star_rounded, color: AppColors.star),
                  title: const Text('Rating: Highest Rated'),
                  onTap: () {
                    final p = context.read<CafeProvider>();
                    p.allCafes.sort((a, b) => (b.rating ?? 0).compareTo(a.rating ?? 0));
                    Navigator.pop(ctx);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

