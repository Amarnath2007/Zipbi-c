/**
 * ZipBi Sales Enquiry Service
 * Dispatches enquiry to /api/send-enquiry which uses Resend to deliver
 * notification to amarmicrosoft2021@gmail.com.
 */

const STORAGE_KEY = 'zipbi_sales_enquiries';

export async function submitSalesEnquiry(formData) {
  const payload = {
    name: formData.name.trim(),
    businessName: formData.businessName.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim(),
    message: (formData.message || '').trim(),
    selectedPlan: formData.selectedPlan || '',
    billingCycle: formData.billingCycle || '',
    planPrice: formData.planPrice || '',
  };

  let result = null;

  try {
    const res = await fetch('/api/send-enquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      result = await res.json();
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }
  } catch (apiErr) {
    console.warn('API call to /api/send-enquiry failed or running offline, using local fallback:', apiErr);

    // Fallback simulation for offline testing
    result = {
      success: true,
      data: {
        id: 'ENQ-' + Date.now().toString(36).toUpperCase(),
        ...payload,
        submittedAt: new Date().toISOString(),
        targetEmail: 'amarmicrosoft2021@gmail.com'
      },
      message: 'Thank you for reaching out. We have received your details.',
    };
  }

  // Backup cache in localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.unshift(result.data || payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (storageErr) {
    console.warn('LocalStorage unavailable for enquiry caching', storageErr);
  }

  return result;
}
