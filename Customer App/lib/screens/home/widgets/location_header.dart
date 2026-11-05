import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/services/location_service.dart';
import '../../../providers/cafe_provider.dart';
import '../../../providers/location_provider.dart';
import '../../../widgets/app_toast.dart';

class LocationHeader extends StatelessWidget {
  const LocationHeader({super.key});

  void _showLocationPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Select Discovery Location',
                  style: AppTypography.heading2,
                ),
                const SizedBox(height: 6),
                const Text(
                  'Distances to cafés and restaurants will be calculated from this point.',
                  style: AppTypography.subtitle,
                ),
                const SizedBox(height: 16),

                // GPS Detection Action
                Consumer<LocationProvider>(
                  builder: (context, locProv, _) {
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: locProv.currentLocation.isGpsDetected
                              ? AppColors.primary
                              : AppColors.border,
                        ),
                      ),
                      tileColor: locProv.currentLocation.isGpsDetected
                          ? AppColors.primaryLight
                          : AppColors.surfaceLight,
                      leading: locProv.isDetecting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primary,
                              ),
                            )
                          : const Icon(
                              Icons.my_location_rounded,
                              color: AppColors.primary,
                              size: 22,
                            ),
                      title: const Text(
                        'Use My Current Device Location (GPS)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      subtitle: Text(
                        locProv.isDetecting
                            ? 'Detecting GPS coordinates...'
                            : (locProv.currentLocation.isGpsDetected
                                ? 'Active GPS: ${locProv.currentLocation.name}'
                                : 'High-accuracy browser/device geolocation'),
                        style: AppTypography.caption,
                      ),
                      trailing: locProv.currentLocation.isGpsDetected
                          ? const Icon(Icons.check_circle_rounded, color: AppColors.primary)
                          : const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
                      onTap: () async {
                        final success = await locProv.detectDeviceLocation();
                        if (success && ctx.mounted) {
                          final loc = locProv.currentLocation;
                          context.read<CafeProvider>().fetchCafes(
                                lat: loc.latitude,
                                lon: loc.longitude,
                              );
                          AppToast.success(ctx, 'GPS Location updated: ${loc.name}');
                          Navigator.pop(ctx);
                        } else if (ctx.mounted) {
                          AppToast.error(
                            ctx,
                            'Location access denied or unavailable. Please choose an area below.',
                          );
                        }
                      },
                    );
                  },
                ),

                const SizedBox(height: 14),
                const Text(
                  'Or Choose an Area in Coimbatore Manually:',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),

                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: LocationService.popularAreas.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final area = LocationService.popularAreas[index];
                      final isSelected = !context.watch<LocationProvider>().currentLocation.isGpsDetected &&
                          context.watch<LocationProvider>().currentLocation.name == area.name;

                      return ListTile(
                        dense: true,
                        leading: Icon(
                          Icons.location_on_rounded,
                          color: isSelected ? AppColors.primary : AppColors.textSecondary,
                          size: 18,
                        ),
                        title: Text(
                          area.name,
                          style: TextStyle(
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? AppColors.primary : AppColors.textPrimary,
                            fontSize: 13,
                          ),
                        ),
                        subtitle: Text(area.description, style: AppTypography.caption),
                        trailing: isSelected
                            ? const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 18)
                            : null,
                        onTap: () {
                          context.read<LocationProvider>().selectManualLocation(area);
                          context.read<CafeProvider>().fetchCafes(
                                lat: area.latitude,
                                lon: area.longitude,
                              );
                          Navigator.pop(ctx);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final location = context.watch<LocationProvider>().currentLocation;

    return Row(
      children: [
        // Location Selector
        Expanded(
          child: GestureDetector(
            onTap: () => _showLocationPicker(context),
            child: Row(
              children: [
                Icon(
                  location.isGpsDetected ? Icons.my_location_rounded : Icons.location_on_rounded,
                  color: AppColors.primary,
                  size: 20,
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    location.isGpsDetected ? '${location.name} (GPS)' : location.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: AppColors.textPrimary,
                  size: 18,
                ),
              ],
            ),
          ),
        ),

        // Notification Bell
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.surfaceLight,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.border),
          ),
          child: IconButton(
            icon: const Icon(
              Icons.notifications_outlined,
              color: AppColors.textPrimary,
              size: 20,
            ),
            onPressed: () {
              AppToast.info(context, 'No new notifications right now.');
            },
          ),
        ),
      ],
    );
  }
}
