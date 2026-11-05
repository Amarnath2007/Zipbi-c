import 'package:flutter_test/flutter_test.dart';
import 'package:zipbi_customer/data/services/api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('ApiService getCafes handles clean reset directory gracefully', () async {
    final cafes = await ApiService.getCafes(
      category: 'Cafés',
      maxDistance: 5.0,
    );
    expect(cafes, isA<List>());
  });
}
