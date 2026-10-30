import React from 'react';

export default function PlatformSection() {
  const experiences = [
    {
      title: 'CUSTOMER APP',
      description: 'Discover cafés, browse menus, scan a table QR, order and track status.',
      tag: 'FREE TO USE · MINIMAL ADS',
    },
    {
      title: 'MERCHANT APP',
      description: 'Role-based views for owners, counter staff and kitchen teams — all in one app.',
      tag: 'OWNER · STAFF · KITCHEN',
    },
    {
      title: 'WEB DASHBOARD',
      description: 'Detailed menu management, reports and settings on a larger screen.',
      tag: 'PHASE 2',
    },
  ];

  return (
    <section id="platform" className="py-20 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-14">
          <div className="inline-block">
            <span className="px-3.5 py-1 rounded-full bg-zipbi-mint text-zipbi-primary text-[12px] font-bold tracking-wider uppercase">
              THE ZIPBI PLATFORM
            </span>
          </div>

          <h2 className="text-[clamp(2.125rem,3.2vw,2.75rem)] font-bold text-slate-900 tracking-tight leading-[1.2]">
            One platform. Three connected experiences.
          </h2>

          <p className="text-[clamp(1rem,1.15vw,1.125rem)] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Designed around the people who run cafés and the people they serve.
          </p>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {experiences.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 p-8 flex flex-col justify-between shadow-2xs hover:shadow-subtle transition-all min-h-[210px]"
            >
              <div>
                <h3 className="text-[clamp(1.125rem,1.3vw,1.3125rem)] font-bold uppercase tracking-wider text-zipbi-primary">
                  {item.title}
                </h3>
                <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed mt-3">
                  {item.description}
                </p>
              </div>

              <div className="pt-6">
                <span className="inline-block px-3 py-1 rounded-full bg-zipbi-mint text-zipbi-primary text-[11px] sm:text-[12px] font-bold tracking-wider uppercase">
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
