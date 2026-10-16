import React from 'react';
import {
  PhoneCall,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Shield,
  ArrowUp
} from 'lucide-react';

export default function Footer({ onOpenDemo }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand Info (2 cols width on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <a href="#" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-slate-900 p-1 flex items-center justify-center ring-1 ring-emerald-500/40 shadow-sm">
                <img
                  src="/New logo.png"
                  alt="ZipBi Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-white">
                  Zip<span className="text-emerald-400">Bi</span>
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                  AI
                </span>
              </div>
            </a>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              The AI-powered business management platform purpose-built for India's cafés,
              tea shops, grocery stores, and restaurants. Fast billing, easy stock tracking,
              and automated profit intelligence.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Made with ❤️ for Indian Retailers
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-emerald-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-emerald-400 transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-emerald-400 transition-colors">
                  About ZipBi
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenDemo}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Book 2-Min Demo
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Businesses We Serve */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Industries
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Chai & Tea Stalls
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Cafés & Bakeries
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Grocery & Kirana Stores
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Quick Service Restaurants
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Juice & Snack Kiosks
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Contact & Support
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <a href="tel:+918045678900" className="hover:text-white">
                  +91 80 4567 8900
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="hover:text-white">
                  WhatsApp: +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <a href="mailto:support@zipbi.in" className="hover:text-white">
                  support@zipbi.in
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  HSR Layout, Sector 4, Bengaluru, Karnataka 560102
                </span>
              </li>
              <li className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Support: 7:00 AM – 11:00 PM (All 7 Days)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} ZipBi Technologies Pvt. Ltd. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Security & Backup
            </a>
            <button
              onClick={scrollToTop}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
