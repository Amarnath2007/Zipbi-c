import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/models/cafe_model.dart';
import '../../data/models/menu_model.dart';
import '../../data/services/api_service.dart';
import '../../widgets/empty_state_view.dart';
import '../../widgets/loading_indicator.dart';
import 'menu_items_screen.dart';

class MenuCategoriesScreen extends StatefulWidget {
  final CafeModel cafe;

  const MenuCategoriesScreen({super.key, required this.cafe});

  @override
  State<MenuCategoriesScreen> createState() => _MenuCategoriesScreenState();
}

class _MenuCategoriesScreenState extends State<MenuCategoriesScreen> {
  List<MenuCategoryModel> _categories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final cats = await ApiService.getCafeMenu(widget.cafe.id);
    setState(() {
      _categories = cats;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.cafe.name, style: AppTypography.heading2),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => MenuItemsScreen(cafe: widget.cafe),
                ),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const LoadingIndicator(message: 'Loading menu categories...')
            : _categories.isEmpty
                ? EmptyStateView(
                    icon: Icons.menu_book_rounded,
                    title: 'No Digital Menu',
                    message:
                        'The menu for ${widget.cafe.name} is not published digitally yet.',
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 16),
                    itemCount: _categories.length,
                    separatorBuilder: (context, index) => const Divider(),
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      return ListTile(
                        contentPadding:
                            const EdgeInsets.symmetric(vertical: 4),
                        title: Text(
                          cat.name,
                          style: AppTypography.heading3,
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${cat.itemCount} items',
                              style: AppTypography.subtitle,
                            ),
                            const SizedBox(width: 8),
                            const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 14,
                              color: AppColors.textMuted,
                            ),
                          ],
                        ),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => MenuItemsScreen(
                                cafe: widget.cafe,
                                initialCategory: cat.name,
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
      ),
    );
  }
}
