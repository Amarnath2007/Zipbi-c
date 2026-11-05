import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/services/storage_service.dart';
import '../../widgets/custom_button.dart';
import 'location_permission_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _slides = [
    {
      'title': 'Discover\nCafés Near You',
      'body':
          'Explore menus, find your favourite spots and enjoy great food around you.',
      'icon': Icons.storefront_rounded,
    },
    {
      'title': 'Save Your\nFavourite Cafés',
      'body':
          'Keep track of your favourite places and never miss a good café.',
      'icon': Icons.favorite_rounded,
    },
    {
      'title': 'Cafés Made\nSimple',
      'body':
          'Find nearby cafés, explore menus and get all the details in one place.',
      'icon': Icons.phone_android_rounded,
    },
  ];

  void _onNext() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _finishOnboarding();
    }
  }

  void _finishOnboarding() async {
    await StorageService.setHasSeenOnboarding(true);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LocationPermissionScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar with Logo and Skip Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Image.asset('assets/images/logo/zipbi_logo.png', width: 32, height: 32),
                  _currentPage < 2
                      ? TextButton(
                          onPressed: _finishOnboarding,
                          child: const Text(
                            'Skip',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        )
                      : const SizedBox(height: 48, width: 48),
                ],
              ),
            ),

            // Page View
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          slide['title'] as String,
                          style: AppTypography.heading1.copyWith(
                            fontSize: 28,
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          slide['body'] as String,
                          style: AppTypography.subtitle.copyWith(
                            fontSize: 15,
                            height: 1.45,
                          ),
                        ),
                        const Spacer(),

                        // Thematic Graphic Illustration
                        Center(
                          child: Container(
                            width: 240,
                            height: 240,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  AppColors.primaryLight.withValues(alpha: 0.7),
                                  AppColors.background,
                                ],
                              ),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  width: 140,
                                  height: 140,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.primary
                                            .withValues(alpha: 0.12),
                                        blurRadius: 30,
                                        offset: const Offset(0, 10),
                                      ),
                                    ],
                                  ),
                                  child: Icon(
                                    slide['icon'] as IconData,
                                    size: 64,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const Spacer(),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Bottom Indicators and Next / Get Started Button
            Padding(
              padding: const EdgeInsets.all(28.0),
              child: Column(
                children: [
                  // 3 Dot Indicators
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _slides.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: _currentPage == index ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _currentPage == index
                              ? AppColors.primary
                              : AppColors.border,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Button
                  CustomButton(
                    text: _currentPage == 2 ? 'Get Started →' : 'Next →',
                    onPressed: _onNext,
                    height: 52,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

