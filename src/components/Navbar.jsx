import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sparkles, PhoneCall } from 'lucide-react';

export default function Navbar({ onOpenDemo }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3'
          : 'bg-white/80 backdrop-blur-sm py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-slate-950 p-1 flex items-center justify-center ring-1 ring-emerald-500/30 shadow-md group-hover:ring-emerald-500/60 transition-all">
              <img
                src="/New logo.png"
                alt="ZipBi Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Zip<span className="text-emerald-600">Bi</span>
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                  AI
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 -mt-1 hidden sm:block">
                Smart Business OS
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#about"
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              About
            </a>
          </nav>

          {/* Desktop CTA & Contact */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+918045678900"
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>+91 80 4567 8900</span>
            </a>
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-4 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              About
            </a>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
              <a
                href="tel:+918045678900"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-slate-50"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Call Us: +91 80 4567 8900</span>
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDemo();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
