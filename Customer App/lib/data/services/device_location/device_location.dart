import 'device_location_stub.dart'
    if (dart.library.js) 'device_location_web.dart' as platform;

class DeviceLocationClient {
  static Future<Map<String, dynamic>?> getCurrentCoordinates() async {
    return await platform.getDeviceGeolocation();
  }
}

