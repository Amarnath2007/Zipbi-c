class AppConstants {
  static const String appName = 'ZipBi';
  static const String appTagline = 'Discover great cafés around you';

  // Base API configuration (Supports local emulators, device IP, and web)
  // For Android emulator: 10.0.2.2; for real device/desktop: localhost or LAN IP
  static const String apiBaseUrl = 'http://10.0.2.2:5000/api/v1';
  static const String apiBaseUrlWebOrLocal = 'http://localhost:5000/api/v1';

  // Default Location: PSG College of Arts & Science Main Gate, Coimbatore
  static const String defaultLocationName = 'PSG CAS, Coimbatore';
  static const String defaultAreaDescription = 'Civil Aerodrome Post, Avinashi Road, Coimbatore';
  static const double defaultLatitude = 11.0326883;
  static const double defaultLongitude = 77.0345773;

  // Local Storage Keys
  static const String keyAuthToken = 'zipbi_auth_token';
  static const String keyUserJson = 'zipbi_user_data';
  static const String keyFavorites = 'zipbi_saved_favorites';
  static const String keyRecentSearches = 'zipbi_recent_searches';
  static const String keySelectedLocation = 'zipbi_selected_location';
  static const String keyHasSeenOnboarding = 'zipbi_has_seen_onboarding';
}

