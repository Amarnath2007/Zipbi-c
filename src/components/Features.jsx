import React, { useState } from 'react';
import {
  TrendingUp,
  Boxes,
  Wallet,
  Receipt,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Clock,
  QrCode,
  BellRing,
  PieChart,
  MessageSquare
} from 'lucide-react';

const featuresData = [
  {
    id: 'sales',
    title: 'Sales Tracking',
    subtitle: 'Track Every Rupee in Real Time',
    tag: 'Zero Math Errors',
    icon: TrendingUp,
    description:
      'Never wonder where your cash went. ZipBi tracks all your UPI and cash sales automatically throughout the day with crystal-clear profit calculations.',
    points: [
      'Separate cash & UPI collections at a glance',
      'Discover your peak rush hours to staff better',
      'Compare this week vs last week sales instantly',
      'One-tap daily sales report download for accounting',
    ],
    mockPreview: {
      title: "Today's Revenue Breakdown",
      stat: '₹18,420',
      badge: '+21% vs last week',
      bars: [
        { label: 'UPI / QR', value: '₹14,100', percent: '76%', color: 'bg-emerald-500' },
        { label: 'Cash Drawer', value: '₹4,320', percent: '24%', color: 'bg-amber-400' },
      ],
      note: 'Peak hour detected: 5:00 PM – 7:30 PM (68 bills cleared)',
    },
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    subtitle: 'Never Run Out of Fast-Selling Items',
    tag: 'No More Customer Turnaways',
    icon: Boxes,
    description:
      'Every time a bill is punched, ZipBi automatically subtracts raw materials or packaged goods from your stock. Get advance warning before items finish.',
    points: [
      'Low-stock alerts on WhatsApp before peak rush hours',
      'Track raw ingredients (milk, oil, flour) and packed items',
      'Eliminate inventory theft, leaks, and expired items',
      'One-click purchase orders directly to your suppliers',
    ],
    mockPreview: {
      title: 'Automated Stock Guard',
      stat: '3 Items Low Stock',
      badge: 'Action Needed',
      items: [
        { name: 'Fresh Milk 1L', left: '4 Packets left', status: 'Critically Low', urgent: true },
        { name: 'Paper Cups (150ml)', left: '45 Units left', status: 'Reorder by 6 PM', urgent: false },
        { name: 'Sunflower Cooking Oil', left: '2 Cans left', status: 'Supplier Dispatched', urgent: false },
      ],
      note: 'Supplier WhatsApp order template pre-filled with 1 click',
    },
  },
  {
    id: 'expense',
    title: 'Expense Tracking',
    subtitle: 'Know Your Exact Daily Net Profit',
    tag: 'No Paper Registers',
    icon: Wallet,
    description:
      'Log daily vendor supplies, vegetables, milk, cylinder refills, and staff advances in two taps. ZipBi calculates your real profit every evening.',
    points: [
      'Record milk, groceries, and repair bills in under 5 seconds',
      'Manage staff attendance, daily wages & advance payments',
      'Snap a photo of supplier receipts to save them safely',
      'Real-time Net Profit: (Total Sales - Total Expenses)',
    ],
    mockPreview: {
      title: 'Daily Evening Tally',
      stat: 'Net Profit: ₹5,850',
      badge: 'Today',
      items: [
        { name: 'Vendor: Fresh Vegetables', cost: '-₹1,450', time: '8:30 AM' },
        { name: 'Dairy: Milk & Curd batch', cost: '-₹2,200', time: '11:15 AM' },
        { name: 'Staff Advance (Raju)', cost: '-₹500', time: '3:00 PM' },
      ],
      note: 'Total daily expenses: ₹4,150 • Net margin: 34.2%',
    },
  },
  {
    id: 'billing',
    title: 'Smart Billing',
    subtitle: '3-Second Billing on Mobile or Tablet',
    tag: 'Superfast POS',
    icon: Receipt,
    description:
      'No need to buy expensive, clunky POS machines. Turn any phone or tablet into a lightning-fast billing counter with instant WhatsApp receipts.',
    points: [
      'Punch orders in 3 taps — even a new helper can use it in 2 minutes',
      'Send digital bills via WhatsApp or print on Bluetooth thermal printers',
      'Dynamic UPI QR code automatically shows the exact bill amount',
      'Works 100% offline if the internet drops and syncs when reconnected',
    ],
    mockPreview: {
      title: 'Quick Checkout POS',
      stat: 'Order #314',
      badge: 'Bill Amount: ₹240',
      quickList: [
        '2x Masala Chai (₹30)',
        '1x Bun Maska (₹40)',
        '2x Veg Puff (₹50)',
        '1x Cold Coffee (₹120)',
      ],
      note: '⚡ Paid via UPI QR • WhatsApp receipt auto-delivered to customer',
    },
  },
  {
    id: 'ai',
    title: 'AI-Powered Business Insights',
    subtitle: 'A Dedicated Smart Advisor for Your Store',
    tag: 'Simple English, Zero Jargon',
    icon: Sparkles,
    description:
      'ZipBi AI analyzes your sales patterns and gives you clear, profitable suggestions: which combos make you money, when to stock up, and what to drop.',
    points: [
      'Plain-language suggestions — no confusing charts or formulas',
      'Identifies your top-margin items so you can promote them',
      'Predicts weekend ingredient needs based on weather & festive trends',
      'Automated evening audio & text WhatsApp summary for the owner',
    ],
    mockPreview: {
      title: 'ZipBi AI Smart Assistant',
      stat: 'High-Profit Opportunity',
      badge: 'AI Recommendation',
      aiQuotes: [
        '💡 "Your Evening Snack Combo (Chai + Samosa) has a 62% profit margin. Offer a ₹5 discount combo to increase orders by 25%."',
        '⚠️ "Cooking oil cost rose by 4%. Adjust wholesale order to 15L tin to save ₹320 this month."',
      ],
      note: 'Audio voice summary also available in Hindi, Tamil & Kannada',
    },
  },
];

export default function Features({ onOpenDemo }) {
  const [activeTab, setActiveTab] = useState(0);
  const activeFeature = featuresData[activeTab];

  return (
    <section id="features" className="py-20 md:py-28 bg-slate-50/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Built for Daily Store Operations
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Everything You Need to Run Your Shop,{' '}
            <span className="text-emerald-600">Without the Tech Headache</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Designed specifically for local business owners. No complicated training, no expensive
            hardware. Just simple, reliable tools that save you hours every single day.
          </p>
        </div>

        {/* Feature Selector Tabs (Pills) */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-10 gap-2 sm:gap-3 no-scrollbar">
          {featuresData.map((feature, index) => {
            const Icon = feature.icon;
            const isSelected = activeTab === index;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md ring-2 ring-emerald-500/50 scale-[1.02]'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}
                />
                <span>{feature.title}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Feature Showcase Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-10 lg:p-12 transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Explanations & Bullet Points (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  {activeFeature.tag}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Feature {activeTab + 1} of 5
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                  {activeFeature.subtitle}
                </h3>
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                  {activeFeature.description}
                </p>
              </div>

              {/* Bullet Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {activeFeature.points.map((point, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={onOpenDemo}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  <span>Try {activeFeature.title} Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  ⚡ Setup takes under 5 minutes
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Mock Visual Card (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-950 text-white p-6 shadow-2xl relative overflow-hidden">
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>

                {/* Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Live Simulation
                    </span>
                    <h4 className="text-base font-bold text-white">
                      {activeFeature.mockPreview.title}
                    </h4>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeFeature.mockPreview.badge}
                  </span>
                </div>

                {/* Big Stat */}
                <div className="mb-5">
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {activeFeature.mockPreview.stat}
                  </div>
                </div>

                {/* Conditional UI based on feature */}
                {activeFeature.id === 'sales' && (
                  <div className="space-y-3 mb-4">
                    {activeFeature.mockPreview.bars.map((bar, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-300">
                          <span>{bar.label}</span>
                          <span>{bar.value} ({bar.percent})</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${bar.color}`} style={{ width: bar.percent }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeFeature.id === 'inventory' && (
                  <div className="space-y-2 mb-4">
                    {activeFeature.mockPreview.items.map((item, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          item.urgent
                            ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{item.name}</div>
                          <div className="text-[11px] opacity-75">{item.left}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.urgent
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {activeFeature.id === 'expense' && (
                  <div className="space-y-2 mb-4">
                    {activeFeature.mockPreview.items.map((exp, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{exp.name}</div>
                          <div className="text-[11px] text-slate-400">{exp.time}</div>
                        </div>
                        <span className="font-mono font-bold text-rose-400">{exp.cost}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeFeature.id === 'billing' && (
                  <div className="space-y-1.5 mb-4 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 mb-1">Items punched:</div>
                    {activeFeature.mockPreview.quickList.map((item, i) => (
                      <div key={i} className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                {activeFeature.id === 'ai' && (
                  <div className="space-y-2.5 mb-4">
                    {activeFeature.mockPreview.aiQuotes.map((quote, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200 font-medium leading-relaxed"
                      >
                        {quote}
                      </div>
                    ))}
                  </div>
                )}

                {/* Note Footer */}
                <div className="pt-3 border-t border-slate-800 text-[11px] text-emerald-400/90 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{activeFeature.mockPreview.note}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Feature Quick Grid Overview */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {featuresData.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                onClick={() => setActiveTab(i)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all text-left ${
                  activeTab === i
                    ? 'bg-emerald-50/70 border-emerald-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                    activeTab === i
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{f.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{f.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
