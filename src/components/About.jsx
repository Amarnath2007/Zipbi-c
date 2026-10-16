import React from 'react';
import {
  Heart,
  Store,
  Users,
  ShieldCheck,
  Globe2,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function About({ onOpenDemo }) {
  return (
    <section id="about" className="py-20 md:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            Our Mission & Purpose
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Built for the Heroes of Our Neighborhoods
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Local cafés, tea corners, grocery stores, and family restaurants keep India running.
            Yet, most software is bloated, expensive, and filled with complicated English accounting terms.
            We created <strong>ZipBi</strong> to give every store owner simple, enterprise-grade AI tools without the tech headache.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Zero Tech Learning Curve</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              If you or your staff know how to use WhatsApp, you can master ZipBi in under 5 minutes. No manual required.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Regional Language Support</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Available in Hindi, Tamil, Telugu, Kannada, Marathi, Gujarati, and English for effortless daily staff operations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Save 10+ Hours Every Week</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              No more late-night manual register tallying. Evening profit summaries are generated automatically on WhatsApp.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Real Human Help on WhatsApp</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Have a question at 10 PM? Message our support team on WhatsApp and get instant, friendly guidance from real people.
            </p>
          </div>
        </div>

        {/* Impact Numbers Banner */}
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">
                2,400+
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-semibold">
                Active Local Stores
              </div>
            </div>

            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">
                ₹18.5 Cr+
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-semibold">
                Sales Processed
              </div>
            </div>

            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">
                2.8 Sec
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-semibold">
                Avg Bill Punch Speed
              </div>
            </div>

            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">
                4.9 / 5
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-semibold">
                Merchant Satisfaction
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
