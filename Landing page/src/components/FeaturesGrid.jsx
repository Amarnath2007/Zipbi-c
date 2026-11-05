import React from 'react';

export default function FeaturesGrid() {
  const features = [
    {
      num: '01',
      title: 'Order management',
      desc: 'Receive app orders and enter walk-ins.',
    },
    {
      num: '02',
      title: 'Kitchen display',
      desc: 'Kitchen staff update order progress.',
    },
    {
      num: '03',
      title: 'Menu & availability',
      desc: 'Edit items, prices and availability.',
    },
    {
      num: '04',
      title: 'Sales records',
      desc: 'Review order history and daily sales.',
    },
    {
      num: '05',
      title: 'Inventory controls',
      desc: 'Track availability and basic stock levels.',
    },
    {
      num: '06',
      title: 'QR table ordering',
      desc: 'Scan a table QR to order in the app.',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-14">
          <div className="inline-block">
            <span className="px-3.5 py-1 rounded-full bg-zipbi-mint text-zipbi-primary text-[12px] font-bold tracking-wider uppercase">
              EVERYDAY TOOLS
            </span>
          </div>

          <h2 className="text-[clamp(2.125rem,3.2vw,2.75rem)] font-bold text-slate-900 tracking-tight leading-[1.2]">
            The essentials, connected.
          </h2>

          <p className="text-[clamp(1rem,1.15vw,1.125rem)] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Bring the daily work of a café into one clear workflow.
          </p>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((item) => (
            <div
              key={item.num}
              className="bg-white rounded-2xl border border-slate-200/80 p-7 sm:p-8 shadow-2xs hover:shadow-subtle transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-mono font-bold text-zipbi-primary">
                  {item.num}
                </span>
                <h3 className="text-[clamp(1.0625rem,1.25vw,1.25rem)] font-bold text-slate-900">
                  {item.title}
                </h3>
              </div>
              <p className="text-[15px] sm:text-[16px] text-slate-600 mt-2.5 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
