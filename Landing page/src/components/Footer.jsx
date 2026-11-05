import React from 'react';

export default function Footer() {
  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact Sales', href: '#contact' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-slate-200/80 py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left: Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="ZipBi Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                ZipBi
              </span>
            </div>
            <p className="text-[13px] text-slate-500">
              Smarter operations. Better café experiences.
            </p>
          </div>

          {/* Centre: Nav links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[14px] text-slate-600 font-medium">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="hover:text-zipbi-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right: Location & Sub-label */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-0.5">
            <span className="text-[12px] font-bold uppercase tracking-wider text-zipbi-primary">
              COIMBATORE, INDIA
            </span>
            <span className="text-[12px] text-slate-400">
              Local café operations, connected.
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
