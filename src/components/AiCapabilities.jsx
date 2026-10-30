import React from 'react';

export default function AiCapabilities() {
  const capabilities = [
    {
      num: '1',
      title: 'AI Menu Import',
      desc: 'Read on photo or PDF.',
    },
    {
      num: '2',
      title: 'AI Menu Categorization',
      desc: 'Sort items into categories.',
    },
    {
      num: '3',
      title: 'Intelligent Sales Reports',
      desc: 'Summarise sales patterns.',
    },
    {
      num: '4',
      title: 'Business Recommendations',
      desc: 'Suggest next steps.',
    },
    {
      num: '5',
      title: 'Inventory Forecasting',
      desc: 'Anticipate stock needs.',
    },
  ];

  return (
    <section id="ai-roadmap" className="py-20 md:py-24 bg-zipbi-mint-section border-y border-zipbi-mint-border/60">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-16">
          <div className="inline-block">
            <span className="px-3.5 py-1 rounded-full bg-white border border-zipbi-mint-border text-zipbi-primary text-[12px] font-bold tracking-wider uppercase shadow-2xs">
              PLANNED AI CAPABILITIES
            </span>
          </div>

          <h2 className="text-[clamp(2.125rem,3.2vw,2.75rem)] font-bold text-slate-900 tracking-tight leading-[1.2]">
            More insight, less manual work.
          </h2>

          <p className="text-[clamp(1rem,1.15vw,1.125rem)] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AI capabilities are being developed and phased into the product.
          </p>
        </div>

        {/* 5-Column Horizontal Timeline */}
        <div className="relative">
          {/* Subtle horizontal connecting line on desktop */}
          <div className="hidden lg:block absolute top-4 inset-x-12 h-0.5 bg-zipbi-mint-border -z-0" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 relative z-10">
            {capabilities.map((item) => (
              <div key={item.num} className="text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border border-zipbi-mint-border text-zipbi-primary text-[13px] font-bold flex items-center justify-center mb-3.5 shadow-2xs">
                  {item.num}
                </div>
                <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-slate-600 mt-1 max-w-[170px] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
