class UserModel {
  final String id;
  final String fullName;
  final String phone;
  final String? email;
  final String role;
  final String? avatarUrl;

  UserModel({
    required this.id,
    required this.fullName,
    required this.phone,
    this.email,
    this.role = 'CUSTOMER',
    this.avatarUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? json['full_name']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString(),
      role: json['role']?.toString() ?? 'CUSTOMER',
      avatarUrl: json['avatarUrl']?.toString() ?? json['avatar_url']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phone': phone,
      'email': email,
      'role': role,
      'avatarUrl': avatarUrl,
    };
  }
}

