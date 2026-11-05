import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/models/cafe_model.dart';
import '../../data/models/menu_model.dart';
import '../../data/services/api_service.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/loading_indicator.dart';
import '../order/cart_screen.dart';

class MenuItemsScreen extends StatefulWidget {
  final CafeModel cafe;
  final String? initialCategory;

  const MenuItemsScreen({
    super.key,
    required this.cafe,
    this.initialCategory,
  });

  @override
  State<MenuItemsScreen> createState() => _MenuItemsScreenState();
}

class _MenuItemsScreenState extends State<MenuItemsScreen> {
  late String _selectedCategory;
  List<MenuCategoryModel> _categories = [];
  bool _isLoading = true;
  String _searchFilter = '';

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory ?? 'All';
    _loadMenu();
  }

  Future<void> _loadMenu() async {
    setState(() => _isLoading = true);
    final cats = await ApiService.getCafeMenu(widget.cafe.id);

    // Deduplicate categories and aggregate items
    final Map<String, MenuCategoryModel> uniqueMap = {};
    for (final cat in cats) {
      final key = cat.name.trim().toLowerCase();
      if (key.isEmpty) continue;
      if (!uniqueMap.containsKey(key)) {
        uniqueMap[key] = cat;
      } else {
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
    final deduped = uniqueMap.values.toList();

    setState(() {
      _categories = deduped;
      _isLoading = false;
      if (_categories.isNotEmpty && _selectedCategory != 'All') {
        final exists = _categories.any(
            (c) => c.name.toLowerCase() == _selectedCategory.toLowerCase());
        if (!exists) {
          _selectedCategory = 'All';
        }
      }
    });
  }

  List<MenuItemModel> get _displayedItems {
    List<MenuItemModel> all = [];
    if (_selectedCategory == 'All') {
      for (final cat in _categories) {
        all.addAll(cat.items);
      }
    } else {
      final match = _categories.firstWhere(
        (c) => c.name.toLowerCase() == _selectedCategory.toLowerCase(),
        orElse: () => MenuCategoryModel(name: '', items: []),
      );
      all = match.items;
    }

    if (_searchFilter.trim().isNotEmpty) {
      final q = _searchFilter.trim().toLowerCase();
      all = all
          .where((i) =>
              i.name.toLowerCase().contains(q) ||
              (i.description?.toLowerCase().contains(q) ?? false))
          .toList();
    }
    return all;
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.cafe.name, style: AppTypography.heading2.copyWith(fontSize: 16)),
            Text(
              widget.cafe.area,
              style: AppTypography.caption.copyWith(color: AppColors.primary, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () => _showMenuSearchDialog(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const LoadingIndicator(message: 'Loading verified menu items...')
            : _categories.isEmpty
                ? _buildEmptyOrAwaitingState(context)
                : Column(
                    children: [
                      // Table ordering notice bar if enabled
                      if (widget.cafe.isOrderingEnabled)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          color: AppColors.primaryLight,
                          child: const Row(
                            children: [
                              Icon(
                                Icons.table_restaurant_rounded,
                                size: 16,
                                color: AppColors.primary,
                              ),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Table ordering active! Add items to your cart and select your table.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.primaryDark,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Horizontal Category Filter Pills
                      Container(
                        height: 48,
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          children: [
                            _buildCategoryPill('All'),
                            ..._categories.map((c) => _buildCategoryPill(c.name)),
                          ],
                        ),
                      ),
                      const Divider(height: 1),

                      // Items Header
                      Padding(
                        padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '$_selectedCategory (${_displayedItems.length})',
                              style: AppTypography.heading2.copyWith(fontSize: 17),
                            ),
                            if (_searchFilter.isNotEmpty)
                              GestureDetector(
                                onTap: () => setState(() => _searchFilter = ''),
                                child: const Text(
                                  'Clear Search',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),

                      // Text-Only Menu Items List (Strictly NO Food Photographs!)
                      Expanded(
                        child: LayoutBuilder(
                          builder: (context, constraints) {
                            if (_displayedItems.isEmpty) {
                              return Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Text(
                                    _searchFilter.isNotEmpty
                                        ? 'No items found matching "$_searchFilter"'
                                        : 'No items in this category',
                                    style: AppTypography.bodySmall,
                                  ),
                                ),
                              );
                            }

                            final isWide = constraints.maxWidth >= 550;
                            if (isWide) {
                              return GridView.builder(
                                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  crossAxisSpacing: 14,
                                  mainAxisSpacing: 14,
                                  childAspectRatio: 2.3,
                                ),
                                itemCount: _displayedItems.length,
                                itemBuilder: (context, index) {
                                  return _buildMenuItemCard(
                                    context,
                                    _displayedItems[index],
                                    cart,
                                    isGrid: true,
                                  );
                                },
                              );
                            }

                            return ListView.separated(
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                              itemCount: _displayedItems.length,
                              separatorBuilder: (context, index) => const Divider(height: 24),
                              itemBuilder: (context, index) {
                                return _buildMenuItemCard(
                                  context,
                                  _displayedItems[index],
                                  cart,
                                  isGrid: false,
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
      ),

      // Floating Cart Bar at bottom when items exist in cart
      bottomNavigationBar: (!cart.isEmpty && widget.cafe.isOrderingEnabled)
          ? SafeArea(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${cart.totalItemCount} ${cart.totalItemCount == 1 ? 'item' : 'items'} in cart',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          '₹${cart.subtotal.toStringAsFixed(0)}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const CartScreen()),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Text('View Cart'),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_rounded, size: 16),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildEmptyOrAwaitingState(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surfaceLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.menu_book_rounded,
                size: 48,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Menu is being updated',
              style: AppTypography.heading2.copyWith(fontSize: 18),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              'The menu for ${widget.cafe.name} is currently being updated. Please check back shortly or contact the café directly for today\'s specials.',
              style: AppTypography.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (widget.cafe.phone != null && widget.cafe.phone!.isNotEmpty) ...[
                  ElevatedButton.icon(
                    icon: const Icon(Icons.phone_rounded, size: 16),
                    label: const Text('Call Café'),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Calling ${widget.cafe.name}: ${widget.cafe.phone}')),
                      );
                    },
                  ),
                  const SizedBox(width: 12),
                ],
                OutlinedButton.icon(
                  icon: const Icon(Icons.arrow_back_rounded, size: 16),
                  label: const Text('Back to Café Details'),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItemCard(
    BuildContext context,
    MenuItemModel item,
    CartProvider cart, {
    required bool isGrid,
  }) {
    final qty = cart.getItemQuantity(item.id);
    final isAvailable = item.isAvailable;

    final content = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Item Info (Name, Description, Veg icon, Price, Source)
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  // Veg / Non-Veg Indicator Icon
                  Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: item.isVeg
                            ? const Color(0xFF16A34A)
                            : const Color(0xFFDC2626),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Icon(
                      Icons.circle,
                      size: 8,
                      color: item.isVeg
                          ? const Color(0xFF16A34A)
                          : const Color(0xFFDC2626),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      item.name,
                      style: AppTypography.heading3.copyWith(
                        fontSize: 15,
                        color: isAvailable ? AppColors.textPrimary : AppColors.textMuted,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),

              // Description
              if (item.description != null && item.description!.isNotEmpty)
                Text(
                  item.description!,
                  style: AppTypography.bodySmall.copyWith(
                    color: isAvailable ? AppColors.textSecondary : AppColors.textMuted,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              const SizedBox(height: 6),

              // Price & Status Row
              Row(
                children: [
                  Text(
                    '₹${item.price.toStringAsFixed(0)}',
                    style: AppTypography.price.copyWith(
                      color: isAvailable ? AppColors.textPrimary : AppColors.textMuted,
                    ),
                  ),
                  if (!isAvailable) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: const Color(0xFFFCA5A5)),
                      ),
                      child: const Text(
                        'Out of Stock',
                        style: TextStyle(
                          fontSize: 10,
                          color: Color(0xFFB91C1C),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ] else if (item.source != null) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Text(
                        item.source!,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),

        const SizedBox(width: 12),

        // Action Buttons (Add, Stepper, Out of Stock, or In-Store Only)
        if (!isAvailable) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: const Text(
              'Unavailable',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ] else if (widget.cafe.isOrderingEnabled) ...[
          if (qty == 0)
            SizedBox(
              height: 36,
              child: OutlinedButton(
                onPressed: () {
                  cart.addItem(widget.cafe, item);
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  side: const BorderSide(color: AppColors.primary, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text(
                  'ADD',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            )
          else
            Container(
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove, color: Colors.white, size: 16),
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    constraints: const BoxConstraints(),
                    onPressed: () => cart.removeOne(item),
                  ),
                  Text(
                    '$qty',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add, color: Colors.white, size: 16),
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    constraints: const BoxConstraints(),
                    onPressed: () => cart.addItem(widget.cafe, item),
                  ),
                ],
              ),
            ),
        ] else ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: const Text(
              'In-Store Only',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ],
    );

    if (isGrid) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isAvailable ? AppColors.border : AppColors.border.withValues(alpha: 0.5),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: content,
      );
    }

    return content;
  }

  Widget _buildCategoryPill(String name) {
    final isSelected = _selectedCategory.toLowerCase() == name.toLowerCase();
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategory = name;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Center(
          child: Text(
            name,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              color: isSelected ? Colors.white : AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }

  void _showMenuSearchDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) {
        final controller = TextEditingController(text: _searchFilter);
        return AlertDialog(
          title: const Text('Search Menu Items'),
          content: TextField(
            controller: controller,
            autofocus: true,
            decoration: const InputDecoration(
              hintText: 'e.g. Pasta, Nachos, Coffee...',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _searchFilter = controller.text;
                });
                Navigator.pop(ctx);
              },
              child: const Text('Search'),
            ),
          ],
        );
      },
    );
  }
}
