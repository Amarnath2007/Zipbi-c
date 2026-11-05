import 'dart:math';

/// Calculates straight-line distance in kilometers between two GPS coordinates
/// using the Haversine formula.
class Haversine {
  static const double earthRadiusKm = 6371.0;

  static double calculateDistance({
    required double lat1,
    required double lon1,
    required double lat2,
    required double lon2,
  }) {
    final dLat = _toRadians(lat2 - lat1);
    final dLon = _toRadians(lon2 - lon1);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) *
            cos(_toRadians(lat2)) *
            sin(dLon / 2) *
            sin(dLon / 2);

    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    final distance = earthRadiusKm * c;

    // Return rounded to 2 decimal places
    return double.parse(distance.toStringAsFixed(2));
  }

  /// Formats distance according to ZipBi standard:
  /// Under 1 km displayed in meters (e.g. "120 m", "850 m")
  /// 1 km and above displayed in kilometers with 1 decimal (e.g. "1.2 km", "4.5 km")
  static String formatDistance(double km) {
    if (km < 1.0) {
      final meters = (km * 1000).round();
      return '$meters m';
    } else {
      return '${km.toStringAsFixed(1)} km';
    }
  }

  static double _toRadians(double degrees) {
    return degrees * (pi / 180.0);
  }
}

