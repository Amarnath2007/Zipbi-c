import 'package:flutter_test/flutter_test.dart';
import 'package:zipbi_customer/main.dart';

void main() {
  testWidgets('ZipBi Customer App launches and displays Splash Screen', (WidgetTester tester) async {
    await tester.pumpWidget(const ZipBiCustomerApp());
    await tester.pump(const Duration(milliseconds: 200));

    // Verify brand title and tagline on Splash Screen
    expect(find.text('ZipBi'), findsOneWidget);
    expect(find.text('Discover great cafés around you'), findsOneWidget);

    // Fast forward splash timer so no pending timers remain
    await tester.pump(const Duration(seconds: 3));
  });
}
