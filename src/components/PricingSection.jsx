import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';

export default function PricingSection({ onSelectPlan }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  const handleBookNow = (planName) => {
    const isMonthly = billingCycle === 'monthly';
    const price = planName === 'Basic'
      ? (isMonthly ? '₹219/month' : '₹2,365/year')
      : (isMonthly ? '₹289/month' : '₹2,948/year');
    const billingText = isMonthly ? 'monthly' : 'yearly';
    const message = `I'm interested in the ZipBi ${planName} Plan with ${billingText} billing at ${price}. Please contact me with the next steps.`;

    if (onSelectPlan) {
      onSelectPlan({
        plan: planName,
        billing: isMonthly ? 'Monthly' : 'Yearly',
        price,
        message,
      });
    }

    const target = document.querySelector('#contact');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="pricing" className="py-20 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-block">
            <span className="px-3.5 py-1 rounded-full bg-zipbi-mint text-zipbi-primary text-[12px] font-bold tracking-wider uppercase">
              PRICING
            </span>
          </div>

          <h2 className="text-[clamp(2.125rem,3.2vw,2.75rem)] font-bold text-slate-900 tracking-tight leading-[1.2]">
            Straightforward plans for cafés.
          </h2>

          <p className="text-[clamp(1rem,1.15vw,1.125rem)] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose the plan that fits your business.
          </p>

          {/* Segmented Billing Switch [ MONTHLY ] [ YEARLY ] */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 text-[13px] font-bold tracking-wider rounded-full transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                MONTHLY
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 text-[13px] font-bold tracking-wider rounded-full transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                YEARLY
              </button>
            </div>
          </div>
        </div>

        {/* Two Pricing Cards (Basic & Advanced) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* BASIC Plan Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-9 flex flex-col justify-between shadow-2xs hover:shadow-subtle transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-bold uppercase tracking-wider text-slate-800 block">
                  BASIC
                </span>
                {billingCycle === 'yearly' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-zipbi-mint text-zipbi-primary text-[11px] font-bold tracking-wider uppercase animate-in fade-in">
                    10% OFF
                  </span>
                )}
              </div>

              <div className="mb-6 min-h-[76px] flex flex-col justify-end">
                {billingCycle === 'yearly' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] text-slate-400 line-through font-mono">
                        ₹2,628
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[clamp(2.25rem,3vw,2.75rem)] font-extrabold text-slate-900 tracking-tight font-mono">
                        ₹2,365
                      </span>
                      <span className="text-[14px] font-semibold text-slate-500">
                        / year
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[clamp(2.25rem,3vw,2.75rem)] font-extrabold text-slate-900 tracking-tight font-mono">
                      ₹219
                    </span>
                    <span className="text-[14px] font-semibold text-slate-500">
                      / month
                    </span>
                  </div>
                )}
              </div>

              {/* Inclusions */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100 text-[14px] sm:text-[15px] text-slate-600">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Customer app ordering</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Menu, table and order management</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Kitchen display and walk-in orders</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Availability controls and order history</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Basic daily sales summary</span>
                </div>
              </div>
            </div>

            {/* BOOK NOW Button */}
            <div className="pt-8 mt-4">
              <button
                type="button"
                onClick={() => handleBookNow('Basic')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full text-[14px] font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 active:scale-[0.99] transition-all"
              >
                <span>BOOK NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ADVANCED Plan Card */}
          <div className="bg-white rounded-2xl border-2 border-zipbi-primary/50 p-8 sm:p-9 flex flex-col justify-between relative shadow-2xs hover:shadow-subtle transition-all">
            
            {/* Top Right Badges */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
              {billingCycle === 'yearly' && (
                <span className="px-2.5 py-0.5 rounded-full bg-zipbi-mint text-zipbi-primary text-[11px] font-bold tracking-wider uppercase animate-in fade-in">
                  15% OFF
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-zipbi-mint text-zipbi-primary text-[11px] font-bold tracking-wider uppercase">
                More Insights
              </span>
            </div>

            <div>
              <span className="text-[13px] font-bold uppercase tracking-wider text-slate-800 block mb-4">
                ADVANCED
              </span>

              <div className="mb-6 min-h-[76px] flex flex-col justify-end">
                {billingCycle === 'yearly' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] text-slate-400 line-through font-mono">
                        ₹3,468
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[clamp(2.25rem,3vw,2.75rem)] font-extrabold text-slate-900 tracking-tight font-mono">
                        ₹2,948
                      </span>
                      <span className="text-[14px] font-semibold text-slate-500">
                        / year
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[clamp(2.25rem,3vw,2.75rem)] font-extrabold text-slate-900 tracking-tight font-mono">
                      ₹289
                    </span>
                    <span className="text-[14px] font-semibold text-slate-500">
                      / month
                    </span>
                  </div>
                )}
              </div>

              {/* Inclusions */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100 text-[14px] sm:text-[15px] text-slate-600">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Everything in Basic</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Expanded sales reports and exports</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Detailed staff permissions</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Expense recording</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zipbi-primary stroke-[3] flex-shrink-0 mt-0.5" />
                  <span>Additional inventory features*</span>
                </div>
              </div>
            </div>

            {/* BOOK NOW Button */}
            <div className="pt-8 mt-4">
              <button
                type="button"
                onClick={() => handleBookNow('Advanced')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full text-[14px] font-semibold text-white bg-zipbi-primary hover:bg-zipbi-dark active:scale-[0.99] transition-all shadow-sm"
              >
                <span>BOOK NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Footnote and Customer App note */}
        <div className="text-center mt-10 space-y-1.5 text-[12px] sm:text-[13px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
          <p>*Additional inventory scope will be validated with pilot cafés. Pricing and final feature inclusions are proposed and subject to validation.</p>
          <p className="text-slate-400">Customer app access is free to use, supported by minimal in-app advertising.</p>
        </div>

      </div>
    </section>
  );
}
