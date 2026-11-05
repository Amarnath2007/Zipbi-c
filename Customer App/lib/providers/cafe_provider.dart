import 'package:flutter/material.dart';
import '../data/models/cafe_model.dart';
import '../data/services/api_service.dart';
import '../data/services/storage_service.dart';

class CafeProvider extends ChangeNotifier {
  List<CafeModel> _allCafes = [];
  bool _isLoading = false;
  bool _hasFetched = false;
  String? _errorMessage;

  // Filter & Search states
  String _selectedCategory = 'Cafés';
  String _searchQuery = '';
  double _distanceRadius = 5.0; // 0 to 5 km slider
  double? _minRating;
  bool _openNowFilter = false;
  bool _hasMenuFilter = false;

  List<String> _recentSearches = [];
  final List<String> _popularSearches = [
    'Cafés near me',
    'Open now',
    'Lunch',
    'Snacks',
    'Desserts',
    'Burgers',
    'Budget friendly',
  ];

  // Getters
  List<CafeModel> get allCafes => _allCafes;
  bool get isLoading => _isLoading;
  bool get hasFetched => _hasFetched;
  String? get errorMessage => _errorMessage;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  double get distanceRadius => _distanceRadius;
  double? get minRating => _minRating;
  bool get openNowFilter => _openNowFilter;
  bool get hasMenuFilter => _hasMenuFilter;
  List<String> get recentSearches => _recentSearches;
  List<String> get popularSearches => _popularSearches;

  List<CafeModel> get featuredCafes =>
      _allCafes.where((c) => c.rating != null && c.rating! >= 4.2).toList();

  List<CafeModel> get popularNearby =>
      _allCafes.where((c) => c.effectiveDistanceKm <= 1.0).toList();

  List<CafeModel> get favoriteCafes =>
      _allCafes.where((c) => c.isFavorite).toList();

  CafeProvider() {
    _recentSearches = StorageService.getRecentSearches();
  }

  Future<void> fetchCafes({double? lat, double? lon}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final savedFavs = StorageService.getFavorites().toSet();
      final cafes = await ApiService.getCafes(
        lat: lat,
        lon: lon,
        query: _searchQuery.isNotEmpty ? _searchQuery : null,
        category: _selectedCategory,
        maxDistance: _distanceRadius > 0 ? _distanceRadius : null,
        minRating: _minRating,
        openNow: _openNowFilter ? true : null,
        hasMenu: _hasMenuFilter ? true : null,
      );

      for (var c in cafes) {
        c.isFavorite = savedFavs.contains(c.id);
      }

      _allCafes = cafes;
      _isLoading = false;
      _hasFetched = true;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _hasFetched = true;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  void selectCategory(String category, {double? lat, double? lon}) {
    if (_selectedCategory == category) return;
    _selectedCategory = category;
    fetchCafes(lat: lat, lon: lon);
  }

  void setSearchQuery(String query, {double? lat, double? lon}) {
    _searchQuery = query;
    if (query.trim().isNotEmpty && !_recentSearches.contains(query.trim())) {
      _recentSearches.insert(0, query.trim());
      if (_recentSearches.length > 8) _recentSearches.removeLast();
      StorageService.saveRecentSearches(_recentSearches);
    }
    fetchCafes(lat: lat, lon: lon);
  }

  void clearRecentSearches() {
    _recentSearches.clear();
    StorageService.saveRecentSearches([]);
    notifyListeners();
  }

  void updateFilters({
    String? category,
    double? distance,
    double? rating,
    bool? openNow,
    bool? hasMenu,
    double? lat,
    double? lon,
  }) {
    if (category != null) _selectedCategory = category;
    if (distance != null) _distanceRadius = distance;
    _minRating = rating;
    if (openNow != null) _openNowFilter = openNow;
    if (hasMenu != null) _hasMenuFilter = hasMenu;
    fetchCafes(lat: lat, lon: lon);
  }

  void clearFilters({double? lat, double? lon}) {
    _selectedCategory = 'Cafés';
    _distanceRadius = 5.0;
    _minRating = null;
    _openNowFilter = false;
    _hasMenuFilter = false;
    fetchCafes(lat: lat, lon: lon);
  }

  Future<void> toggleFavorite(CafeModel cafe) async {
    cafe.isFavorite = !cafe.isFavorite;
    final savedFavs = StorageService.getFavorites().toSet();
    if (cafe.isFavorite) {
      savedFavs.add(cafe.id);
    } else {
      savedFavs.remove(cafe.id);
    }
    await StorageService.saveFavorites(savedFavs.toList());
    notifyListeners();
  }
}

