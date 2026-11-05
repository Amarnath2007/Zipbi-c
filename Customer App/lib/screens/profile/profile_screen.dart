import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_toast.dart';
import '../auth/login_screen.dart';
import '../favourites/favourites_screen.dart';
import '../order/order_history_screen.dart';
import 'edit_profile_screen.dart';
import 'settings_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _onLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out of ZipBi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.closedRed),
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;
    final displayName = user?.fullName ?? 'Amarnath B';
    final displayEmail = user?.email ?? user?.phone ?? 'amarnath.b@example.com';
    final initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'A';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Profile', style: AppTypography.heading2),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.textPrimary),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              // User Avatar & Info
              Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: const Color(0xFF6B7280),
                    child: Text(
                      initial,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName,
                          style: AppTypography.heading2.copyWith(fontSize: 18),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          displayEmail,
                          style: AppTypography.subtitle,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Menu List
              _buildMenuItem(
                context,
                icon: Icons.person_outline_rounded,
                title: 'Edit Profile',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                  );
                },
              ),
              _buildMenuItem(
                context,
                icon: Icons.favorite_border_rounded,
                title: 'Saved Cafés',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const FavouritesScreen()),
                  );
                },
              ),
              _buildMenuItem(
                context,
                icon: Icons.receipt_long_outlined,
                title: 'Order History',
                badgeText: 'Active',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const OrderHistoryScreen()),
                  );
                },
              ),
              _buildMenuItem(
                context,
                icon: Icons.notifications_outlined,
                title: 'Notifications',
                onTap: () {
                  AppToast.info(context, 'All notifications are up to date.');
                },
              ),
              _buildMenuItem(
                context,
                icon: Icons.help_outline_rounded,
                title: 'Help & Support',
                onTap: () {
                  AppToast.info(context, 'Contact ZipBi Support: support@zipbi.in');
                },
              ),
              _buildMenuItem(
                context,
                icon: Icons.info_outline_rounded,
                title: 'About ZipBi',
                onTap: () {
                  showAboutDialog(
                    context: context,
                    applicationName: 'ZipBi',
                    applicationVersion: '1.0.0',
                    applicationIcon: Image.asset('assets/images/logo/zipbi_logo.png', width: 48, height: 48),
                    applicationLegalese: '© 2026 ZipBi Technologies. Built for Coimbatore Cafés.',
                    children: [
                      const Text(
                        'ZipBi is an AI-assisted café discovery and table ordering platform initially serving Coimbatore, Tamil Nadu.',
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 28),

              // Log Out Button
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => _onLogout(context),
                  style: TextButton.styleFrom(
                    backgroundColor: AppColors.closedRedLight,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Log Out',
                    style: TextStyle(
                      color: AppColors.closedRed,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Brand Badge Footer
              Center(
                child: Column(
                  children: [
                    Image.asset(
                      'assets/images/logo/zipbi_logo.png',
                      width: 32,
                      height: 32,
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'ZipBi • Version 1.0.0',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const Text(
                      'Made with passion for Coimbatore',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    String? badgeText,
    required VoidCallback onTap,
  }) {
    return Column(
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Icon(icon, color: AppColors.textPrimary, size: 22),
          title: Text(title, style: AppTypography.body.copyWith(fontWeight: FontWeight.w500)),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (badgeText != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    badgeText,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              const Icon(
                Icons.arrow_forward_ios_rounded,
                size: 14,
                color: AppColors.textMuted,
              ),
            ],
          ),
          onTap: onTap,
        ),
        const Divider(height: 1),
      ],
    );
  }
}

