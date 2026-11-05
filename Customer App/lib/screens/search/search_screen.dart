import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/cafe_provider.dart';
import '../../providers/location_provider.dart';
import '../../widgets/empty_state_view.dart';
import '../home/widgets/cafe_card.dart';
import 'filters_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    final loc = context.read<LocationProvider>().currentLocation;
    context.read<CafeProvider>().setSearchQuery(
          query,
          lat: loc.latitude,
          lon: loc.longitude,
        );
  }

  @override
  Widget build(BuildContext context) {
    final cafeProvider = context.watch<CafeProvider>();
    final hasQuery = _searchController.text.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back_rounded),
              onPressed: () {
                _searchController.clear();
                _onSearch('');
                Navigator.pop(context);
              },
            ),
            Expanded(
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: TextField(
                  controller: _searchController,
                  autofocus: true,
                  textInputAction: TextInputAction.search,
                  onChanged: (val) {
                    setState(() {});
                    _onSearch(val);
                  },
                  onSubmitted: _onSearch,
                  decoration: InputDecoration(
                    hintText: 'Search cafés, food or area...',
                    hintStyle: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 14,
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: AppColors.textMuted,
                      size: 20,
                    ),
                    suffixIcon: hasQuery
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded,
                                color: AppColors.textMuted, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                              _onSearch('');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.tune_rounded, color: AppColors.primary),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const FiltersScreen()),
                );
              },
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: hasQuery
            ? _buildSearchResults(cafeProvider)
            : _buildSearchSuggestions(cafeProvider),
      ),
    );
  }

  Widget _buildSearchResults(CafeProvider provider) {
    if (provider.allCafes.isEmpty) {
      return EmptyStateView(
        icon: Icons.search_off_rounded,
        title: 'No Cafés Found',
        message: 'We could not find any cafés matching "${_searchController.text}". Try another dish or keyword.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(18),
      itemCount: provider.allCafes.length,
      itemBuilder: (context, index) {
        return CafeCard(
          cafe: provider.allCafes[index],
          style: CafeCardStyle.listTile,
        );
      },
    );
  }

  Widget _buildSearchSuggestions(CafeProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Recent Searches
          if (provider.recentSearches.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Recent Searches', style: AppTypography.heading3),
                GestureDetector(
                  onTap: () => provider.clearRecentSearches(),
                  child: const Text(
                    'Clear All',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...provider.recentSearches.map((s) => ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.history_rounded,
                      color: AppColors.textMuted, size: 20),
                  title: Text(s, style: AppTypography.body),
                  onTap: () {
                    _searchController.text = s;
                    setState(() {});
                    _onSearch(s);
                  },
                )),
            const SizedBox(height: 24),
          ],

          // Popular Searches
          const Text('Popular Searches', style: AppTypography.heading3),
          const SizedBox(height: 12),
          ...provider.popularSearches.map((s) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.search_rounded,
                    color: AppColors.textMuted, size: 20),
                title: Text(s, style: AppTypography.body),
                onTap: () {
                  _searchController.text = s;
                  setState(() {});
                  _onSearch(s);
                },
              )),
        ],
      ),
    );
  }
}

