import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/location_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _darkMode = false;
  bool _pushNotifications = true;
  String _language = 'English';

  @override
  Widget build(BuildContext context) {
    final location = context.watch<LocationProvider>().currentLocation;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Settings', style: AppTypography.heading2),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          children: [
            // Location
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.location_on_outlined, color: AppColors.primary),
              title: const Text('Default Discovery Location', style: AppTypography.body),
              subtitle: Text(location.name, style: AppTypography.caption),
              trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('You can change your discovery area from the top bar on the Home screen.')),
                );
              },
            ),
            const Divider(),

            // Dark Mode Toggle
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              activeTrackColor: AppColors.primary,
              secondary: const Icon(Icons.dark_mode_outlined, color: AppColors.primary),
              title: const Text('Dark Mode', style: AppTypography.body),
              value: _darkMode,
              onChanged: (val) {
                setState(() => _darkMode = val);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Theme preference saved.')),
                );
              },
            ),
            const Divider(),

            // Notifications
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              activeTrackColor: AppColors.primary,
              secondary: const Icon(Icons.notifications_outlined, color: AppColors.primary),
              title: const Text('Order Notifications', style: AppTypography.body),
              subtitle: const Text('Receive live status updates on table orders', style: AppTypography.caption),
              value: _pushNotifications,
              onChanged: (val) {
                setState(() => _pushNotifications = val);
              },
            ),
            const Divider(),

            // Language
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.language_rounded, color: AppColors.primary),
              title: const Text('Language', style: AppTypography.body),
              subtitle: Text(_language, style: AppTypography.caption),
              trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
              onTap: () => _showLanguageDialog(context),
            ),
            const Divider(),

            // Privacy Policy
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.privacy_tip_outlined, color: AppColors.primary),
              title: const Text('Privacy Policy', style: AppTypography.body),
              trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
              onTap: () => _showInfoDialog(context, 'Privacy Policy', 'ZipBi respects customer privacy and protects all personal information. Location coordinates are used solely for real-time straight-line distance calculations and are never sold or shared with third-party advertisers.'),
            ),
            const Divider(),

            // Terms of Service
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.description_outlined, color: AppColors.primary),
              title: const Text('Terms of Service', style: AppTypography.body),
              trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
              onTap: () => _showInfoDialog(context, 'Terms of Service', 'ZipBi is an AI-assisted café discovery and table ordering platform. Customers agree to settle order totals directly with participating cafés via approved counter payment methods (Cash or UPI).'),
            ),
          ],
        ),
      ),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Select Language'),
        children: [
          SimpleDialogOption(
            onPressed: () {
              setState(() => _language = 'English');
              Navigator.pop(ctx);
            },
            child: const Text('English (Default)'),
          ),
          SimpleDialogOption(
            onPressed: () {
              setState(() => _language = 'Tamil (தமிழ்)');
              Navigator.pop(ctx);
            },
            child: const Text('Tamil (தமிழ்)'),
          ),
        ],
      ),
    );
  }

  void _showInfoDialog(BuildContext context, String title, String content) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: AppTypography.heading2),
        content: Text(content, style: AppTypography.body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
