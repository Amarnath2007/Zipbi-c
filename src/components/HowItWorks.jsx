import React, { useState } from 'react';
import {
  Smartphone,
  QrCode,
  Layers,
  Sparkles,
  Check,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Set Up in 5 Minutes on Your Phone',
    desc: 'No expensive computers or technicians needed. Download the ZipBi app, type your shop name, and tap to add your items. You can even click a photo of your paper menu — ZipBi AI types it for you!',
    icon: Smartphone,
    highlight: 'Zero hardware costs',
    badgeText: 'Quick Setup',
    details: [
      'Works on Android & iOS mobile phones',
      'Upload items manually or via paper photo',
      'Set your item prices and custom taxes in 1 tap',
    ],
  },
  {
    step: '02',
    title: 'Punch Bills & Collect UPI in 3 Seconds',
    desc: 'Keep lines moving fast during morning chai and evening dinner rush. Tap items on screen, show dynamic UPI QR code, and send instant WhatsApp bills directly to customers.',
    icon: QrCode,
    highlight: 'No paper bill rolls wasted',
    badgeText: 'Instant Billing',
    details: [
      'Simple touch interface your staff learns in 2 minutes',
      'Dynamic UPI QR code eliminates payment mismatch',
      'Send bills via WhatsApp, SMS, or Bluetooth printer',
    ],
  },
  {
    step: '03',
    title: 'Auto Stock Sync & 2-Tap Expense Logging',
    desc: 'Every item sold automatically deducts inventory. When milk suppliers or vegetable vendors drop items, log the expense in 5 seconds to keep exact books.',
    icon: Layers,
    highlight: 'No missing cash or stock',
    badgeText: 'Real-time Sync',
    details: [
      'Automatic stock deduction with every sale',
      'Record vendor payments & staff advances in 2 clicks',
      'Instant warning before ingredients run out',
    ],
  },
  {
    step: '04',
    title: 'Receive Evening AI Profit Summary on WhatsApp',
    desc: 'Close your store with complete peace of mind. Every evening, ZipBi sends a simple WhatsApp report detailing your total sales, expenses, net profit, and tomorrow’s prep advice.',
    icon: Sparkles,
    highlight: 'Never do late-night manual tally',
    badgeText: 'AI Nightly Report',
    details: [
      'Daily Net Profit = Total Sales - All Expenses',
      'Identifies top selling combos & profitable items',
      'Provides smart reorder reminders for tomorrow morning',
    ],
  },
];

export default function HowItWorks({ onOpenDemo }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Simple Daily Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            How Local Businesses Run Smarter with{' '}
            <span className="text-emerald-600">ZipBi</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            From morning shutter opening to evening cash tally, ZipBi simplifies every single step of your daily business.
          </p>
        </div>

        {/* 4 Step Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative mb-16">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            const isCurrent = activeStep === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 relative border flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-emerald-50/60 border-emerald-400 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30 -translate-y-1'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-slate-200 group-hover:text-emerald-200 transition-colors">
                      {item.step}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded mb-2">
                    {item.badgeText}
                  </span>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.highlight}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison: The Old Way vs The ZipBi Way */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-10 shadow-sm">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
              Why 2,400+ Shop Owners Switched to ZipBi
            </h3>
            <p className="text-sm text-slate-500">
              See the difference in your daily store operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-rose-100">
                <XCircle className="w-5 h-5 text-rose-500" />
                <h4 className="font-bold text-slate-900 text-base">The Old Manual Way</h4>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Handwritten paper bills slow down customer queues</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Items run out mid-rush because nobody tracked milk or stock</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Spending 1 hour every night with a calculator to tally cash & UPI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>No idea whether high-revenue dishes actually made any net profit</span>
                </li>
              </ul>
            </div>

            {/* The ZipBi AI Way */}
            <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-300 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-base">The ZipBi Smart Way</h4>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Punch bills in 3 seconds; WhatsApp digital receipts sent automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Low-stock warnings alert you 2 hours before rush hour starts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Evening WhatsApp report delivers exact sales, expense & net profit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>AI tells you your highest profit combos so you can sell more</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all"
            >
              <span>Switch Your Shop to ZipBi Today</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
