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
    if (!mounted) return;
    setState(() {
      _categories = cats;
      _isLoading = false;
    });
  }

  /// Deduplicate categories by normalized name and safely aggregate items
  /// to ensure each category appears exactly once without overlapping.
  List<MenuCategoryModel> _getDeduplicatedCategories() {
    final Map<String, MenuCategoryModel> uniqueMap = {};

    for (final cat in _categories) {
      final key = cat.name.trim().toLowerCase();
      if (key.isEmpty) continue;

      if (!uniqueMap.containsKey(key)) {
        uniqueMap[key] = cat;
      } else {
        // Safe aggregation: merge items across duplicate entries
        final existing = uniqueMap[key]!;
        final existingIds = existing.items.map((i) => i.id).toSet();
        final mergedItems = List<MenuItemModel>.from(existing.items);

        for (final item in cat.items) {
          if (!existingIds.contains(item.id)) {
            mergedItems.add(item);
            existingIds.add(item.id);
          }
        }

        uniqueMap[key] = MenuCategoryModel(
          id: existing.id,
          name: existing.name,
          description: existing.description ?? cat.description,
          items: mergedItems,
        );
      }
    }

    return uniqueMap.values.toList();
  }

  @override
  Widget build(BuildContext context) {
    final displayCategories = _getDeduplicatedCategories();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.cafe.name, style: AppTypography.heading2.copyWith(fontSize: 16)),
            Text(
              'Menu Categories',
              style: AppTypography.caption.copyWith(color: AppColors.primary, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            tooltip: 'Search All Menu Items',
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
            : displayCategories.isEmpty
                ? EmptyStateView(
                    icon: Icons.menu_book_rounded,
                    title: 'No Digital Menu',
                    message:
                        'The menu for ${widget.cafe.name} is not published digitally yet.',
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      // Switch to 1 column on narrow screens (< 340px)
                      final isNarrow = constraints.maxWidth < 340;
                      final crossAxisCount = isNarrow ? 1 : 2;
                      final childAspectRatio = isNarrow ? 3.2 : 1.55;

                      return GridView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        itemCount: displayCategories.length,
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: crossAxisCount,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: childAspectRatio,
                        ),
                        itemBuilder: (context, index) {
                          final cat = displayCategories[index];
                          return _buildCategoryCard(context, cat);
                        },
                      );
                    },
                  ),
      ),
    );
  }

  Widget _buildCategoryCard(BuildContext context, MenuCategoryModel cat) {
    return Container(
      key: ValueKey(cat.id),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
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
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top row: Green accent pill & chevron icon
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 6,
                      height: 18,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 18,
                      color: AppColors.textMuted,
                    ),
                  ],
                ),

                // Category Name (wraps properly, never overflows)
                Text(
                  cat.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    height: 1.25,
                  ),
                ),

                // Item count indicator
                Text(
                  '${cat.itemCount} ${cat.itemCount == 1 ? 'item' : 'items'}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
