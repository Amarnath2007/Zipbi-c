import { Resend } from 'resend';

export default async function handler(req, res) {
  // CORS & Content-Type
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { name, businessName, phone, email, message, selectedPlan, billingCycle, planPrice } = req.body || {};

    if (!name || !businessName || !phone || !email) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const recipientEmail = process.env.RESEND_TO || 'amarmicrosoft2021@gmail.com';
    const apiKey = process.env.RESEND_API_KEY;

    let emailResult = null;

    if (apiKey) {
      const resend = new Resend(apiKey);
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <div style="border-bottom: 2px solid #0C7744; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #0C7744; margin: 0; font-size: 20px;">ZipBi — New Café Sales Enquiry</h2>
            <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 13px;">Received from Official ZipBi Website Contact Form</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 140px;"><strong>Client Name:</strong></td>
              <td style="padding: 8px 0; color: #111827;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Café / Business:</strong></td>
              <td style="padding: 8px 0; color: #111827;"><strong>${businessName}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Phone Number:</strong></td>
              <td style="padding: 8px 0; color: #111827;"><a href="tel:${phone}" style="color: #0C7744; text-decoration: none;">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Email Address:</strong></td>
              <td style="padding: 8px 0; color: #111827;"><a href="mailto:${email}" style="color: #0C7744; text-decoration: none;">${email}</a></td>
            </tr>
            ${selectedPlan ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Selected Plan:</strong></td>
              <td style="padding: 8px 0; color: #0C7744; font-weight: bold;">${selectedPlan} Plan (${billingCycle}) — ${planPrice}</td>
            </tr>
            ` : ''}
            ${message ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; vertical-align: top;"><strong>Message:</strong></td>
              <td style="padding: 8px 0; color: #374151; white-space: pre-wrap;">${message}</td>
            </tr>
            ` : ''}
          </table>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
            <p style="margin: 4px 0 0 0;">Operating Base: Coimbatore, Tamil Nadu, India.</p>
          </div>
        </div>
      `;

      emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM || 'ZipBi Sales <onboarding@resend.dev>',
        to: [recipientEmail],
        reply_to: email,
        subject: `New Café Enquiry: ${businessName} (${name})`,
        html: htmlContent,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        name,
        businessName,
        phone,
        email,
        selectedPlan,
        billingCycle,
        planPrice,
      },
      emailDispatched: !!apiKey && !emailResult?.error,
      resendResponse: emailResult,
      message: 'Your enquiry has been received. Our team will contact you shortly.',
    });
  } catch (err) {
    console.error('Vercel API error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
}

