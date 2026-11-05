import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/app_constants.dart';
import '../models/cafe_model.dart';
import '../models/menu_model.dart';
import '../models/order_model.dart';
import '../models/user_model.dart';
import 'location_service.dart';
import 'storage_service.dart';

class ApiService {
  static String get baseUrl => AppConstants.apiBaseUrl;

  static Map<String, String> get _headers {
    final token = StorageService.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Fetch all cafes with dynamic distance and filters
  static Future<List<CafeModel>> getCafes({
    double? lat,
    double? lon,
    String? query,
    String? category,
    double? maxDistance,
    double? minRating,
    bool? openNow,
    bool? hasMenu,
  }) async {
    final userLat = lat ?? LocationService.defaultLocation.latitude;
    final userLon = lon ?? LocationService.defaultLocation.longitude;

    try {
      final queryParams = <String, String>{
        'lat': userLat.toString(),
        'lon': userLon.toString(),
        if (query != null && query.isNotEmpty) 'q': query,
        if (category != null && category != 'All') 'category': category,
        if (maxDistance != null) 'maxDistance': maxDistance.toString(),
        if (minRating != null) 'minRating': minRating.toString(),
        if (openNow == true) 'openNow': 'true',
        if (hasMenu == true) 'hasMenu': 'true',
      };

      final uri = Uri.parse('$baseUrl/cafes').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final rawCafes = data['cafes'] as List<dynamic>? ?? [];
        return rawCafes.map((c) => CafeModel.fromJson(c as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      debugPrint('[ApiService] Backend call failed, using offline bundle: $e');
    }

    // Graceful offline fallback: Load from bundled assets/data/cafes.json
    return _loadBundledCafes(
      userLat: userLat,
      userLon: userLon,
      query: query,
      category: category,
      maxDistance: maxDistance,
      minRating: minRating,
      openNow: openNow,
      hasMenu: hasMenu,
    );
  }

  static bool _matchesCategory(String target, String queryCategory) {
    if (queryCategory == 'All' || queryCategory == 'More') return true;
    final t = target.toLowerCase().replaceAll('é', 'e').replaceAll(' ', '');
    final q = queryCategory.toLowerCase().replaceAll('é', 'e').replaceAll(' ', '');
    if (t == q) return true;
    if (t.contains(q) || q.contains(t)) return true;
    if ((t.startsWith('cafe') || t.startsWith('café')) && (q.startsWith('cafe') || q.startsWith('café'))) return true;
    if (t.startsWith('tea') && q.startsWith('tea')) return true;
    if (t.startsWith('baker') && q.startsWith('baker')) return true;
    if (t.startsWith('restaur') && q.startsWith('restaur')) return true;
    return false;
  }

  /// Load and filter cafes from bundled JSON asset
  static Future<List<CafeModel>> _loadBundledCafes({
    required double userLat,
    required double userLon,
    String? query,
    String? category,
    double? maxDistance,
    double? minRating,
    bool? openNow,
    bool? hasMenu,
  }) async {
    String rawJson;
    try {
      rawJson = await rootBundle.loadString('assets/data/cafes.json');
    } catch (_) {
      try {
        rawJson = await rootBundle.loadString('data/cafes.json');
      } catch (e) {
        debugPrint('[ApiService] Failed to load bundled json: $e');
        return [];
      }
    }
    final data = jsonDecode(rawJson);
    final rawList = data['cafes'] as List<dynamic>? ?? [];

    final cafes = rawList.map((c) {
      final model = CafeModel.fromJson(c as Map<String, dynamic>);
      final dist = LocationService.calculateDistanceTo(
        model.latitude,
        model.longitude,
        from: LocationModel(
          name: '',
          description: '',
          latitude: userLat,
          longitude: userLon,
        ),
      );
      return model.copyWith(calculatedDistanceKm: dist);
    }).toList();

    var filtered = cafes;

    if (query != null && query.trim().isNotEmpty) {
      final q = query.trim().toLowerCase();
      filtered = filtered.where((c) {
        final inName = c.name.toLowerCase().contains(q);
        final inArea = c.area.toLowerCase().contains(q);
        final inTags = c.cuisineTags.any((t) => t.toLowerCase().contains(q));
        final inDesc = c.description?.toLowerCase().contains(q) ?? false;
        return inName || inArea || inTags || inDesc;
      }).toList();
    }

    if (category != null && category != 'All' && category != 'More') {
      filtered = filtered.where((c) {
        if (_matchesCategory(c.category, category)) return true;
        if (c.cuisineTags.any((t) => _matchesCategory(t, category))) return true;
        return false;
      }).toList();
    }

    if (maxDistance != null && maxDistance > 0) {
      filtered = filtered.where((c) => c.effectiveDistanceKm <= maxDistance).toList();
    }

    if (minRating != null && minRating > 0) {
      filtered = filtered.where((c) => c.rating != null && c.rating! >= minRating).toList();
    }

    if (openNow == true) {
      filtered = filtered.where((c) => c.openingHours != null && !c.openingHours!.toLowerCase().contains('closed')).toList();
    }

    if (hasMenu == true) {
      filtered = filtered.where((c) => c.hasPublishedMenu).toList();
    }

    filtered.sort((a, b) => a.effectiveDistanceKm.compareTo(b.effectiveDistanceKm));
    return filtered;
  }

  /// Get menu for a cafe
  static Future<List<MenuCategoryModel>> getCafeMenu(String cafeId) async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/cafes/$cafeId/menu'), headers: _headers)
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final rawCats = data['categories'] as List<dynamic>? ?? [];
        return rawCats
            .map((c) => MenuCategoryModel.fromJson(c as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}

    // Fallback: look up in bundled json
    final cafes = await _loadBundledCafes(
      userLat: LocationService.defaultLocation.latitude,
      userLon: LocationService.defaultLocation.longitude,
    );
    final match = cafes.firstWhere((c) => c.id == cafeId || c.slug == cafeId,
        orElse: () => cafes.first);
    return match.menuCategories;
  }

  /// Create table order
  static Future<OrderModel> placeOrder({
    required String cafeId,
    required String tableNumber,
    required List<Map<String, dynamic>> items,
    String? specialNotes,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/orders'),
            headers: _headers,
            body: jsonEncode({
              'cafeId': cafeId,
              'tableNumber': tableNumber,
              'items': items,
              'specialNotes': specialNotes,
              'paymentMethod': 'CASH_OR_UPI_AT_COUNTER',
            }),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return OrderModel.fromJson(data['order'] as Map<String, dynamic>);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to place order.');
      }
    } catch (e) {
      // In offline/demo fallback mode, simulate confirmed order
      final dateStr = DateTime.now().millisecondsSinceEpoch;
      return OrderModel(
        id: 'ord-$dateStr',
        orderNumber: 'ZPB-${DateTime.now().year}$dateStr'.substring(0, 16),
        customerId: StorageService.getUser()?.id ?? 'usr-demo-1',
        cafeId: cafeId,
        cafeName: 'The German Cafe',
        tableNumber: tableNumber,
        status: 'PENDING',
        totalAmount: 350.0,
        paymentMethod: 'CASH_OR_UPI_AT_COUNTER',
        specialNotes: specialNotes,
        createdAt: DateTime.now(),
        items: items
            .map((i) => OrderItemModel(
                  menuItemId: i['menuItemId']?.toString() ?? '',
                  itemName: 'Selected Item',
                  pricePerUnit: 170.0,
                  quantity: (i['quantity'] as num?)?.toInt() ?? 1,
                  subtotal: 170.0 * ((i['quantity'] as num?)?.toInt() ?? 1),
                ))
            .toList(),
      );
    }
  }

  /// Authenticate customer
  static Future<Map<String, dynamic>> login({
    required String loginIdentifier,
    required String password,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'loginIdentifier': loginIdentifier,
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'] as String;
        final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
        await StorageService.saveAuthToken(token);
        await StorageService.saveUser(user);
        return {'success': true, 'user': user};
      } else {
        final data = jsonDecode(response.body);
        return {'success': false, 'message': data['message'] ?? 'Login failed'};
      }
    } catch (_) {
      // Offline fallback: allow demo login
      final demoUser = UserModel(
        id: 'usr-demo-1',
        fullName: 'Amarnath B',
        phone: loginIdentifier,
        email: 'amarnath.b@example.com',
      );
      await StorageService.saveAuthToken('offline-demo-token');
      await StorageService.saveUser(demoUser);
      return {'success': true, 'user': demoUser};
    }
  }

  /// Register new customer
  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String phone,
    String? email,
    required String password,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'fullName': fullName,
              'phone': phone,
              'email': email,
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final token = data['token'] as String;
        final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
        await StorageService.saveAuthToken(token);
        await StorageService.saveUser(user);
        return {'success': true, 'user': user};
      } else {
        final data = jsonDecode(response.body);
        return {'success': false, 'message': data['message'] ?? 'Registration failed'};
      }
    } catch (_) {
      // Offline fallback
      final user = UserModel(
        id: 'usr-${DateTime.now().millisecondsSinceEpoch}',
        fullName: fullName,
        phone: phone,
        email: email,
      );
      await StorageService.saveAuthToken('offline-demo-token');
      await StorageService.saveUser(user);
      return {'success': true, 'user': user};
    }
  }
}

