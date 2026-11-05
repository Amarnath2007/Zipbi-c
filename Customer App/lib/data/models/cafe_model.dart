import 'menu_model.dart';

class CafeModel {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String coverImage;
  final String? coverImageUrl;
  final String? imageSource;
  final String imageVerificationStatus; // 'VERIFIED' or 'AWAITING_MERCHANT_VERIFICATION'
  final String category;
  final List<String> cuisineTags;
  final String address;
  final String area;
  final double latitude;
  final double longitude;
  final double? distancePsgCasKm;
  final double? calculatedDistanceKm;
  final String? openingHours;
  final String? phone;
  final String? website;
  final String? googleMapsUrl;
  final int? costForTwo;
  final String? costForTwoSource;
  final double? rating;
  final int? reviewCount;
  final String verificationStatus;
  final bool isOrderingEnabled;
  final bool hasPublishedMenu;
  final String menuStatus; // 'Verified Menu', 'Partially Verified', 'Awaiting Merchant Confirmation', 'Menu Not Available'
  final String? menuStatusNotes;
  final String? verifiedAt;
  final List<MenuCategoryModel> menuCategories;
  final bool? isOpenNow;
  final Map<String, dynamic>? schedule;
  bool isFavorite;

  CafeModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    required this.coverImage,
    this.coverImageUrl,
    this.imageSource,
    this.imageVerificationStatus = 'VERIFIED',
    required this.category,
    required this.cuisineTags,
    required this.address,
    required this.area,
    required this.latitude,
    required this.longitude,
    this.distancePsgCasKm,
    this.calculatedDistanceKm,
    this.openingHours,
    this.phone,
    this.website,
    this.googleMapsUrl,
    this.costForTwo,
    this.costForTwoSource,
    this.rating,
    this.reviewCount,
    required this.verificationStatus,
    this.isOrderingEnabled = false,
    this.hasPublishedMenu = false,
    this.menuStatus = 'Awaiting Merchant Confirmation',
    this.menuStatusNotes,
    this.verifiedAt,
    this.menuCategories = const [],
    this.isOpenNow,
    this.schedule,
    this.isFavorite = false,
  });

  /// Displays the best available distance
  double get effectiveDistanceKm =>
      calculatedDistanceKm ?? distancePsgCasKm ?? 0.0;

  bool get isActivePartner => verificationStatus == 'ACTIVE_PARTNER';
  bool get isVerified =>
      verificationStatus == 'VERIFIED' || verificationStatus == 'ACTIVE_PARTNER';

  bool get isMenuVerified => menuStatus == 'Verified Menu';
  bool get isMenuPartiallyVerified => menuStatus == 'Partially Verified';
  bool get isMenuAwaitingConfirmation =>
      menuStatus == 'Awaiting Merchant Confirmation' || menuStatus == 'Menu Not Available';

  bool get isImageVerified => imageVerificationStatus == 'VERIFIED';

  factory CafeModel.fromJson(Map<String, dynamic> json) {
    final tags = (json['cuisine_tags'] ?? json['cuisineTags'] ?? []) as List<dynamic>;
    final cats = (json['menu_categories'] ?? json['categories'] ?? []) as List<dynamic>;

    return CafeModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      description: json['description']?.toString(),
      coverImage: json['cover_image']?.toString() ??
          json['coverImage']?.toString() ??
          'assets/images/cafes/german_cafe.jpg',
      coverImageUrl: json['cover_image_url']?.toString() ?? json['coverImageUrl']?.toString(),
      imageSource: json['image_source']?.toString() ?? json['imageSource']?.toString(),
      imageVerificationStatus: json['image_verification_status']?.toString() ??
          json['imageVerificationStatus']?.toString() ??
          'VERIFIED',
      category: json['category']?.toString() ?? 'Café',
      cuisineTags: tags.map((t) => t.toString()).toList(),
      address: json['address']?.toString() ?? '',
      area: json['area']?.toString() ?? 'SITRA, Coimbatore',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 11.0326883,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 77.0345773,
      distancePsgCasKm: (json['distance_psg_cas_km'] as num?)?.toDouble(),
      calculatedDistanceKm: (json['calculated_distance_km'] ?? json['distanceKm']) != null
          ? (json['calculated_distance_km'] ?? json['distanceKm'] as num).toDouble()
          : null,
      openingHours: json['opening_hours']?.toString() ?? json['openingHours']?.toString(),
      phone: json['phone']?.toString(),
      website: json['website']?.toString(),
      googleMapsUrl: json['google_maps_url']?.toString() ?? json['googleMapsUrl']?.toString(),
      costForTwo: (json['cost_for_two'] ?? json['costForTwo'] as num?)?.toInt(),
      costForTwoSource: json['cost_for_two_source']?.toString() ?? json['costForTwoSource']?.toString(),
      rating: (json['rating'] as num?)?.toDouble(),
      reviewCount: (json['review_count'] ?? json['reviewCount'] as num?)?.toInt(),
      verificationStatus: json['verification_status']?.toString() ??
          json['verificationStatus']?.toString() ??
          'UNCLAIMED',
      isOrderingEnabled: json['is_ordering_enabled'] == true || json['isOrderingEnabled'] == true,
      hasPublishedMenu: json['has_published_menu'] == true || json['hasPublishedMenu'] == true,
      menuStatus: json['menu_status']?.toString() ??
          json['menuStatus']?.toString() ??
          'Awaiting Merchant Confirmation',
      menuStatusNotes: json['menu_status_notes']?.toString() ?? json['menuStatusNotes']?.toString(),
      verifiedAt: json['verified_at']?.toString() ?? json['verifiedAt']?.toString(),
      menuCategories: cats.map((c) => MenuCategoryModel.fromJson(c as Map<String, dynamic>)).toList(),
      isOpenNow: json['is_open_now'] == true || json['isOpenNow'] == true,
      schedule: json['schedule'] as Map<String, dynamic>?,
      isFavorite: json['isFavorite'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'cover_image': coverImage,
      'cover_image_url': coverImageUrl,
      'image_source': imageSource,
      'image_verification_status': imageVerificationStatus,
      'category': category,
      'cuisine_tags': cuisineTags,
      'address': address,
      'area': area,
      'latitude': latitude,
      'longitude': longitude,
      'distance_psg_cas_km': distancePsgCasKm,
      'calculated_distance_km': calculatedDistanceKm,
      'opening_hours': openingHours,
      'phone': phone,
      'website': website,
      'google_maps_url': googleMapsUrl,
      'cost_for_two': costForTwo,
      'cost_for_two_source': costForTwoSource,
      'rating': rating,
      'review_count': reviewCount,
      'verification_status': verificationStatus,
      'is_ordering_enabled': isOrderingEnabled,
      'has_published_menu': hasPublishedMenu,
      'menu_status': menuStatus,
      'menu_status_notes': menuStatusNotes,
      'verified_at': verifiedAt,
      'menu_categories': menuCategories.map((c) => c.toJson()).toList(),
      'isFavorite': isFavorite,
    };
  }

  CafeModel copyWith({
    bool? isFavorite,
    double? calculatedDistanceKm,
  }) {
    return CafeModel(
      id: id,
      name: name,
      slug: slug,
      description: description,
      coverImage: coverImage,
      coverImageUrl: coverImageUrl,
      imageSource: imageSource,
      imageVerificationStatus: imageVerificationStatus,
      category: category,
      cuisineTags: cuisineTags,
      address: address,
      area: area,
      latitude: latitude,
      longitude: longitude,
      distancePsgCasKm: distancePsgCasKm,
      calculatedDistanceKm: calculatedDistanceKm ?? this.calculatedDistanceKm,
      openingHours: openingHours,
      phone: phone,
      website: website,
      googleMapsUrl: googleMapsUrl,
      costForTwo: costForTwo,
      costForTwoSource: costForTwoSource,
      rating: rating,
      reviewCount: reviewCount,
      verificationStatus: verificationStatus,
      isOrderingEnabled: isOrderingEnabled,
      hasPublishedMenu: hasPublishedMenu,
      menuStatus: menuStatus,
      menuStatusNotes: menuStatusNotes,
      verifiedAt: verifiedAt,
      menuCategories: menuCategories,
      isOpenNow: isOpenNow,
      schedule: schedule,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }
}
