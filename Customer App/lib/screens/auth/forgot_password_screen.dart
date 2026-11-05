import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final TextEditingController _contactController = TextEditingController();
  bool _otpSent = false;
  final TextEditingController _otpController = TextEditingController();

  @override
  void dispose() {
    _contactController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _onSendOtp() {
    if (_contactController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your registered phone number or email.')),
      );
      return;
    }
    setState(() => _otpSent = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('OTP sent! Use demo code: 123456')),
    );
  }

  void _onVerifyOtp() {
    if (_otpController.text.trim() == '123456') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification successful. Please set your new password.')),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid OTP. Please enter 123456.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Account Recovery', style: AppTypography.heading2),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Reset Password', style: AppTypography.heading1),
              const SizedBox(height: 8),
              const Text(
                'Enter your phone number or email to receive a secure verification code.',
                style: AppTypography.subtitle,
              ),
              const SizedBox(height: 24),

              CustomTextField(
                controller: _contactController,
                labelText: 'Phone Number or Email',
                prefixIcon: Icons.contact_mail_outlined,
              ),
              const SizedBox(height: 16),

              if (_otpSent) ...[
                CustomTextField(
                  controller: _otpController,
                  labelText: 'Enter 6-Digit OTP',
                  hintText: '123456',
                  prefixIcon: Icons.security_rounded,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 24),
                CustomButton(
                  text: 'Verify OTP & Reset',
                  onPressed: _onVerifyOtp,
                  height: 52,
                ),
              ] else ...[
                CustomButton(
                  text: 'Send Verification OTP',
                  onPressed: _onSendOtp,
                  height: 52,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

