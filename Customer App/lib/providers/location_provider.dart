import 'package:flutter/material.dart';
import '../data/services/location_service.dart';

class LocationProvider extends ChangeNotifier {
  LocationModel _currentLocation = LocationService.defaultLocation;
  bool _isLocationPermissionGranted = false;
  bool _isDetecting = false;
  String? _locationError;

  LocationModel get currentLocation => _currentLocation;
  bool get isLocationPermissionGranted => _isLocationPermissionGranted;
  bool get isDetecting => _isDetecting;
  String? get locationError => _locationError;

  Future<bool> detectDeviceLocation() async {
    _isDetecting = true;
    _locationError = null;
    notifyListeners();

    try {
      final loc = await LocationService.detectDeviceLocation();
      if (loc != null) {
        _currentLocation = loc;
        _isLocationPermissionGranted = true;
        _locationError = null;
        _isDetecting = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      final errStr = e.toString();
      if (errStr.contains('PERMISSION_DENIED') || errStr.contains('1')) {
        _locationError = 'PERMISSION_DENIED';
      } else {
        _locationError = errStr;
      }
      _isLocationPermissionGranted = false;
    }

    _isDetecting = false;
    notifyListeners();
    return false;
  }

  void selectManualLocation(LocationModel location) {
    _currentLocation = location.copyWith(isManualSelection: true, isGpsDetected: false);
    _locationError = null;
    notifyListeners();
  }

  void grantLocationPermission() {
    detectDeviceLocation();
  }

  void denyLocationPermission() {
    _isLocationPermissionGranted = false;
    _locationError = 'PERMISSION_DENIED';
    notifyListeners();
  }
}
