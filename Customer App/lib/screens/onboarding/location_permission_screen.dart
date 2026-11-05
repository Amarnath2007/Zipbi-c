import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/location_provider.dart';
import '../../widgets/custom_button.dart';
import '../main_navigation_screen.dart';

class LocationPermissionScreen extends StatelessWidget {
  const LocationPermissionScreen({super.key});

  void _onAllow(BuildContext context) async {
    await context.read<LocationProvider>().detectDeviceLocation();
    if (context.mounted) {
      _navigateToHome(context);
    }
  }

  void _onSkip(BuildContext context) {
    context.read<LocationProvider>().denyLocationPermission();
    _navigateToHome(context);
  }

  void _navigateToHome(BuildContext context) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),

              // Map & Pin Graphic
              Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primaryLight.withValues(alpha: 0.6),
                ),
                child: Center(
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.location_on_rounded,
                      size: 52,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 36),

              const Text(
                'Allow Location Access',
                style: AppTypography.heading1,
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 12),

              const Text(
                'Show nearby cafés and great food options around you.',
                style: AppTypography.subtitle,
                textAlign: TextAlign.center,
              ),

              const Spacer(),

              // Allow Location Button
              CustomButton(
                text: 'Allow Location',
                icon: Icons.near_me_rounded,
                onPressed: () => _onAllow(context),
                height: 52,
              ),

              const SizedBox(height: 16),

              // Not Now Button
              TextButton(
                onPressed: () => _onSkip(context),
                child: const Text(
                  'Not Now',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

