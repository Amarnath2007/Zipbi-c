// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use
import 'dart:async';
import 'dart:html' as html;

Future<Map<String, dynamic>?> getDeviceGeolocation() async {
  try {
    final completer = Completer<Map<String, dynamic>?>();
    
    html.window.navigator.geolocation.getCurrentPosition(
      enableHighAccuracy: true,
      timeout: const Duration(seconds: 10),
      maximumAge: const Duration(minutes: 1),
    ).then((pos) {
      if (!completer.isCompleted) {
        final coords = pos.coords;
        if (coords != null && coords.latitude != null && coords.longitude != null) {
          completer.complete({
            'latitude': coords.latitude,
            'longitude': coords.longitude,
            'accuracy': coords.accuracy,
          });
        } else {
          completer.complete(null);
        }
      }
    }).catchError((err) {
      if (!completer.isCompleted) {
        completer.completeError(err.toString());
      }
    });

    return await completer.future.timeout(
      const Duration(seconds: 10),
      onTimeout: () => throw TimeoutException('Geolocation timed out'),
    );
  } catch (e) {
    rethrow;
  }
}
