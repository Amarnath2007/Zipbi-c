import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="relative bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 xl:gap-16">
          
          {/* Left Column: Text & CTAs (occupies ~48% width on desktop) */}
          <div className="w-full lg:w-[48%] space-y-7">
            
            {/* Supporting Label (12-14px) */}
            <div className="inline-block">
              <span className="px-3.5 py-1 rounded-full bg-zipbi-mint text-zipbi-primary text-[12px] font-bold tracking-wider uppercase">
                MADE FOR LOCAL CAFÉS
              </span>
            </div>

            {/* Main Headline (56-68px responsive on desktop) */}
            <h1 className="text-[clamp(2.5rem,4.2vw,4.125rem)] font-bold text-slate-900 tracking-tight leading-[1.12]">
              Smarter operations.<br />
              Better café<br />
              <span className="text-zipbi-primary">experiences.</span>
            </h1>

            {/* Description (15-18px) */}
            <p className="text-[clamp(1rem,1.15vw,1.125rem)] text-slate-600 leading-relaxed font-normal max-w-lg">
              Manage orders, menus and daily café operations in one place, while making it easier for customers to discover cafés and order.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] font-semibold text-white bg-zipbi-primary hover:bg-zipbi-dark active:scale-[0.98] transition-all shadow-sm"
              >
                <span>Contact Sales</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 transition-all shadow-2xs"
              >
                <span>Explore Features</span>
              </a>
            </div>

            {/* Three Supporting Points (13-14px) */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-[13px] sm:text-[14px] font-medium text-slate-600">
              <div className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-zipbi-primary stroke-[3]" />
                <span>Simple to use</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-zipbi-primary stroke-[3]" />
                <span>Built for local businesses</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-zipbi-primary stroke-[3]" />
                <span>Clear, affordable plans</span>
              </div>
            </div>

          </div>

          {/* Right Column: Rectangular Café Photograph (occupies ~45% width, starts ~53% from left) */}
          <div className="w-full lg:w-[45%] flex justify-center lg:justify-end">
            <div className="w-full max-w-lg lg:max-w-none h-72 sm:h-96 lg:h-[460px] xl:h-[490px] rounded-[16px] overflow-hidden border border-slate-200/80 shadow-subtle bg-slate-50">
              <img
                src="/image.png"
                alt="Café operations with ZipBi"
                className="w-full h-full object-cover object-[80%_center]"
                loading="eager"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
