import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import PricingPlans from './components/PricingPlans';
import About from './components/About';
import Testimonials from './components/Testimonials';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import GetStartedModal from './components/GetStartedModal';
import { MessageCircle } from 'lucide-react';

export default function App() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleOpenDemo = () => {
    setIsDemoModalOpen(true);
  };

  const handleCloseDemo = () => {
    setIsDemoModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 relative">
      {/* Navigation */}
      <Navbar onOpenDemo={handleOpenDemo} />

      {/* Main Content Sections */}
      <main>
        {/* 1. Hero Section with Interactive Dashboard Preview */}
        <Hero onOpenDemo={handleOpenDemo} />

        {/* 2. Core Features (Sales Tracking, Inventory, Expenses, Billing, AI Insights) */}
        <Features onOpenDemo={handleOpenDemo} />

        {/* 3. How It Works (Daily Business Operations Workflow) */}
        <HowItWorks onOpenDemo={handleOpenDemo} />

        {/* 4. Pricing Plans (Starter ₹159, Growth ₹199 Highlighted, Pro ₹279) */}
        <PricingPlans onOpenDemo={handleOpenDemo} />

        {/* 5. About ZipBi (Built for Indian Local Businesses) */}
        <About onOpenDemo={handleOpenDemo} />

        {/* 6. Testimonials from Local Shop Owners */}
        <Testimonials />

        {/* 7. Final Call to Action */}
        <FinalCTA onOpenDemo={handleOpenDemo} />
      </main>

      {/* Footer */}
      <Footer onOpenDemo={handleOpenDemo} />

      {/* Interactive Modal */}
      <GetStartedModal isOpen={isDemoModalOpen} onClose={handleCloseDemo} />

      {/* Floating WhatsApp Quick Contact Button */}
      <a
        href="https://wa.me/919876543210?text=Hi%20ZipBi,%20I%20want%20to%20know%20more%20about%20managing%20my%20shop"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-full shadow-xl shadow-emerald-700/30 flex items-center gap-2 font-bold text-xs hover:scale-105 active:scale-95 transition-all group"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
        <span className="hidden sm:inline pr-1">Need Help? Chat with Us</span>
      </a>
    </div>
  );
}
