import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/cafe_provider.dart';
import '../../widgets/empty_state_view.dart';
import '../home/widgets/cafe_card.dart';

class FavouritesScreen extends StatefulWidget {
  const FavouritesScreen({super.key});

  @override
  State<FavouritesScreen> createState() => _FavouritesScreenState();
}

class _FavouritesScreenState extends State<FavouritesScreen> {
  int _selectedSegment = 0; // 0 = Cafés, 1 = Items

  @override
  Widget build(BuildContext context) {
    final cafeProvider = context.watch<CafeProvider>();
    final favorites = cafeProvider.favoriteCafes;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Favourites', style: AppTypography.heading2),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Segmented Control: [Cafés] | [Items]
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedSegment = 0),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _selectedSegment == 0
                                ? AppColors.primary
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Center(
                            child: Text(
                              'Cafés',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _selectedSegment == 0
                                    ? Colors.white
                                    : AppColors.textPrimary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedSegment = 1),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _selectedSegment == 1
                                ? AppColors.primary
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Center(
                            child: Text(
                              'Items',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _selectedSegment == 1
                                    ? Colors.white
                                    : AppColors.textPrimary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Segment Content
            Expanded(
              child: _selectedSegment == 0
                  ? (favorites.isEmpty
                      ? const EmptyStateView(
                          icon: Icons.favorite_border_rounded,
                          title: 'No Favourite Cafés Yet',
                          message:
                              'Tap the heart icon on any café card to save your favourite spots here.',
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: favorites.length,
                          itemBuilder: (context, index) {
                            return CafeCard(
                              cafe: favorites[index],
                              style: CafeCardStyle.listTile,
                            );
                          },
                        ))
                  : const EmptyStateView(
                      icon: Icons.fastfood_outlined,
                      title: 'No Saved Dishes',
                      message:
                          'Save individual menu items to quickly reorder your favourite dishes.',
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

