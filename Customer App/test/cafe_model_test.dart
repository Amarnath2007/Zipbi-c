import 'package:flutter_test/flutter_test.dart';
import 'package:zipbi_customer/data/models/cafe_model.dart';

void main() {
  group('Cafe Model & Verification Status Tests', () {
    test('Correctly parses active partner café with ordering enabled', () {
      final json = {
        'id': 'cafe-the-german-cafe',
        'name': 'The German Cafe',
        'slug': 'the-german-cafe',
        'cover_image': 'assets/images/cafes/german_cafe.jpg',
        'category': 'Café',
        'cuisine_tags': ['Café', 'Italian', 'Fast Food'],
        'address': 'C.R. Complex, SITRA, Coimbatore',
        'area': 'SITRA, Coimbatore',
        'latitude': 11.0358,
        'longitude': 77.0355,
        'distance_psg_cas_km': 0.4,
        'rating': 4.3,
        'review_count': 120,
        'verification_status': 'ACTIVE_PARTNER',
        'is_ordering_enabled': true,
        'has_published_menu': true,
      };

      final cafe = CafeModel.fromJson(json);

      expect(cafe.id, 'cafe-the-german-cafe');
      expect(cafe.isActivePartner, true);
      expect(cafe.isOrderingEnabled, true);
      expect(cafe.isVerified, true);
      expect(cafe.rating, 4.3);
      expect(cafe.reviewCount, 120);
      expect(cafe.effectiveDistanceKm, 0.4);
    });

    test('Correctly identifies unclaimed / verified non-partner café', () {
      final json = {
        'id': 'cafe-rest-in-peace',
        'name': 'Rest In Peace Cafe',
        'slug': 'rest-in-peace-cafe',
        'cover_image': 'assets/images/cafes/rip_cafe.jpg',
        'category': 'Café',
        'cuisine_tags': ['Café', 'Snacks'],
        'address': 'SITRA, Coimbatore',
        'area': 'SITRA',
        'latitude': 11.0348,
        'longitude': 77.0348,
        'distance_psg_cas_km': 0.3,
        'rating': 4.2,
        'review_count': 45,
        'verification_status': 'VERIFIED',
        'is_ordering_enabled': false,
        'has_published_menu': false,
      };

      final cafe = CafeModel.fromJson(json);

      expect(cafe.isActivePartner, false);
      expect(cafe.isOrderingEnabled, false);
      expect(cafe.isVerified, true);
      expect(cafe.hasPublishedMenu, false);
    });
  });
}

