import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_constants.dart';
import '../models/user_model.dart';

class StorageService {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // Auth Token
  static Future<void> saveAuthToken(String token) async {
    await _prefs?.setString(AppConstants.keyAuthToken, token);
  }

  static String? getAuthToken() {
    return _prefs?.getString(AppConstants.keyAuthToken);
  }

  static Future<void> clearAuthToken() async {
    await _prefs?.remove(AppConstants.keyAuthToken);
  }

  // User Profile
  static Future<void> saveUser(UserModel user) async {
    await _prefs?.setString(AppConstants.keyUserJson, jsonEncode(user.toJson()));
  }

  static UserModel? getUser() {
    final raw = _prefs?.getString(AppConstants.keyUserJson);
    if (raw == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  static Future<void> clearUser() async {
    await _prefs?.remove(AppConstants.keyUserJson);
  }

  // Favourites
  static Future<void> saveFavorites(List<String> cafeIds) async {
    await _prefs?.setStringList(AppConstants.keyFavorites, cafeIds);
  }

  static List<String> getFavorites() {
    return _prefs?.getStringList(AppConstants.keyFavorites) ?? [];
  }

  // Recent Searches
  static Future<void> saveRecentSearches(List<String> searches) async {
    await _prefs?.setStringList(AppConstants.keyRecentSearches, searches);
  }

  static List<String> getRecentSearches() {
    return _prefs?.getStringList(AppConstants.keyRecentSearches) ??
        ['The German Cafe', 'Café near PSG CAS', 'Italian food', 'Tea shop', 'SITRA cafes'];
  }

  // Onboarding
  static Future<void> setHasSeenOnboarding(bool seen) async {
    await _prefs?.setBool(AppConstants.keyHasSeenOnboarding, seen);
  }

  static bool hasSeenOnboarding() {
    return _prefs?.getBool(AppConstants.keyHasSeenOnboarding) ?? false;
  }
}

