import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PlatformSection from './components/PlatformSection';
import FeaturesGrid from './components/FeaturesGrid';
import AiCapabilities from './components/AiCapabilities';
import PricingSection from './components/PricingSection';
import ContactSales from './components/ContactSales';
import Footer from './components/Footer';

export default function App() {
  const [selectedPlanInfo, setSelectedPlanInfo] = useState(null);

  const handleSelectPlan = (planInfo) => {
    setSelectedPlanInfo(planInfo);
  };

  const handleClearPlan = () => {
    setSelectedPlanInfo(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-zipbi-mint selection:text-zipbi-primary">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Main Sections */}
      <main className="flex-grow">
        {/* 1. Hero */}
        <Hero />

        {/* 2. The ZipBi Platform */}
        <PlatformSection />

        {/* 3. Everyday Tools (Core Features) */}
        <FeaturesGrid />

        {/* 4. Planned AI Capabilities */}
        <AiCapabilities />

        {/* 5. Pricing Section with Functional Book Now flow */}
        <PricingSection onSelectPlan={handleSelectPlan} />

        {/* 6. Contact Sales & Enquiry Form */}
        <ContactSales 
          selectedPlanInfo={selectedPlanInfo} 
          onClearPlan={handleClearPlan} 
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
