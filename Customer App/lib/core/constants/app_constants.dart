class AppConstants {
  static const String appName = 'ZipBi';
  static const String appTagline = 'Discover great cafés around you';

  // Live Cloud API configuration
  static const String apiBaseUrl = 'https://zipbi-c.onrender.com/api/v1';
  static const String apiBaseUrlWebOrLocal = 'https://zipbi-c.onrender.com/api/v1';

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

