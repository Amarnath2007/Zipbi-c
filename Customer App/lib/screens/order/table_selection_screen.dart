import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class TableSelectionScreen extends StatefulWidget {
  const TableSelectionScreen({super.key});

  @override
  State<TableSelectionScreen> createState() => _TableSelectionScreenState();
}

class _TableSelectionScreenState extends State<TableSelectionScreen> {
  final TextEditingController _tableController = TextEditingController();
  final List<String> _quickTables = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  @override
  void dispose() {
    _tableController.dispose();
    super.dispose();
  }

  void _onConfirm() {
    final text = _tableController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or enter your table number.')),
      );
      return;
    }
    Navigator.pop(context, text);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Select Table Number', style: AppTypography.heading2),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Where are you seated?',
                style: AppTypography.heading1,
              ),
              const SizedBox(height: 8),
              const Text(
                'Look at the number on your café table or tent card and enter it below. QR scanning is optional.',
                style: AppTypography.subtitle,
              ),
              const SizedBox(height: 24),

              // Manual Input
              CustomTextField(
                controller: _tableController,
                hintText: 'Enter table number (e.g. 4 or A2)',
                labelText: 'Table Number',
                prefixIcon: Icons.table_bar_rounded,
                keyboardType: TextInputType.text,
              ),
              const SizedBox(height: 24),

              // Quick Pick Chips
              const Text('Or Quick Pick Table', style: AppTypography.heading3),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _quickTables.map((t) {
                  final isSelected = _tableController.text.trim() == t;
                  return ChoiceChip(
                    label: Text('Table $t'),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    backgroundColor: AppColors.surfaceLight,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textPrimary,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: isSelected ? AppColors.primary : AppColors.border,
                      ),
                    ),
                    onSelected: (_) {
                      setState(() {
                        _tableController.text = t;
                      });
                    },
                  );
                }).toList(),
              ),

              const Spacer(),

              // Confirm Button
              CustomButton(
                text: 'Confirm Table Number',
                onPressed: _onConfirm,
                height: 52,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

