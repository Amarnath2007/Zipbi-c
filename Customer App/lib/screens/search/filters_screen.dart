import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/cafe_provider.dart';
import '../../providers/location_provider.dart';
import '../../widgets/custom_button.dart';

class FiltersScreen extends StatefulWidget {
  const FiltersScreen({super.key});

  @override
  State<FiltersScreen> createState() => _FiltersScreenState();
}

class _FiltersScreenState extends State<FiltersScreen> {
  late String _selectedCategory;
  late double _distance;
  double? _rating;
  late bool _openNow;
  late bool _hasMenu;

  final List<String> _categories = [
    'Cafés',
    'Restaurants',
    'Tea Shops',
    'Bakeries',
    'Others',
    'Snacks',
    'Desserts',
    'Beverages',
    'More',
  ];

  @override
  void initState() {
    super.initState();
    final p = context.read<CafeProvider>();
    _selectedCategory = p.selectedCategory;
    _distance = p.distanceRadius;
    _rating = p.minRating;
    _openNow = p.openNowFilter;
    _hasMenu = p.hasMenuFilter;
  }

  void _onApply() {
    final loc = context.read<LocationProvider>().currentLocation;
    context.read<CafeProvider>().updateFilters(
          category: _selectedCategory,
          distance: _distance,
          rating: _rating,
          openNow: _openNow,
          hasMenu: _hasMenu,
          lat: loc.latitude,
          lon: loc.longitude,
        );
    Navigator.pop(context);
  }

  void _onClearAll() {
    final loc = context.read<LocationProvider>().currentLocation;
    context.read<CafeProvider>().clearFilters(
          lat: loc.latitude,
          lon: loc.longitude,
        );
    setState(() {
      _selectedCategory = 'Cafés';
      _distance = 5.0;
      _rating = null;
      _openNow = false;
      _hasMenu = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Filters', style: AppTypography.heading2),
        actions: [
          TextButton(
            onPressed: _onClearAll,
            child: const Text(
              'Clear All',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Categories
                    const Text('Categories', style: AppTypography.heading3),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _categories.map((cat) {
                        final isSelected = _selectedCategory == cat;
                        return ChoiceChip(
                          label: Text(cat),
                          selected: isSelected,
                          selectedColor: AppColors.primary,
                          backgroundColor: AppColors.surfaceLight,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : AppColors.textPrimary,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            fontSize: 13,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(
                              color: isSelected ? AppColors.primary : AppColors.border,
                            ),
                          ),
                          onSelected: (_) {
                            setState(() {
                              _selectedCategory = cat;
                            });
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 28),

                    // 2. Distance Slider
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Distance', style: AppTypography.heading3),
                        Text(
                          '${_distance.toStringAsFixed(1)} km',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: AppColors.primary,
                        inactiveTrackColor: AppColors.border,
                        thumbColor: AppColors.primary,
                        overlayColor: AppColors.primary.withValues(alpha: 0.15),
                      ),
                      child: Slider(
                        value: _distance,
                        min: 0.2,
                        max: 5.0,
                        divisions: 24,
                        onChanged: (val) {
                          setState(() {
                            _distance = val;
                          });
                        },
                      ),
                    ),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('0 km', style: AppTypography.caption),
                        Text('5 km', style: AppTypography.caption),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // 3. Rating
                    const Text('Rating', style: AppTypography.heading3),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildRatingChip('Any', null),
                        const SizedBox(width: 8),
                        _buildRatingChip('4.0+', 4.0),
                        const SizedBox(width: 8),
                        _buildRatingChip('4.5+', 4.5),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // 4. Open Now Toggle
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      activeTrackColor: AppColors.primary,
                      title: const Text('Open Now', style: AppTypography.heading3),
                      value: _openNow,
                      onChanged: (val) {
                        setState(() {
                          _openNow = val;
                        });
                      },
                    ),
                    const Divider(),

                    // 5. Has Menu Toggle
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      activeTrackColor: AppColors.primary,
                      title: const Text('Has Menu', style: AppTypography.heading3),
                      value: _hasMenu,
                      onChanged: (val) {
                        setState(() {
                          _hasMenu = val;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),

            // Apply Button
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: CustomButton(
                text: 'Apply Filters',
                onPressed: _onApply,
                height: 52,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingChip(String label, double? value) {
    final isSelected = _rating == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.surfaceLight,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.textPrimary,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
        fontSize: 13,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected ? AppColors.primary : AppColors.border,
        ),
      ),
      onSelected: (_) {
        setState(() {
          _rating = value;
        });
      },
    );
  }
}
