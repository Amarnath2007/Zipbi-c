import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../widgets/app_toast.dart';

class MapLauncher {
  /// Opens Google Maps Directions directly with the exact business destination.
  /// Format required:
  /// https://www.google.com/maps/dir/?api=1&destination=LATITUDE,LONGITUDE&travelmode=driving
  static Future<bool> openDirections({
    required BuildContext context,
    required double? latitude,
    required double? longitude,
    required String? address,
    required String businessName,
    String? googleMapsUrl,
  }) async {
    String? destination;

    // 1. Prefer actual verified latitude and longitude
    if (latitude != null && longitude != null && latitude != 0.0 && longitude != 0.0) {
      destination = '$latitude,$longitude';
    }
    // 2. Fallback to verified full business address
    else if (address != null && address.trim().isNotEmpty) {
      destination = Uri.encodeComponent(address.trim());
    }

    String urlString;
    if (destination != null && destination.isNotEmpty) {
      urlString =
          'https://www.google.com/maps/dir/?api=1&destination=$destination&travelmode=driving';
    } else if (googleMapsUrl != null && googleMapsUrl.trim().isNotEmpty) {
      urlString = googleMapsUrl.trim();
    } else {
      AppToast.error(context, 'Accurate directions are currently unavailable for $businessName.');
      return false;
    }

    final uri = Uri.parse(urlString);

    try {
      if (kIsWeb) {
        // In Web browser, open in new tab immediately to prevent popup blocker blocking async intent
        return await launchUrl(
          uri,
          mode: LaunchMode.platformDefault,
          webOnlyWindowName: '_blank',
        );
      } else {
        // Tries to open native Google Maps app on mobile devices
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        if (!launched) {
          return await launchUrl(uri, mode: LaunchMode.platformDefault);
        }
        return true;
      }
    } catch (e) {
      debugPrint('[MapLauncher] Error launching maps: $e');
      try {
        return await launchUrl(
          uri,
          mode: LaunchMode.platformDefault,
          webOnlyWindowName: '_blank',
        );
      } catch (err) {
        if (context.mounted) {
          AppToast.error(context, 'Unable to open Google Maps. Please check browser pop-up permissions.');
        }
        return false;
      }
    }
  }
}
