import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Coffee,
  ShoppingBag,
  UtensilsCrossed,
  Plus,
  Zap,
  ShieldCheck,
  Smartphone,
  WifiOff
} from 'lucide-react';

const businessProfiles = {
  cafe: {
    name: 'Chai & Café',
    icon: Coffee,
    badge: 'Popular for Tea Shops & Cafés',
    sales: '₹14,850',
    salesGrowth: '+18.4%',
    profit: '₹6,420',
    orders: 148,
    upiPercent: 78,
    cashPercent: 22,
    quickItems: [
      { name: 'Special Masala Chai', price: 15, tag: 'Best Seller' },
      { name: 'Bun Maska', price: 40, tag: 'High Margin' },
      { name: 'Filter Coffee', price: 30, tag: 'Fast Item' },
      { name: 'Crispy Samosa (2 pcs)', price: 35, tag: 'Snack' },
    ],
    aiInsight:
      'Evening snack rush starts at 4:30 PM. Bun Maska + Chai combo brings 42% extra profit. Fresh milk stock is low (5L remaining) — reorder suggested.',
    alertItem: 'Amul Full Cream Milk: 5L left (Need 12L for peak hours)',
  },
  grocery: {
    name: 'Grocery & Kirana',
    icon: ShoppingBag,
    badge: 'Optimized for Kirana & Marts',
    sales: '₹34,600',
    salesGrowth: '+14.2%',
    profit: '₹8,150',
    orders: 112,
    upiPercent: 68,
    cashPercent: 32,
    quickItems: [
      { name: 'Aashirvaad Atta 5kg', price: 245, tag: 'Staple' },
      { name: 'Fortune Sunlite 1L', price: 142, tag: 'High Volume' },
      { name: 'Tata Salt 1kg', price: 28, tag: 'Regular' },
      { name: 'Toor Dal Premium 1kg', price: 165, tag: 'Good Margin' },
    ],
    aiInsight:
      'Cooking oil cost increased ₹4/L from vendor this week. Adjust retail price to ₹146 to preserve your 9% margin.',
    alertItem: 'Basmati Rice 25kg: 2 bags remaining (Weekly demand: 8 bags)',
  },
  restaurant: {
    name: 'Restaurant & Dining',
    icon: UtensilsCrossed,
    badge: 'Ideal for QSRs & Diners',
    sales: '₹46,200',
    salesGrowth: '+22.1%',
    profit: '₹17,800',
    orders: 96,
    upiPercent: 82,
    cashPercent: 18,
    quickItems: [
      { name: 'Paneer Butter Masala', price: 260, tag: 'Chef Special' },
      { name: 'Butter Garlic Naan', price: 55, tag: 'Add-on' },
      { name: 'Dum Biryani (Chicken)', price: 280, tag: 'Star Dish' },
      { name: 'Fresh Mint Lime Soda', price: 70, tag: '80% Margin' },
    ],
    aiInsight:
      'Table turnover average is 36 mins tonight. Biryani combos generated ₹16,400 with 68% gross margin.',
    alertItem: 'Amul Cooking Butter: 2 slabs remaining in kitchen cold store',
  },
};

export default function Hero({ onOpenDemo }) {
  const [activeProfile, setActiveProfile] = useState('cafe');
  const [billToast, setBillToast] = useState(null);
  const profile = businessProfiles[activeProfile];

  const handleSimulateBill = (item) => {
    setBillToast(`✅ Bill punched for ${item.name} (₹${item.price}) • Receipt sent via WhatsApp!`);
    setTimeout(() => {
      setBillToast(null);
    }, 3500);
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-white">
      {/* Background Soft Glows & Dots */}
      <div className="absolute inset-0 dot-pattern opacity-60 pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-emerald-100/60 via-emerald-50/20 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Top Header Block */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI-Powered Business OS for Indian Local Stores</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            Run Your Business Smarter with{' '}
            <span className="relative whitespace-nowrap">
              <span className="text-emerald-600">ZipBi</span>
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-emerald-300 -z-10"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 15 Q50 0 100 15"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal mb-8 max-w-2xl mx-auto">
            The all-in-one platform for cafés, restaurants, tea shops, and grocery stores.
            Punch bills in 3 seconds, auto-track stock, record daily expenses, and get plain-English
            AI insights to boost your daily profit.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 active:scale-[0.98] transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all"
            >
              <span>See How It Works</span>
            </a>
          </div>

          {/* Subtext Trust Note */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Free 7-Day Trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Setup in 5 Minutes on Mobile
            </span>
          </div>
        </div>

        {/* Dashboard Preview Container */}
        <div className="mt-14 max-w-5xl mx-auto">
          {/* Profile Switcher Tabs */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl w-fit mx-auto mb-4 border border-slate-200 shadow-inner">
            {Object.keys(businessProfiles).map((key) => {
              const prof = businessProfiles[key];
              const Icon = prof.icon;
              const isActive = activeProfile === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveProfile(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{prof.name}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Mock Dashboard Window */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden ring-1 ring-slate-900/5">
            {/* Top Bar / Window Frame */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <div className="h-4 w-[1px] bg-slate-700 mx-1 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    Z
                  </div>
                  <span className="text-xs font-semibold text-slate-300">
                    ZipBi Dashboard • {profile.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Store Sync
                </span>
                <span className="text-slate-400 font-mono text-[11px]">Today: 5:45 PM</span>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/50">
              {/* Notification Toast */}
              {billToast && (
                <div className="mb-4 p-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    <span>{billToast}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded">
                    Sent
                  </span>
                </div>
              )}

              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {/* Metric 1 */}
                <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Today's Total Sales</span>
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
                      {profile.salesGrowth}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {profile.sales}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>{profile.orders} bills cleared</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>Est. Net Profit</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
                      Real-time
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
                    {profile.profit}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    After daily item & milk costs
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-xs font-semibold mb-1">Payment Mode</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-bold text-slate-900">
                      UPI {profile.upiPercent}%
                    </span>
                    <span className="text-xs text-slate-500">Cash {profile.cashPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${profile.upiPercent}%` }}
                    ></div>
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${profile.cashPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-xs font-semibold mb-1">Avg Billing Speed</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>2.8 sec</span>
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    ⚡ 4x faster than paper
                  </div>
                </div>
              </div>

              {/* Middle Section: Quick Billing + AI Smart Assistant */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Quick Billing Punch Box (7 Cols) */}
                <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Quick 1-Tap Billing Pad
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Click an item to simulate instant bill
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    {profile.quickItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSimulateBill(item)}
                        className="group p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800">
                            {item.tag}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm sm:text-base font-extrabold text-slate-900">
                            ₹{item.price}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 group-hover:underline">
                            <Plus className="w-3 h-3" /> Punch
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Stock Alert Warning Inside Billing Pad */}
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-amber-900">Smart Stock Reminder: </span>
                      <span className="text-amber-800">{profile.alertItem}</span>
                    </div>
                  </div>
                </div>

                {/* Right: AI-Powered Business Advisor (5 Cols) */}
                <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-emerald-900/40 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            ZipBi AI Advisor
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          </div>
                          <span className="text-[10px] text-emerald-400">
                            Trained for Indian Retail & Food
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                        Daily Prompt
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                      "{profile.aiInsight}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span>Automated WhatsApp report ready</span>
                    <button
                      onClick={onOpenDemo}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <span>Try AI Insights</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges Bar */}
        <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-slate-600 text-xs sm:text-sm">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">3-Second Superfast Billing</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Works on Any Smartphone</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Offline Billing Mode</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">100% Safe Cloud Backup</span>
          </div>
        </div>
      </div>
    </section>
  );
}
