import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Coffee,
  ShoppingBag,
  UtensilsCrossed,
  Store,
  PhoneCall
} from 'lucide-react';

export default function GetStartedModal({ isOpen, onClose }) {
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('cafe');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shopName || !phone) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setShopName('');
    setPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Get Started with ZipBi</h3>
              <p className="text-[11px] text-emerald-400">7-Day Free Trial • Instant Mobile Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Welcome Aboard, {shopName || 'Partner'}!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                We've sent a 1-click WhatsApp login link to <strong>+91 {phone}</strong>.
                You can start punching bills and testing AI insights immediately on your phone.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
                📱 Our onboarding specialist will also assist you via WhatsApp in your preferred language.
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Business Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Your Business Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBusinessType('cafe')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      businessType === 'cafe'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Coffee className="w-4 h-4 text-emerald-600" />
                    <span>Café / Tea</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessType('grocery')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      businessType === 'grocery'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>Kirana Store</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessType('restaurant')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      businessType === 'restaurant'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                    <span>Restaurant</span>
                  </button>
                </div>
              </div>

              {/* Shop Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Shop or Restaurant Name
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chai Stall or City Supermarket"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp Mobile Number
                </label>
                <div className="relative">
                  <span className="text-slate-400 font-semibold text-xs absolute left-3.5 top-3.5">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-12 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  We'll send your instant login link and demo credentials via WhatsApp.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <span>Launch My 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-[11px] text-slate-400 font-medium">
                No credit card • No machine required • Works on any phone
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
