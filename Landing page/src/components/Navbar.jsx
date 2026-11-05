import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'platform', 'features', 'ai-roadmap', 'pricing', 'contact'];
      const scrollPos = window.scrollY + 140;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home', id: 'home' },
    { name: 'Features', href: '#features', id: 'features' },
    { name: 'Pricing', href: '#pricing', id: 'pricing' },
    { name: 'Contact Sales', href: '#contact', id: 'contact' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: ZipBi Logo */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center gap-2.5 focus:outline-none"
            aria-label="ZipBi Home"
          >
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/logo.png"
                alt="ZipBi Logo"
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
            <span className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-900">
              ZipBi
            </span>
          </a>

          {/* Centre: Nav links with 15-17px font size */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-[15px] lg:text-[16px] font-medium transition-colors relative py-1 ${
                    isActive ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zipbi-primary rounded-full animate-in fade-in" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right: Get Started CTA button -> Scrolls to #pricing */}
          <div className="hidden md:flex items-center">
            <a
              href="#pricing"
              onClick={(e) => handleNavClick(e, '#pricing')}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-[15px] font-semibold text-white bg-zipbi-primary hover:bg-zipbi-dark rounded-full transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-5 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="py-2.5 text-[16px] font-medium text-slate-700 hover:text-zipbi-primary"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100">
            <a
              href="#pricing"
              onClick={(e) => handleNavClick(e, '#pricing')}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 text-[15px] font-semibold text-white bg-zipbi-primary hover:bg-zipbi-dark rounded-full shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
