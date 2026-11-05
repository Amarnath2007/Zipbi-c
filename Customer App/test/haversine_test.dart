import 'package:flutter_test/flutter_test.dart';
import 'package:zipbi_customer/core/utils/haversine.dart';

void main() {
  group('Haversine Distance Tests', () {
    // Reference Point: PSG CAS gate (11.0326883, 77.0345773)
    const psgLat = 11.0326883;
    const psgLon = 77.0345773;

    test('Distance to same point is zero', () {
      final distance = Haversine.calculateDistance(
        lat1: psgLat,
        lon1: psgLon,
        lat2: psgLat,
        lon2: psgLon,
      );
      expect(distance, 0.0);
    });

    test('Distance to The German Cafe (~0.4 km verified)', () {
      // The German Cafe: 11.0358, 77.0355
      final distance = Haversine.calculateDistance(
        lat1: psgLat,
        lon1: psgLon,
        lat2: 11.0358,
        lon2: 77.0355,
      );
      expect(distance, greaterThanOrEqualTo(0.3));
      expect(distance, lessThanOrEqualTo(0.5));
    });

    test('Distance to KMCH Avinashi Road (~1.1 km verified)', () {
      // KMCH: 11.0404121, 77.0408824
      final distance = Haversine.calculateDistance(
        lat1: psgLat,
        lon1: psgLon,
        lat2: 11.0404121,
        lon2: 77.0408824,
      );
      expect(distance, greaterThanOrEqualTo(1.0));
      expect(distance, lessThanOrEqualTo(1.2));
    });

    test('Distance formatting tests', () {
      expect(Haversine.formatDistance(0.05), '50 m');
      expect(Haversine.formatDistance(0.36), '360 m');
      expect(Haversine.formatDistance(0.85), '850 m');
      expect(Haversine.formatDistance(1.24), '1.2 km');
      expect(Haversine.formatDistance(4.5), '4.5 km');
    });
  });
}

