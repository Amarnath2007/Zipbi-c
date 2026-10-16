import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Zap,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function PricingPlans({ onOpenDemo }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [openFaq, setOpenFaq] = useState(null);

  const plans = [
    {
      name: 'Starter',
      badge: 'For Small Kiosks & Stalls',
      priceMonthly: 159,
      priceYearly: 129,
      desc: 'Ideal for tea stalls, juice corners, and small kiosks starting with digital tracking.',
      isPopular: false,
      features: [
        'Basic sales tracking (Cash & UPI)',
        'Daily expense management',
        'Daily evening sales report',
        'Single device login (Mobile/Tablet)',
        'Standard customer support via WhatsApp',
        'Digital PDF bill downloads',
      ],
      notIncluded: [
        'Live inventory tracking',
        'POS smart billing & thermal print',
        'AI business recommendations',
      ],
      ctaText: 'Start Free Trial',
      buttonVariant: 'outline',
    },
    {
      name: 'Growth',
      badge: '⭐ MOST POPULAR • BEST VALUE',
      priceMonthly: 199,
      priceYearly: 159,
      desc: 'Everything growing cafés, grocery stores, and restaurants need for daily speed & control.',
      isPopular: true,
      popularTag: 'Most Popular for Cafés & Stores',
      features: [
        'Everything in Starter, plus:',
        'Full inventory tracking & stock deduction',
        'Superfast 3-second smart billing',
        'Automated WhatsApp receipts to customers',
        'Dynamic UPI QR code generation',
        'Stock management & item catalogs',
        'Up to 3 staff logins with role permissions',
        'Works 100% offline with auto-sync',
      ],
      ctaText: 'Claim 7-Day Free Trial',
      buttonVariant: 'popular',
    },
    {
      name: 'Pro',
      badge: 'For Ambitious Stores & Multi-Item Outlets',
      priceMonthly: 279,
      priceYearly: 229,
      desc: 'Advanced intelligence for busy restaurants, supermarkets, and high-volume food outlets.',
      isPopular: false,
      features: [
        'Everything in Growth, plus:',
        'AI-powered business insights & margins',
        'Predictive low-stock & expiry alerts',
        'Peak rush hour forecasting',
        'Profit margin analysis per menu item',
        'Customer visit frequency & loyalty notes',
        'Multi-device & multi-counter support',
        'Priority 24/7 dedicated support manager',
      ],
      ctaText: 'Start Pro Trial',
      buttonVariant: 'outline',
    },
  ];

  const faqs = [
    {
      q: 'Do I need to buy any special machine or barcode scanner?',
      a: 'No! ZipBi is built to run directly on any normal Android phone, iPhone, or tablet you already own. You can punch bills by touch or use your phone camera as a barcode scanner.',
    },
    {
      q: 'Can my staff use it without altering accounts or deleting bills?',
      a: 'Yes. ZipBi has simple Staff Logins. Your billing helpers can punch orders and take payments, while sensitive numbers (total profit, expenses, and settings) remain password-protected for the owner.',
    },
    {
      q: 'What happens if my shop’s internet goes down?',
      a: 'ZipBi continues working 100% offline! You can punch bills and record sales without interruption. As soon as your internet reconnects, all data automatically syncs safely to the cloud.',
    },
    {
      q: 'Are there any hidden setup or cancellation charges?',
      a: 'Zero hidden fees. You get a full 7-day free trial. If you decide to cancel, you can do so anytime with a single tap. No questions asked.',
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-slate-50/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            Simple, Honest Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Plans That Cost Less Than a{' '}
            <span className="text-emerald-600">Cup of Tea a Day</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            No expensive yearly contracts. Pick the plan that fits your shop. Upgrade, downgrade, or cancel anytime.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-bold ${
                billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              Monthly Billing
            </span>
            <button
              onClick={() =>
                setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')
              }
              className="relative w-14 h-8 bg-slate-200 rounded-full p-1 transition-colors hover:bg-slate-300"
              aria-label="Toggle Billing Cycle"
            >
              <div
                className={`w-6 h-6 rounded-full bg-emerald-600 shadow-md transform transition-transform duration-200 ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-bold ${
                  billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                Annual Billing
              </span>
              <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto mb-16">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl flex flex-col justify-between transition-all duration-300 ${
                  plan.isPopular
                    ? 'bg-white border-2 border-emerald-500 shadow-2xl shadow-emerald-600/15 ring-4 ring-emerald-500/10 lg:-translate-y-2 z-10'
                    : 'bg-white border border-slate-200 shadow-md hover:shadow-xl hover:border-slate-300'
                }`}
              >
                {/* Popular Ribbon */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>Most Popular Choice</span>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Plan Name & Tag */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium min-h-[32px]">
                      {plan.desc}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                        ₹{price}
                      </span>
                      <span className="text-slate-500 font-semibold text-sm">/month</span>
                    </div>
                    <span className="text-xs text-emerald-700 font-semibold mt-1 inline-block">
                      {billingCycle === 'yearly'
                        ? 'Billed annually (₹' + price * 12 + '/yr)'
                        : 'Billed monthly • Cancel anytime'}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      What’s Included:
                    </div>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            plan.isPopular
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className={idx === 0 && plan.isPopular ? 'font-bold text-slate-900' : ''}>
                          {feature}
                        </span>
                      </div>
                    ))}

                    {plan.notIncluded && plan.notIncluded.length > 0 && (
                      <div className="pt-2 space-y-2 border-t border-slate-100/80">
                        {plan.notIncluded.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-400">
                            <span className="w-4 h-4 flex items-center justify-center text-slate-300">
                              ✕
                            </span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card CTA Footer */}
                <div className="p-6 sm:p-8 pt-0">
                  <button
                    onClick={onOpenDemo}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      plan.isPopular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-[11px] text-slate-400 font-medium mt-2.5">
                    Includes 7 days free trial • No card needed
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-16">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                100% Risk-Free 7-Day Trial
              </h4>
              <p className="text-xs sm:text-sm text-slate-500">
                Experience ZipBi in your shop for a full week. If you don't save time and stress, pay nothing.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDemo}
            className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all"
          >
            Start Free Trial Now
          </button>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
              Frequently Asked Questions
            </h3>
            <p className="text-sm text-slate-500">
              Clear answers for busy shop owners
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-emerald-700"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
