import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitSalesEnquiry } from '../services/leadService';

export default function ContactSales({ selectedPlanInfo, onClearPlan }) {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverFeedback, setServerFeedback] = useState(null);

  // Sync preselected plan message from Pricing section
  useEffect(() => {
    if (selectedPlanInfo?.message) {
      setFormData((prev) => ({
        ...prev,
        message: selectedPlanInfo.message,
      }));
    }
  }, [selectedPlanInfo]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Please enter your name.';
    }

    if (!formData.businessName.trim()) {
      errs.businessName = 'Please enter your café / business name.';
    }

    // Indian phone number validation: 10 digits with optional +91 prefix
    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    const indianPhoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!cleanPhone) {
      errs.phone = 'Please enter your phone number.';
    } else if (!indianPhoneRegex.test(cleanPhone)) {
      errs.phone = 'Please enter a valid 10-digit Indian phone number (e.g. 9876543210 or +91 9876543210).';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerFeedback(null);

    const payload = {
      ...formData,
      selectedPlan: selectedPlanInfo?.plan || '',
      billingCycle: selectedPlanInfo?.billing || '',
      planPrice: selectedPlanInfo?.price || '',
    };

    try {
      const response = await submitSalesEnquiry(payload);
      setIsSubmitted(true);
      setServerFeedback(response);
    } catch (err) {
      setErrors({ form: err.message || 'Could not send enquiry. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      businessName: '',
      phone: '',
      email: '',
      message: '',
    });
    setErrors({});
    setIsSubmitted(false);
    setServerFeedback(null);
    if (onClearPlan) {
      onClearPlan();
    }
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-zipbi-mint-section border-t border-zipbi-mint-border/60">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block">
              <span className="px-3.5 py-1 rounded-full bg-white border border-zipbi-mint-border text-zipbi-primary text-[12px] font-bold tracking-wider uppercase shadow-2xs">
                CONTACT SALES
              </span>
            </div>

            <h2 className="text-[clamp(2.125rem,3.2vw,2.75rem)] font-bold text-slate-900 tracking-tight leading-[1.15]">
              Let's talk about<br />
              your café.
            </h2>

            <p className="text-[clamp(1rem,1.15vw,1.125rem)] text-slate-600 leading-relaxed max-w-md">
              Tell us about your business and the way you work. Our team can walk you through ZipBi and the planned features for your café.
            </p>

            <div className="pt-2">
              <a
                href="#contact"
                className="text-[13px] font-bold text-zipbi-primary hover:text-zipbi-dark tracking-wide uppercase transition-colors"
              >
                Coimbatore, Tamil Nadu, India
              </a>
            </div>
          </div>

          {/* Right Column: Contact Sales Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-7 sm:p-9 lg:p-10">
              
              <div className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-6">
                CONTACT OUR TEAM
              </div>

              {isSubmitted ? (
                /* Success Confirmation State */
                <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
                  <div className="w-12 h-12 rounded-full bg-zipbi-mint text-zipbi-primary flex items-center justify-center mx-auto shadow-2xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Enquiry Dispatched!
                    </h3>
                    <p className="text-[15px] text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                      Thank you, <strong className="text-slate-900">{formData.name}</strong>. Your enquiry for <strong className="text-slate-900">{formData.businessName}</strong> has been received by our sales team.
                    </p>
                  </div>

                  {selectedPlanInfo && (
                    <div className="bg-slate-50 rounded-xl p-3.5 max-w-xs mx-auto text-[13px] text-slate-600 border border-slate-200/80 text-left space-y-1">
                      <div><span className="text-slate-400">Plan:</span> <strong className="text-slate-900">{selectedPlanInfo.plan} ({selectedPlanInfo.billing})</strong></div>
                      <div><span className="text-slate-400">Rate:</span> <strong className="text-zipbi-primary font-mono">{selectedPlanInfo.price}</strong></div>
                    </div>
                  )}

                  <p className="text-[12px] text-slate-400">
                    Our Coimbatore team will follow up via phone or email within 24 business hours.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-2.5 rounded-full text-[13px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Send another enquiry
                    </button>
                  </div>
                </div>
              ) : (
                /* Form Fields */
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {errors.form && (
                    <div className="flex items-center gap-2 p-3 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errors.form}</span>
                    </div>
                  )}

                  {/* Row 1: Name and Business Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        YOUR NAME <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        className={`w-full px-4 py-2.5 text-[14px] sm:text-[15px] rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zipbi-primary focus:border-zipbi-primary transition-all ${
                          errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                        required
                      />
                      {errors.name && (
                        <p className="text-[12px] text-red-600 mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="businessName" className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        CAFÉ / BUSINESS NAME <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="businessName"
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Enter café / business name"
                        className={`w-full px-4 py-2.5 text-[14px] sm:text-[15px] rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zipbi-primary focus:border-zipbi-primary transition-all ${
                          errors.businessName ? 'border-red-400 bg-red-50/20' : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                        required
                      />
                      {errors.businessName && (
                        <p className="text-[12px] text-red-600 mt-1">{errors.businessName}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Phone and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        PHONE NUMBER <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. 9876543210"
                        className={`w-full px-4 py-2.5 text-[14px] sm:text-[15px] rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zipbi-primary focus:border-zipbi-primary transition-all ${
                          errors.phone ? 'border-red-400 bg-red-50/20' : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                        required
                      />
                      {errors.phone && (
                        <p className="text-[12px] text-red-600 mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        EMAIL ADDRESS <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        className={`w-full px-4 py-2.5 text-[14px] sm:text-[15px] rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zipbi-primary focus:border-zipbi-primary transition-all ${
                          errors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                        required
                      />
                      {errors.email && (
                        <p className="text-[12px] text-red-600 mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Selected Plan Summary Banner (Above message field) */}
                  {selectedPlanInfo && (
                    <div className="p-3.5 rounded-xl bg-zipbi-mint/80 border border-zipbi-mint-border text-xs flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
                        <div>
                          <span className="text-slate-500">Selected Plan:</span>{' '}
                          <strong className="text-slate-900 font-bold">{selectedPlanInfo.plan}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Billing:</span>{' '}
                          <strong className="text-slate-900 font-bold">{selectedPlanInfo.billing}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Price:</span>{' '}
                          <strong className="text-zipbi-primary font-mono font-bold">{selectedPlanInfo.price}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onClearPlan}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline ml-2 flex-shrink-0"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Row 3: Message / Requirements (Editable) */}
                  <div>
                    <label htmlFor="message" className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      MESSAGE / REQUIREMENTS <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us a little about your requirements..."
                      className="w-full px-4 py-2.5 text-[14px] sm:text-[15px] rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-zipbi-primary focus:border-zipbi-primary transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full text-[15px] font-semibold text-white bg-zipbi-primary hover:bg-zipbi-dark active:scale-[0.99] transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Enquiry...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Enquiry</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-slate-400 pt-1">
                    Submitting this form is an enquiry, not an automatic payment or subscription activation.
                  </p>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
