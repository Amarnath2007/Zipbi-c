import 'package:flutter/material.dart';
import '../data/models/user_model.dart';
import '../data/services/api_service.dart';
import '../data/services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    _currentUser = StorageService.getUser();
  }

  Future<bool> login(String loginIdentifier, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await ApiService.login(
      loginIdentifier: loginIdentifier,
      password: password,
    );

    _isLoading = false;
    if (result['success'] == true) {
      _currentUser = result['user'] as UserModel;
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['message']?.toString() ?? 'Login failed';
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String phone,
    String? email,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await ApiService.register(
      fullName: fullName,
      phone: phone,
      email: email,
      password: password,
    );

    _isLoading = false;
    if (result['success'] == true) {
      _currentUser = result['user'] as UserModel;
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['message']?.toString() ?? 'Registration failed';
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await StorageService.clearAuthToken();
    await StorageService.clearUser();
    _currentUser = null;
    notifyListeners();
  }
}

