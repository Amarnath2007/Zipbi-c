import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Sparkles, PhoneCall, ShieldCheck } from 'lucide-react';

export default function FinalCTA({ onOpenDemo }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) return;
    setSubmitted(true);
    setTimeout(() => {
      onOpenDemo();
    }, 1200);
  };

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white p-8 sm:p-14 lg:p-16 overflow-hidden shadow-2xl border border-emerald-800/40">
          {/* Subtle decorative circles */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-3xl mx-auto text-center relative z-10">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Ready in 5 Minutes</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Simplify Your Business.{' '}
              <span className="text-emerald-400">Grow with ZipBi.</span>
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8 max-w-2xl mx-auto">
              Stop juggling paper registers, calculator tallying, and stock shortages.
              Start your 7-day free trial now and experience effortless business management on your phone.
            </p>

            {/* Action Box */}
            {submitted ? (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-sm font-bold flex items-center justify-center gap-2 shadow-lg animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Thank you! Setting up your store preview...</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-6"
              >
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter WhatsApp mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm whitespace-nowrap shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Trust Checks */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                7-Day Free Trial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Dedicated Setup Call
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
