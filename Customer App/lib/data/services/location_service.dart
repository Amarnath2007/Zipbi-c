import '../../core/utils/haversine.dart';
import 'device_location/device_location.dart';

class LocationModel {
  final String name;
  final String description;
  final double latitude;
  final double longitude;
  final bool isGpsDetected;
  final bool isManualSelection;

  const LocationModel({
    required this.name,
    required this.description,
    required this.latitude,
    required this.longitude,
    this.isGpsDetected = false,
    this.isManualSelection = false,
  });

  LocationModel copyWith({
    String? name,
    String? description,
    double? latitude,
    double? longitude,
    bool? isGpsDetected,
    bool? isManualSelection,
  }) {
    return LocationModel(
      name: name ?? this.name,
      description: description ?? this.description,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isGpsDetected: isGpsDetected ?? this.isGpsDetected,
      isManualSelection: isManualSelection ?? this.isManualSelection,
    );
  }
}

class LocationService {
  static const LocationModel defaultLocation = LocationModel(
    name: 'PSG CAS, Coimbatore',
    description: 'Civil Aerodrome Post, Avinashi Road',
    latitude: 11.0326883,
    longitude: 77.0345773,
    isGpsDetected: false,
    isManualSelection: true,
  );

  static const List<LocationModel> popularAreas = [
    LocationModel(
      name: 'SITRA, Coimbatore',
      description: 'Avinashi Road near Airport Junction',
      latitude: 11.0368750,
      longitude: 77.0362113,
      isManualSelection: true,
    ),
    LocationModel(
      name: 'PSG CAS Gate, SITRA',
      description: 'Civil Aerodrome Post, Avinashi Road',
      latitude: 11.0326883,
      longitude: 77.0345773,
      isManualSelection: true,
    ),
    LocationModel(
      name: 'KMCH / Avinashi Road',
      description: 'Avinashi Road opp KMCH Hospital',
      latitude: 11.0404121,
      longitude: 77.0408824,
      isManualSelection: true,
    ),
    LocationModel(
      name: 'Peelamedu / Hopes College',
      description: 'Avinashi Road, Peelamedu',
      latitude: 11.0277830,
      longitude: 76.9986160,
      isManualSelection: true,
    ),
    LocationModel(
      name: 'Gandhipuram Central',
      description: 'Cross Cut Road & 100 Feet Rd',
      latitude: 11.0183000,
      longitude: 76.9644000,
      isManualSelection: true,
    ),
    LocationModel(
      name: 'RS Puram, Coimbatore',
      description: 'DB Road & TV Swamy Road',
      latitude: 11.0090000,
      longitude: 76.9510000,
      isManualSelection: true,
    ),
    LocationModel(
      name: 'Saravanampatti (IT Corridor)',
      description: 'Sathy Road / CHIL SEZ IT Park',
      latitude: 11.0797000,
      longitude: 76.9997000,
      isManualSelection: true,
    ),
    LocationModel(
      name: 'Race Course, Coimbatore',
      description: 'Race Course Road Promenade',
      latitude: 11.0045000,
      longitude: 76.9740000,
      isManualSelection: true,
    ),
  ];

  /// Request actual GPS location from browser or device
  static Future<LocationModel?> detectDeviceLocation() async {
    try {
      final coords = await DeviceLocationClient.getCurrentCoordinates();
      if (coords != null && coords['latitude'] != null && coords['longitude'] != null) {
        final lat = (coords['latitude'] as num).toDouble();
        final lon = (coords['longitude'] as num).toDouble();
        final locality = _resolveCoimbatoreLocality(lat, lon);

        return LocationModel(
          name: locality,
          description: 'Live GPS Location (${lat.toStringAsFixed(4)}, ${lon.toStringAsFixed(4)})',
          latitude: lat,
          longitude: lon,
          isGpsDetected: true,
          isManualSelection: false,
        );
      }
    } catch (e) {
      // Re-throw so caller can distinguish PERMISSION_DENIED
      rethrow;
    }
    return null;
  }

  static String _resolveCoimbatoreLocality(double lat, double lon) {
    // Check known Coimbatore neighborhood bounds
    if (lat >= 11.030 && lat <= 11.039 && lon >= 77.030 && lon <= 77.042) {
      return 'SITRA, Coimbatore';
    }
    if (lat >= 11.039 && lat <= 11.048 && lon >= 77.038 && lon <= 77.046) {
      return 'KMCH / Avinashi Road';
    }
    if (lat >= 11.022 && lat <= 11.033 && lon >= 76.990 && lon <= 77.030) {
      return 'Peelamedu, Coimbatore';
    }
    if (lat >= 11.012 && lat <= 11.025 && lon >= 76.960 && lon <= 76.975) {
      return 'Gandhipuram, Coimbatore';
    }
    if (lat >= 11.002 && lat <= 11.015 && lon >= 76.940 && lon <= 76.960) {
      return 'RS Puram, Coimbatore';
    }
    if (lat >= 11.065 && lat <= 11.095 && lon >= 76.980 && lon <= 77.020) {
      return 'Saravanampatti, Coimbatore';
    }
    if (lat >= 10.995 && lat <= 11.010 && lon >= 76.965 && lon <= 76.985) {
      return 'Race Course, Coimbatore';
    }
    return 'Current GPS Location';
  }

  static double calculateDistanceTo(double targetLat, double targetLon,
      {LocationModel? from}) {
    final origin = from ?? defaultLocation;
    return Haversine.calculateDistance(
      lat1: origin.latitude,
      lon1: origin.longitude,
      lat2: targetLat,
      lon2: targetLon,
    );
  }
}
