import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';

const reviews = [
  {
    name: 'Suresh R.',
    role: 'Owner, Chaipat Tea & Snack Bar',
    location: 'Indiranagar, Bengaluru',
    metric: 'Saves 2 hours every evening',
    text: 'Earlier, my staff and I would spend 45 minutes every night counting cash, checking UPI messages, and calculating milk expenses on a paper diary. With ZipBi, I press one button and get the exact net profit on my WhatsApp. It is magic.',
    rating: 5,
    businessType: 'Tea & Snacks',
  },
  {
    name: 'Mahesh Sharma',
    role: 'Owner, Sharma Super Mart',
    location: 'Kothrud, Pune',
    metric: 'Reduced dead stock by 35%',
    text: 'For a kirana store with 800+ items, other software was way too complicated and needed a PC. ZipBi runs right on my Samsung phone. The low-stock alert tells me what to reorder before customers ask.',
    rating: 5,
    businessType: 'Grocery & Kirana',
  },
  {
    name: 'Abdul Qadir',
    role: 'Partner, Al-Noor Biryani & Rolls',
    location: 'Mehdipatnam, Hyderabad',
    metric: '4x faster customer billing',
    text: 'During our 7 PM to 10 PM dinner rush, slow billing meant long queues and unhappy customers. ZipBi punches a bill and sends the WhatsApp receipt in 3 seconds. Even my new helper learned it in 5 minutes.',
    rating: 5,
    businessType: 'Restaurant',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-slate-50 border-t border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            Loved by Neighborhood Stores
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Real Stories from Real Shopkeepers
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            See how everyday local businesses run calmer and earn more with ZipBi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Rating & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {rev.businessType}
                  </span>
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-6 italic">
                  "{rev.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{rev.name}</h4>
                    <p className="text-[11px] text-slate-500">{rev.role}</p>
                    <p className="text-[10px] text-slate-400">{rev.location}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md block">
                      {rev.metric}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
